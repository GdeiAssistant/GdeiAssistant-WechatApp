'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture, approve, aiApproval, ownerApproval, editReceipt, evaluate } = require('./fixtures.cjs');

for (const provider of ['claude', 'duet', 'grokbot', 'grok', 'codex', 'coderabbit', 'nonexistent']) {
  for (const native of [false, true]) {
    test(`R2 rejects ${provider} provenance in ${native ? 'native' : 'comment'} review`, () => {
      const f = fixture('src/ai_service/auth.py');
      const review = native ? approve(f) : aiApproval(f);
      editReceipt(review, value => { value.ai_review.provider = provider; });
      ownerApproval(f);
      assert.equal(evaluate(f).allowed, false);
    });
  }
  test(`R2 rejects ${provider} approval source`, () => {
    const f = fixture('src/ai_service/auth.py');
    aiApproval(f);
    const approval = ownerApproval(f);
    editReceipt(approval, value => { value.approval_source = provider; });
    assert.equal(evaluate(f).allowed, false);
  });
}

test('R2 accepts current-head dot review and active authorized publisher approval', () => {
  const f = fixture('src/ai_service/auth.py');
  aiApproval(f); ownerApproval(f);
  assert.equal(evaluate(f).allowed, true);
});

for (const role of ['ai_review_actors', 'owner_actors']) {
  for (const enabled of [false, undefined, 'true']) {
    test(`${role} must be explicitly enabled (${String(enabled)})`, () => {
      const f = fixture('src/ai_service/auth.py');
      aiApproval(f); ownerApproval(f);
      f.policy[role][0].enabled = enabled;
      assert.equal(evaluate(f).allowed, false);
    });
  }
  test(`${role} cannot authorize a different GitHub identity`, () => {
    const f = fixture('src/ai_service/auth.py');
    aiApproval(f); ownerApproval(f);
    f.policy[role][0].user_id = 99999;
    assert.equal(evaluate(f).allowed, false);
  });
}

test('dot provenance and an approval label without a decision do not satisfy R2', () => {
  const f = fixture('src/ai_service/auth.py');
  aiApproval(f);
  f.snapshot.pr.labels = [{ name: 'owner-approved' }];
  assert.equal(evaluate(f).allowed, false);
});

function overridden() {
  const f = fixture('src/ai_service/auth.py');
  f.policy.owner_override_actor = { user_id: 5, login: 'human-owner', enabled: true };
  f.snapshot.permissions['human-owner'] = 'admin';
  f.snapshot.issueComments.push({ id: 30, user: { id: 5, login: 'human-owner', type: 'User' },
    created_at: '2033-05-18T03:34:00Z', updated_at: '2033-05-18T03:34:00Z',
    body: JSON.stringify({ schema_version: 'owner-override/v1', repository: f.snapshot.repository,
      pr_number: f.snapshot.pr.number, head_sha: f.snapshot.pr.head.sha, decision: 'approve',
      reason: 'Synthetic owner explicitly accepts this exact change' }) });
  return f;
}

test('explicit current-head owner override is audited and needs no AI receipt', () => {
  const result = evaluate(overridden());
  assert.equal(result.allowed, true);
  assert.equal(result.route, 'owner-override');
  assert.equal(result.override_comment_id, 30);
  assert.match(result.evidence_sha256, /^[a-f0-9]{64}$/);
});

for (const [name, mutate] of [
  ['new push', f => { f.snapshot.pr.head.sha = 'e'.repeat(40); }],
  ['disabled owner', f => { f.policy.owner_override_actor.enabled = false; }],
  ['owner permission removed', f => { f.snapshot.permissions['human-owner'] = 'read'; }],
  ['different author ID', f => { f.snapshot.issueComments[0].user.id = 6; }],
  ['different author login', f => { f.snapshot.issueComments[0].user.login = 'impostor'; }],
  ['bot author', f => { f.snapshot.issueComments[0].user.type = 'Bot'; }],
  ['wrong repository', f => { editReceipt(f.snapshot.issueComments[0], v => { v.repository = 'other/repo'; }); }],
  ['wrong PR', f => { editReceipt(f.snapshot.issueComments[0], v => { v.pr_number++; }); }],
  ['revoked decision', f => { editReceipt(f.snapshot.issueComments[0], v => { v.decision = 'revoke'; }); }],
  ['missing reason', f => { editReceipt(f.snapshot.issueComments[0], v => { delete v.reason; }); }],
  ['self-review prose', f => { f.snapshot.issueComments[0].body = 'Self-review complete. Owner approval was authorized.'; }],
  ['unresolved thread', f => { f.snapshot.threads.push({ id: 'thread', isResolved: false }); }],
]) test(`owner override rejects ${name}`, () => {
  const f = overridden(); mutate(f); assert.equal(evaluate(f).allowed, false);
});

test('newer owner revocation cannot be undone by editing an older override', () => {
  const f = overridden();
  const newer = structuredClone(f.snapshot.issueComments[0]); newer.id = 31;
  editReceipt(newer, v => { v.decision = 'revoke'; }); f.snapshot.issueComments.push(newer);
  f.snapshot.issueComments[0].updated_at = '2033-05-18T04:34:00Z';
  assert.equal(evaluate(f).allowed, false);
});

test('override-only actor comments participate in readback race detection', () => {
  const { snapshotVersion } = require('./runner.cjs');
  const f = overridden();
  const version = snapshotVersion(f.snapshot, f.policy);
  editReceipt(f.snapshot.issueComments[0], v => { v.decision = 'revoke'; });
  assert.notEqual(snapshotVersion(f.snapshot, f.policy), version);
});
