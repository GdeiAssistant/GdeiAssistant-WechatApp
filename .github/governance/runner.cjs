'use strict';

const gate = require('./gate.cjs');

async function selectTargets(github, context, defaultBranch) {
  const repo = context.repo;
  const event = context.payload;
  if (context.eventName === 'pull_request_target') return [event.pull_request.number];
  if (context.eventName === 'issue_comment') return event.issue.pull_request ? [event.issue.number] : [];
  if (context.eventName === 'workflow_dispatch') {
    if (context.ref !== `refs/heads/${defaultBranch}`) throw new Error('Dispatch must use the default branch');
    const number = Number(event.inputs?.pr_number);
    if (!Number.isSafeInteger(number) || number < 1) throw new Error('Invalid PR number');
    return [number];
  }
  if (context.eventName === 'workflow_run') {
    const run = event.workflow_run;
    // Associations only choose what to re-read, never what to approve. No relay artifacts.
    const linked = run.pull_requests || [];
    if (linked.length) return [...new Set(linked.map(pr => pr.number))];
    if (!/^[a-f0-9]{40}$/.test(run.head_sha)) throw new Error('Missing relay commit');
    const prs = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit,
      { ...repo, commit_sha: run.head_sha, per_page: 100 });
    const targets = prs.filter(pr => pr.state === 'open').map(pr => pr.number);
    if (targets.length) return [...new Set(targets)];
    // Fork associations may be absent. One bounded serial sweep, never a PR matrix.
  }
  if (!['workflow_run', 'push', 'schedule'].includes(context.eventName)) throw new Error('Unsupported event');
  const prs = await github.paginate(github.rest.pulls.list, { ...repo, state: 'open', base: defaultBranch, per_page: 100 });
  if (prs.length > 100) throw new Error('Sweep exceeds 100 PRs; use targeted dispatch');
  return prs.map(pr => pr.number);
}

async function readThreads(github, repo, number) {
  const threads = [];
  let cursor = null;
  do {
    const data = await github.graphql(`query($owner:String!,$repo:String!,$number:Int!,$cursor:String) {
      repository(owner:$owner,name:$repo) { pullRequest(number:$number) {
        reviewThreads(first:100,after:$cursor) {
          nodes { id isResolved isOutdated }
          pageInfo { hasNextPage endCursor }
        }
      } }
    }`, { ...repo, number, cursor });
    const page = data.repository?.pullRequest?.reviewThreads;
    if (!page || !Array.isArray(page.nodes) || !page.pageInfo) throw new Error('Incomplete threads');
    threads.push(...page.nodes);
    const next = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    if (page.nodes.some(t => !t.id || typeof t.isResolved !== 'boolean') || (page.pageInfo.hasNextPage && (!next || next === cursor))) throw new Error('Invalid thread page');
    cursor = next;
  } while (cursor);
  return threads;
}

async function collect(github, context, number, policyCommit, policy) {
  const repo = context.repo;
  const { data: pr } = await github.rest.pulls.get({ ...repo, pull_number: number });
  const params = { ...repo, pull_number: number, per_page: 100 };
  const files = await github.paginate(github.rest.pulls.listFiles, params);
  const reviews = await github.paginate(github.rest.pulls.listReviews, params);
  const reviewComments = await github.paginate(github.rest.pulls.listReviewComments, params);
  const issueComments = await github.paginate(github.rest.issues.listComments, { ...repo, issue_number: number, per_page: 100 });
  const commits = await github.paginate(github.rest.pulls.listCommits, params);
  const threads = await readThreads(github, repo, number);
  const permissions = {};
  const actors = [...(policy?.owner_actors || []), ...(policy?.ai_review_actors || []), ...(policy?.owner_override_actor ? [policy.owner_override_actor] : [])];
  const records = [...reviews, ...gate.evidenceComments({ issueComments }, actors)];
  for (const user of new Map(records.filter(r => r.user?.type === 'User').map(r => [r.user.login, r.user])).values()) {
    const { data } = await github.rest.repos.getCollaboratorPermissionLevel({ ...repo, username: user.login });
    if (!data.permission || data.user?.id !== user.id) throw new Error('Unknown reviewer permission');
    permissions[user.login] = data.permission;
  }
  return { repository: `${repo.owner}/${repo.repo}`, policyCommit, pr, files, reviews,
    reviewComments, issueComments, commits, threads, permissions, complete: true };
}

