'use strict';

const gate = require('./gate.cjs');
const actualPolicy = require('./policy.json');
const HEAD = 'a'.repeat(40), BASE = 'b'.repeat(40), POLICY = 'c'.repeat(64);
const NOW = 2000000000;

function fixture(path = 'src/view.js') {
  const policy = structuredClone(actualPolicy);
  policy.owner_actors = [{ user_id: 4, login: 'owner', enabled: true }];
  policy.ai_review_actors = [{ user_id: 1, login: 'author', enabled: true }];
  const snapshot = {
    repository: policy.repository, policyCommit: BASE, complete: true,
    pr: { state: 'open', number: 42, user: { id: 1, login: 'author' }, body: '', changed_files: 1, commits: 1,
      head: { sha: HEAD }, base: { sha: BASE, ref: 'main', repo: { id: 100 } } },
    files: [{ filename: path, status: 'modified', sha: 'd'.repeat(40), additions: 1, deletions: 1, patch: '@@ -1 +1 @@\n-before\n+after' }],
    commits: [{ author: { id: 1 }, committer: { id: 1 } }],
    reviews: [], reviewComments: [], issueComments: [], threads: [], permissions: { reviewer: 'write', backup: 'admin', owner: 'admin', author: 'write' },
  };
  return { snapshot, policy };
}

function approve(f, route = 'primary') {
  const result = gate.evaluate(f.snapshot, f.policy, POLICY, NOW);
  const value = {
    schema_version: 'pr-review/v1', ai_review: { provider: 'dot', model: 'test-model', run_ref: 'synthetic-run', mode: 'independent' }, ...result.binding, discussion_sha256: result.discussion_sha256,
    route, reviewer: f.policy.reviewers[result.tier][route], independent: true,
    risk_tier: result.tier, execution_status: 'completed', verdict: 'pass',
    coverage: { complete: true, reviewed_files: f.snapshot.files.length },
    limitations: [], blocking_findings: [], dispositions: [],
    ...(route === 'fallback' ? { fallback_reason: 'Primary maintainer unavailable for this review' } : {}),
  };
  const review = { id: 10, user: { id: route === 'primary' ? 2 : 3, login: route === 'primary' ? 'reviewer' : 'backup', type: 'User' },
    state: 'APPROVED', commit_id: HEAD, submitted_at: '2033-05-18T03:33:20Z', body: JSON.stringify(value) };
  f.snapshot.reviews.push(review);
  return review;
}

function editReceipt(review, fn) {
  const value = JSON.parse(review.body); fn(value); review.body = JSON.stringify(value);
}
const evaluate = f => gate.evaluate(f.snapshot, f.policy, POLICY, NOW);

function ownerApproval(f) {
  const result = evaluate(f);
  const payload = { schema_version: 'owner-approval/v1', ...result.binding, evidence_sha256: result.evidence_sha256,
    comment_id: 20, decision: 'approve', approval_source: 'dot', approval_ref: 'synthetic-dot-record',
    reason: 'Synthetic owner accepts this reviewed scope', issued_at: NOW - 60, expires_at: NOW + 3600 };
  const comment = { id: 20, user: { id: 4, login: 'owner', type: 'User' },
    created_at: '2033-05-18T03:34:00Z', updated_at: '2033-05-18T03:34:00Z', body: JSON.stringify(payload) };
  f.snapshot.issueComments.push(comment);
  return comment;
}

function aiApproval(f) {
  const review = approve(f);
  f.snapshot.reviews.pop();
  const value = JSON.parse(review.body);
  Object.assign(value, { schema_version: 'ai-review/v1', comment_id: 15 });
  value.ai_review.mode = 'self-review';
  const comment = { id: 15, user: { id: 1, login: 'author', type: 'User' },
    created_at: '2033-05-18T03:33:20Z', updated_at: '2033-05-18T03:33:20Z', body: JSON.stringify(value) };
  f.snapshot.issueComments.push(comment);
  return comment;
}

module.exports = { fixture, approve, aiApproval, ownerApproval, editReceipt, evaluate, HEAD, BASE, POLICY, NOW };
