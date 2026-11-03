'use strict';

const fs = require('node:fs');
const gate = require('./gate.cjs');
const actualPolicy = require('./policy.json');
const HEAD = 'a'.repeat(40), BASE = 'b'.repeat(40), POLICY = 'c'.repeat(64);
const NOW = Math.floor(Date.now() / 1000);
const RUN = '11111111-2222-3333-4444-555555555555';
const at = offset => new Date((NOW + offset) * 1000).toISOString();

function fixture(path = 'src/view.js') {
  const policy = structuredClone(actualPolicy);
  // These fixtures build CodeRabbit evidence — a check run, a review carrying
  // the provider's run ID, and a scope table. Pin the provider so the suite
  // tests that reader, rather than whatever the deployed policy happens to
  // select today. The Codex reader has its own fixture in test-codex.cjs.
  policy.reviewers = {
    ...policy.reviewers,
    R1: { primary: 'coderabbit' },
    R2: { primary: 'coderabbit' },
  };
  policy.owner_actors = [
    { user_id: 4, login: 'owner', enabled: true, decisions: ['override', 'revoke'] },
  ];
  const config = fs.readFileSync('.coderabbit.yaml', 'utf8');
  const snapshot = {
    repository: policy.repository, policyCommit: BASE, complete: true,
    pr: { state: 'open', number: 42, user: { id: 1, login: 'author' }, body: '', changed_files: 1, commits: 1,
      head: { sha: HEAD }, base: { sha: BASE, ref: 'main', repo: { id: 100 } } },
    // The base tip the review has to postdate. Set before every marker in these
    // fixtures, so a fixture only fails the ordering check when a test moves the
    // marker behind it on purpose.
    baseCommitAt: NOW - 3600,
    files: [{ filename: path, status: 'modified', sha: 'd'.repeat(40), additions: 1, deletions: 1, patch: '@@ -1 +1 @@\n-before\n+after' }],
    commits: [{ author: { id: 1 }, committer: { id: 1 } }],
    reviews: [], reviewComments: [], issueComments: [], threads: [], checkRuns: [], ownerWatermark: 0,
    coderabbitConfig: config, trustedCoderabbitConfig: config,
    permissions: { reviewer: 'write', owner: 'admin', author: 'write' },
  };
  return { snapshot, policy };
}

function approve(f) {
  const review = { id: 10, user: { id: f.policy.coderabbit.user_id, login: f.policy.coderabbit.login, type: 'Bot' },
    state: 'COMMENTED', commit_id: HEAD, submitted_at: at(-90), body:
      `<!-- coderabbit-ai-generated:v1 -->\n**Run ID**: \`${RUN}\`\nReviewing files that changed from the base of the PR and between ${BASE} and ${HEAD}.\n`
      + `<details><summary>Files selected for processing: ${f.snapshot.files.length}</summary>\n`
      + f.snapshot.files.map(file => `* \`${file.filename}\``).join('\n') + '\n</details>' };
  f.snapshot.reviews.push(review);
  f.snapshot.checkRuns.push({ id: 100, name: 'CodeRabbit', head_sha: HEAD,
    app: { id: f.policy.coderabbit.app_id, slug: f.policy.coderabbit.app_slug },
    started_at: at(-120), completed_at: at(-60), status: 'completed', conclusion: 'success',
    output: { title: 'Finished', summary: `Result: Success - Review completed\nRun ID: \`${RUN}\`\n`
      + '| Generate review feedback | Completed | 1s |\n| Publish review results | Completed | 1s |' } });
  return review;
}
function approveWithoutFindings(f) {
  const review = approve(f);
  const comment = { id: 50, user: { ...review.user }, created_at: at(-500), updated_at: at(-100),
    body: '<!-- recent_review_start -->\nNo actionable comments were generated in the recent review.\n'
      + review.body.replace(RUN, '66666666-2222-3333-4444-555555555555') + '\n<!-- recent_review_end -->' };
  review.state = 'APPROVED'; review.body = '';
  f.snapshot.issueComments.push(comment);
  return comment;
}
const evaluate = f => gate.evaluate(f.snapshot, f.policy, POLICY, NOW);
function ownerApproval(f, decision = 'override') {
  const result = evaluate(f);
  const fields = [`/governance ${decision}`, `head: ${result.binding.head_sha}`, `base: ${result.binding.base_sha}`, `policy: ${POLICY}`,
    `evidence: ${result.evidence_sha256}`, 'reason: Synthetic account decision for this exact evidence'];
  if (decision === 'override') {
    if (result.required_override_scopes.length) fields.push(`scope: ${result.required_override_scopes.join(',')}`);
    if (result.blocking_findings.length) fields.push(`findings: ${result.blocking_findings.join(',')}`);
  }
  const user = { id: 4, login: 'owner', type: 'User' };
  const comment = { id: 20 + f.snapshot.issueComments.length, user,
    body: fields.join('\n'), created_at: at(-30), updated_at: at(-30) };
  f.snapshot.issueComments.push(comment);
  return comment;
}
// A snapshot that asks the gate to read Codex evidence instead of CodeRabbit's.
// Only the provider selection differs; everything else about the PR is the same,
// because the question being tested is which evidence the gate accepts.
function codexFixture(path = 'pages/home/home.js') {
  const f = fixture(path);
  f.policy.reviewers = { ...f.policy.reviewers, R1: { primary: 'codex' }, R2: { primary: 'codex' } };
  return f;
}

function codexState(f, review, { updated = 1 } = {}) {
  const state = { code_review: { commit_sha: HEAD, has_any_findings: false,
    has_unresolved_findings: false, status: 'completed', ...review }, security_review: {} };
  f.snapshot.issueComments.push({
    id: 900 + f.snapshot.issueComments.length,
    user: { id: f.policy.codex.user_id, login: f.policy.codex.login, type: 'Bot' },
    updated_at: at(updated),
    body: `<!-- codex-review-state:v1 ${JSON.stringify(state)} -->\n\n## Codex Review Summary\n`,
  });
  return f;
}

module.exports = { fixture, codexFixture, codexState, approve, approveWithoutFindings, ownerApproval, evaluate, HEAD, BASE, POLICY, NOW, at };
