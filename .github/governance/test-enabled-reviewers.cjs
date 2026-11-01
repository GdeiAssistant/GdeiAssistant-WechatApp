'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture, approve, ownerApproval, evaluate } = require('./fixtures.cjs');
const { snapshotVersion } = require('./runner.cjs');

for (const enabled of [false, undefined, 'true']) {
  test(`owner must be explicitly enabled (${String(enabled)})`, () => {
    const f = fixture('pages/login/login.js'); approve(f); ownerApproval(f);
    f.policy.owner_actors[0].enabled = enabled;
    assert.equal(evaluate(f).allowed, false);
  });
}
for (const provider of ['dot', 'codex', 'claude', 'duet', 'grok', 'coderabbit']) {
  test(`self-attested ${provider} JSON cannot replace native CodeRabbit review`, () => {
    const f = fixture('pages/login/login.js');
    f.snapshot.issueComments.push({ id: 10, user: { id: 4, login: 'owner', type: 'User' },
      body: JSON.stringify({ schema_version: 'ai-review/v1', ai_review: { provider }, verdict: 'pass' }) });
    ownerApproval(f); assert.equal(evaluate(f).allowed, false);
  });
}
test('minimal legacy override cannot bypass explicit scope and evidence binding', () => {
  const f = fixture('pages/login/login.js'); const c = ownerApproval(f, 'override');
  c.body = JSON.stringify({ schema_version: 'owner-override/v1', head_sha: f.snapshot.pr.head.sha, decision: 'approve' });
  assert.equal(evaluate(f).allowed, false);
});
test('reactions do not invalidate AI or owner evidence; body edits do', () => {
  const f = fixture('pages/login/login.js'); approve(f); ownerApproval(f);
  const before = evaluate(f), version = snapshotVersion(f.snapshot, f.policy);
  for (const c of [...f.snapshot.issueComments, ...f.snapshot.reviews]) c.reactions = { '+1': 1 };
  assert.deepEqual(evaluate(f), before); assert.equal(snapshotVersion(f.snapshot, f.policy), version);
  f.snapshot.reviews[0].body += '\nNew finding';
  assert.equal(evaluate(f).allowed, false); assert.notEqual(snapshotVersion(f.snapshot, f.policy), version);
});

test('check, thread and actor decoration cannot invalidate an approval or readback', () => {
  const f = fixture('pages/login/login.js'); approve(f);
  f.snapshot.threads.push({ id: 'resolved', isResolved: true, isOutdated: false });
  f.snapshot.reviewComments.push({ id: 30, body: 'Fixed', user: { id: 2, login: 'reviewer', type: 'User' } });
  ownerApproval(f);
  const before = evaluate(f), version = snapshotVersion(f.snapshot, f.policy);
  f.snapshot.checkRuns[0].app.description = 'Updated application profile';
  f.snapshot.checkRuns[0].output.annotations_url = 'https://example.com/new-link';
  f.snapshot.threads[0].viewerCanResolve = true;
  for (const record of [...f.snapshot.issueComments, ...f.snapshot.reviews, ...f.snapshot.reviewComments]) {
    record.reactions = { '+1': 1 }; record.user.avatar_url = 'https://example.com/new-avatar';
  }
  assert.deepEqual(evaluate(f), before);
  assert.equal(snapshotVersion(f.snapshot, f.policy), version);
});

for (const [name, mutate] of [
  ['review identity', s => { s.reviews[0].user.login += '-changed'; }],
  ['review state', s => { s.reviews[0].state = 'CHANGES_REQUESTED'; }],
  ['review timestamp', s => { s.reviews[0].submitted_at = s.checkRuns[0].started_at; }],
  ['comment location', s => { s.reviewComments[0].original_start_line = 10; }],
  ['comment position', s => { s.reviewComments[0].position = 3; }],
  ['thread state', s => { s.threads[0].isResolved = false; }],
  ['check result', s => { s.checkRuns[0].conclusion = 'neutral'; }],
  ['check report', s => { s.checkRuns[0].output.summary += '\nChanged report'; }],
]) test(`${name} still invalidates approval and readback`, () => {
  const f = fixture('pages/login/login.js'); approve(f);
  f.snapshot.threads.push({ id: 'resolved', isResolved: true, isOutdated: false });
  f.snapshot.reviewComments.push({ id: 30, body: 'Fixed', user: { id: 2, login: 'reviewer', type: 'User' } });
  ownerApproval(f);
  const before = evaluate(f), version = snapshotVersion(f.snapshot, f.policy);
  assert.equal(before.allowed, true);
  mutate(f.snapshot);
  assert.equal(evaluate(f).allowed, false);
  assert.notEqual(evaluate(f).evidence_sha256, before.evidence_sha256);
  assert.notEqual(snapshotVersion(f.snapshot, f.policy), version);
});