function snapshotVersion(snapshot, policy) {
  // Compare security-relevant fields, not changing mergeability/cache fields.
  const { pr, issueComments, reviewComments, ...rest } = snapshot;
  const secondOpinions = issueComments.filter(c => c.user?.type === 'Bot' && c.user?.login === 'coderabbitai[bot]').map(gate.stableComment);
  const approvals = gate.evidenceComments(snapshot, [...(policy?.owner_actors || []), ...(policy?.ai_review_actors || []), ...(policy?.owner_override_actor ? [policy.owner_override_actor] : [])]).map(gate.stableComment);
  return gate.digest({ ...rest, reviewComments: reviewComments.map(gate.stableComment), secondOpinions, approvals, pr: { state: pr.state, number: pr.number, body: pr.body,
    head: pr.head.sha, base: pr.base.sha, baseRef: pr.base.ref, baseRepo: pr.base.repo.id,
    author: pr.user.id, changed_files: pr.changed_files, commits: pr.commits } });
}

async function run({ github, context, core, policy, policySha, policyCommit, defaultBranch }) {
  const numbers = await selectTargets(github, context, defaultBranch);
  const repo = context.repo;
  const target = `${context.serverUrl}/${repo.owner}/${repo.repo}/actions/runs/${context.runId}`;
  for (const number of numbers) {
    let head;
    const status = (name, state, description) => github.rest.repos.createCommitStatus({
      ...repo, sha: head, context: name, state, description: description.slice(0, 140), target_url: target,
    });
    try {
      const { data: initial } = await github.rest.pulls.get({ ...repo, pull_number: number });
      if (initial.state !== 'open') continue;
      head = initial.head.sha;
      await status('risk-gate', 'pending', 'Reading current commit review evidence');
      await status('pr-template', 'pending', 'Checking PR description');
      if (initial.base.ref !== defaultBranch) throw new Error('Only the default branch is configured');
      const before = await collect(github, context, number, policyCommit, policy);
      if (before.pr.head.sha !== head) throw new Error('Head changed during collection');
      const result = gate.evaluate(before, policy, policySha);
      const templateOK = (policy.dependabot_template_exemption && before.pr.user.login === 'dependabot[bot]')
        || gate.completeTemplate(before.pr.body);
      const after = await collect(github, context, number, policyCommit, policy);
      const { data: currentBase } = await github.rest.repos.getBranch({ ...repo, branch: defaultBranch });
      if (snapshotVersion(before, policy) !== snapshotVersion(after, policy) || currentBase.commit.sha !== policyCommit
        || after.pr.base.sha !== policyCommit) throw new Error('Evidence or trusted base changed during evaluation');
      // Expiration may cross during the readback. Never publish an expired decision.
      const final = gate.evaluate(after, policy, policySha);
      if (gate.digest(final) !== gate.digest(result)) throw new Error('Decision changed during evaluation');
      await status('pr-template', templateOK ? 'success' : 'failure', templateOK ? 'PR template complete' : 'Fill AI, changes and verification sections');
      await status('risk-gate', result.allowed ? 'success' : 'failure', `${result.tier}: ${result.reason}`);
      // Only public evidence identifiers/digests; never echo external comment bodies.
      await core.summary.addHeading(`PR #${number}: ${result.tier}`)
        .addCodeBlock(JSON.stringify(result, null, 2), 'json')
        .addRaw('\nRequired CI remains enforced by existing branch protection. QAS is non-blocking shadow; no provider was called.\n').write();
      if (!result.allowed || !templateOK) core.setFailed(`PR #${number}: governance evidence missing or invalid`);
    } catch (error) {
      if (head) {
        await Promise.allSettled([
          status('risk-gate', 'error', 'Evidence unavailable or changed; rerun required'),
          status('pr-template', 'error', 'Evaluation failed; rerun required'),
        ]);
      }
      // Do not print REST response bodies (they can contain user input).
      core.setFailed(`PR #${number}: governance evaluation failed (${error.name || 'Error'})`);
    }
  }
}

module.exports = { selectTargets, readThreads, collect, snapshotVersion, run };
