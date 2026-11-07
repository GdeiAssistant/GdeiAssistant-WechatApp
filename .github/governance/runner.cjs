'use strict';

const gate = require('./gate.cjs');

// Reviewer Apps whose check runs may re-trigger an evaluation. Fixed here rather
// than read from policy.json because the workflow's own event filter cannot read
// the policy, and the two lists have to agree: if a provider is configured but
// its events are dropped, its completion never re-evaluates the gate and a PR
// can sit on a stale result until the next scheduled sweep.
const REVIEWER_APPS = new Set([347564, 1144995]);

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
  if (context.eventName === 'check_run') {
    const check = event.check_run;
    if (!REVIEWER_APPS.has(check.app?.id)) return [];
    if (check.pull_requests?.length) return [...new Set(check.pull_requests.map(pr => pr.number))];
    const prs = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit,
      { ...repo, commit_sha: check.head_sha, per_page: 100 });
    return prs.filter(pr => pr.state === 'open').map(pr => pr.number);
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
  // Two 10-PR sweeps/hour leave room in the standard 1,000 REST requests/hour
  // budget for pagination, permissions and targeted events (about 26 reads/writes
  // per PR before those extras). Refuse overflow rather than silently omit PRs.
  if (prs.length > 10) throw new Error('Sweep exceeds 10 PRs; use targeted dispatch');
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
  const allChecks = await github.paginate(github.rest.checks.listForRef,
    { ...repo, ref: pr.head.sha, filter: 'all', per_page: 100 });
  const checkRuns = allChecks.filter(c => REVIEWER_APPS.has(c.app?.id));
  const statuses = await github.paginate(github.rest.repos.listCommitStatusesForRef,
    { ...repo, ref: pr.head.sha, per_page: 100 });
  const ownerWatermark = Math.max(0, ...statuses.filter(s => s.context?.toLowerCase() === 'risk-gate'
    && s.creator?.id === 41898282 && s.creator.login === 'github-actions[bot]')
    .map(s => Number(/; owner=(\d+)$/.exec(s.description || '')?.[1] || 0)));
  const configAt = async ref => {
    try {
      const { data } = await github.rest.repos.getContent({ ...repo, path: '.coderabbit.yaml', ref });
      if (data.type !== 'file' || data.encoding !== 'base64' || !data.content) throw new Error('Invalid reviewer config');
      return Buffer.from(data.content, 'base64').toString('utf8');
    } catch (error) { if (error.status === 404) return null; throw error; }
  };
  const coderabbitConfig = await configAt(pr.head.sha);
  const trustedCoderabbitConfig = await configAt(policyCommit);
  // When the base tip landed. A reviewer that published its marker before this
  // reviewed a different comparison, and the reader has no other way to tell.
  const { data: baseCommit } = await github.rest.repos.getCommit({ ...repo, ref: pr.base.sha });
  const baseCommitAt = Math.floor(Date.parse(baseCommit.commit?.committer?.date) / 1000);
  if (!Number.isFinite(baseCommitAt)) throw new Error('Unknown base commit time');
  const permissions = {};
  const actors = (policy?.owner_actors || []);
  const records = [...reviews, ...gate.evidenceComments({ issueComments }, actors)];
  for (const user of new Map(records.filter(r => r.user?.type === 'User').map(r => [r.user.login, r.user])).values()) {
    const { data } = await github.rest.repos.getCollaboratorPermissionLevel({ ...repo, username: user.login });
    if (!data.permission || data.user?.id !== user.id) throw new Error('Unknown reviewer permission');
    permissions[user.login] = data.permission;
  }
  return { repository: `${repo.owner}/${repo.repo}`, policyCommit, pr, files, reviews,
    reviewComments, issueComments, commits, threads, permissions, checkRuns, ownerWatermark, statuses,
    coderabbitConfig, trustedCoderabbitConfig, baseCommitAt, complete: true };
}

function snapshotVersion(snapshot, policy) {
  // Compare security-relevant fields, not changing mergeability/cache fields.
  const { pr, issueComments, reviewComments, reviews, threads, checkRuns, ...rest } = snapshot;
  // Publication history is not review evidence; ownerWatermark remains bound.
  delete rest.statuses;
  const secondOpinions = issueComments.filter(c => c.user?.type === 'Bot' && c.user?.login === 'coderabbitai[bot]').map(gate.stableComment);
  const approvals = gate.evidenceComments(snapshot, (policy?.owner_actors || [])).map(gate.stableComment);
  return gate.digest({ ...rest, reviewComments: reviewComments.map(gate.stableComment),
    reviews: reviews.map(gate.stableReview), threads: threads.map(gate.stableThread),
    checkRuns: checkRuns.map(gate.stableCheck), secondOpinions, approvals, pr: { state: pr.state, number: pr.number, body: pr.body,
    head: pr.head.sha, base: pr.base.sha, baseRef: pr.base.ref, baseRepo: pr.base.repo.id,
    author: pr.user.id, changed_files: pr.changed_files, commits: pr.commits } });
}

