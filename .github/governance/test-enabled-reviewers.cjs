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