async function run({ github, context, core, policy, policySha, policyCommit, defaultBranch }) {
  const numbers = await selectTargets(github, context, defaultBranch);
  const repo = context.repo;
  const target = `${context.serverUrl}/${repo.owner}/${repo.repo}/actions/runs/${context.runId}`;
  for (const number of numbers) {
    let head, statusHistory, watermark = 0;
    const status = async (name, state, description) => {
      const history = (statusHistory || []).filter(s => s.context?.toLowerCase() === name);
      // Reserve the last of GitHub's 1,000 slots for a blocking state.
      if (history.length >= 999) {
        state = 'error'; description = 'Commit status limit reached; new head required';
        core.setFailed(`PR #${number}: ${name} status limit reached; new head required`);
      }
      description = `${description.slice(0, 100)}; owner=${watermark}`;
      // REST returns newest first. Never trust a different publisher's status.
      const latest = history[0];
      if (latest?.creator?.id === 41898282 && latest.creator.login === 'github-actions[bot]'
        && latest.state === state && latest.description === description) return;
      if (history.length >= 1000) return; // Already exhausted: report failure, never claim publication.
      const { data } = await github.rest.repos.createCommitStatus({
        ...repo, sha: head, context: name, state, description, target_url: target,
      });
      statusHistory?.unshift(data);
    };
    try {
      const { data: initial } = await github.rest.pulls.get({ ...repo, pull_number: number });
      if (initial.state !== 'open') continue;
      head = initial.head.sha;
      if (initial.base.ref !== defaultBranch) throw new Error('Only the default branch is configured');
      const before = await collect(github, context, number, policyCommit, policy);
      if (before.pr.head.sha !== head) throw new Error('Head changed during collection');
      statusHistory = before.statuses;
      if (before.pr.base.sha !== policyCommit) {
        // A stale base is a stable state, not a failed read: evidence binds to the
        // base the review was compared against, so report an explicit verdict
        // instead of an opaque error until the branch is rebased.
        watermark = before.ownerWatermark || 0;
        const { tier } = gate.classify(before.files, before.pr.changed_files, policy);
        const templateOK = (policy.dependabot_template_exemption && before.pr.user.login === 'dependabot[bot]')
          || gate.completeTemplate(before.pr.body);
        await status('pr-template', templateOK ? 'success' : 'failure', templateOK ? 'PR template complete' : 'Fill AI, changes and verification sections');
        await status('risk-gate', 'failure', `${tier}: base-outdated`);
        await core.summary.addHeading(`PR #${number}: ${tier}`)
          .addCodeBlock(JSON.stringify({ tier, allowed: false, reason: 'base-outdated',
            base_sha: before.pr.base.sha, policy_commit: policyCommit }, null, 2), 'json')
          .addRaw('\n分支基线落后于可信策略提交；rebase 到当前默认分支后重新评估。\n').write();
        // A stale base blocks that PR through its own status; it must not fail the
        // whole sweep, or every push would go red while reviewed PRs wait to rebase.
        core.warning(`PR #${number}: base ${before.pr.base.sha.slice(0, 7)} is behind ${policyCommit.slice(0, 7)}; rebase to evaluate`);
        continue;
      }
      const result = gate.evaluate(before, policy, policySha);
      watermark = result.owner_watermark || before.ownerWatermark || 0;
      const templateOK = (policy.dependabot_template_exemption && before.pr.user.login === 'dependabot[bot]')
        || gate.completeTemplate(before.pr.body);
      const after = await collect(github, context, number, policyCommit, policy);
      if (after.pr.head.sha === head) statusHistory = after.statuses;
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
        .addRaw('\n必需 CI 仍由现有分支保护约束。本记录只核验 CodeRabbit 原始证据，不调用模型或代发批准。\n').write();
      if (!result.allowed || !templateOK) core.setFailed(`PR #${number}: governance evidence missing or invalid`);
    } catch (error) {
      if (head) {
        if (!statusHistory) {
          try {
            statusHistory = await github.paginate(github.rest.repos.listCommitStatusesForRef,
              { ...repo, ref: head, per_page: 100 });
          } catch { /* Still attempt a blocking error if only the read API failed. */ }
        }
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
