'use strict';

// Codex evidence reader.
//
// The gate used to accept one reviewer only: CodeRabbit, whose completion
// evidence had to be reconstructed from a check run, a review body and a run
// ID. That provider is no longer installed, and because the reader required it,
// every pull request in this repository became unapprovable — the gate reported
// `ai-review-unavailable` and the only way past it was an owner override, which
// turns an exception into the routine.
//
// Codex publishes a machine-readable marker instead of prose, so the reader is
// much smaller. These tests pin what could go wrong: accepting a marker for a
// commit that is not the head, accepting an unfinished review, accepting a
// review of a base that has since moved, turning unresolved findings into a
// request for an override instead of a blocker, and reading a missing flag as
// a clean one.

const test = require('node:test');
const assert = require('node:assert/strict');
const { codexFixture, codexState, evaluate, HEAD } = require('./fixtures.cjs');

test('a completed review of the current head approves an R1 change', () => {
  const r = evaluate(codexState(codexFixture()));
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'current_commit_reviewed');
  assert.equal(r.ai.provider, 'codex');
  assert.equal(r.ai.execution_status, 'completed');
});

test('a completed review of the current head approves an R2 change', () => {
  const r = evaluate(codexState(codexFixture('app.js')));
  assert.equal(r.tier, 'R2');
  assert.equal(r.allowed, true);
  assert.equal(r.reason, 'current_commit_reviewed');
});

test('a marker for an older commit does not approve the current head', () => {
  const r = evaluate(codexState(codexFixture(), { commit_sha: 'f'.repeat(40) }));
  assert.equal(r.allowed, false);
  assert.deepEqual(r.required_override_scopes, ['ai-review-unavailable']);
  assert.ok(r.ai.limitations.includes('state_not_current_head'));
});

test('a review that has not finished does not approve anything', () => {
  const r = evaluate(codexState(codexFixture(), { status: 'running' }));
  assert.equal(r.allowed, false);
  assert.ok(r.ai.limitations.includes('review_not_completed'));
});

test('a missing marker is reported, not treated as a clean review', () => {
  const r = evaluate(codexFixture());
  assert.equal(r.allowed, false);
  assert.deepEqual(r.required_override_scopes, ['ai-review-unavailable']);
  assert.ok(r.ai.limitations.includes('current_head_state_missing'));
});

test('the newest marker wins when a pull request was reviewed twice', () => {
  const f = codexState(codexFixture(), { commit_sha: 'f'.repeat(40) }, { updated: -60 });
  codexState(f, { commit_sha: HEAD }, { updated: 1 });
  const r = evaluate(f);
  assert.equal(r.allowed, true);
});

test('unresolved findings block through the thread, not as a coverage gap', () => {
  // An override is for an unavailable reviewer. A reviewer that answered and
  // found something is a blocker, and asking for an override instead would let
  // the finding be waved through with the wrong reason attached.
  const f = codexState(codexFixture(), { has_any_findings: true, has_unresolved_findings: true });
  f.snapshot.threads.push({ id: 7, isResolved: false });
  const r = evaluate(f);
  assert.equal(r.allowed, false);
  assert.equal(r.ai.execution_status, 'completed');
  assert.deepEqual(r.required_override_scopes, ['review-findings']);
  assert.deepEqual(r.blocking_findings, ['thread:7', 'codex-marker:unresolved-findings']);
});

test('a marker finding with no visible thread still blocks', () => {
  // Thread state comes from GitHub; the flag comes from the provider. A finding
  // whose thread is already resolved, or never opened, must not read as clean
  // just because nothing unresolved is listed here.
  const r = evaluate(codexState(codexFixture(), { has_any_findings: true, has_unresolved_findings: true }));
  assert.equal(r.allowed, false);
  assert.deepEqual(r.blocking_findings, ['codex-marker:unresolved-findings']);
  assert.deepEqual(r.required_override_scopes, ['review-findings']);
});

test('a resolved marker passes without a blocker', () => {
  const f = codexState(codexFixture(), { has_any_findings: true, has_unresolved_findings: false });
  f.snapshot.threads.push({ id: 7, isResolved: true });
  const r = evaluate(f);
  assert.equal(r.allowed, true);
  assert.deepEqual(r.blocking_findings, []);
});

test('a completed marker without the findings flag is not a clean pass', () => {
  // Absence of the flag is not evidence that nothing is unresolved.
  const f = codexFixture();
  const state = { code_review: { commit_sha: HEAD, status: 'completed' }, security_review: {} };
  f.snapshot.issueComments.push({
    id: 700, user: { id: f.policy.codex.user_id, login: f.policy.codex.login, type: 'Bot' },
    updated_at: new Date(Date.now() + 1000).toISOString(),
    body: `<!-- codex-review-state:v1 ${JSON.stringify(state)} -->`,
  });
  const r = evaluate(f);
  assert.equal(r.allowed, false);
  assert.ok(r.ai.limitations.includes('review_findings_unknown'));
  // A marker the gate cannot interpret is missing evidence, not partial
  // coverage: the reader never reached a verdict to call partial.
  assert.deepEqual(r.required_override_scopes, ['ai-review-unavailable']);
});

test('a review that predates the base tip does not cover the current comparison', () => {
  // Same head SHA, same marker, but the base moved afterwards: what would merge
  // is not what was reviewed. Ordering is the only range evidence a marker
  // carries, so the review has to be at least as new as the base tip.
  const f = codexState(codexFixture(), {}, { updated: -7200 });
  const r = evaluate(f);
  assert.equal(r.allowed, false);
  assert.ok(r.ai.limitations.includes('base_advanced_since_review'));
  assert.deepEqual(r.required_override_scopes, ['ai-review-unavailable']);
});

test('a review published after the base tip covers it', () => {
  const f = codexState(codexFixture(), {}, { updated: -1800 });
  assert.equal(evaluate(f).allowed, true);
});

test('an unknown base time is reported rather than assumed current', () => {
  const f = codexState(codexFixture());
  delete f.snapshot.baseCommitAt;
  const r = evaluate(f);
  assert.equal(r.allowed, false);
  assert.ok(r.ai.limitations.includes('base_time_unknown'));
});

test('a marker written by another account is ignored', () => {
  const f = codexFixture();
  f.snapshot.issueComments.push({
    id: 1, user: { id: 999, login: 'someone', type: 'Bot' }, updated_at: new Date().toISOString(),
    body: `<!-- codex-review-state:v1 ${JSON.stringify({ code_review: { commit_sha: HEAD, status: 'completed' } })} -->`,
  });
  const r = evaluate(f);
  assert.equal(r.allowed, false);
  assert.ok(r.ai.limitations.includes('current_head_state_missing'));
});

test('a malformed marker is ignored rather than trusted', () => {
  const f = codexFixture();
  f.snapshot.issueComments.push({
    id: 2, user: { id: f.policy.codex.user_id, login: f.policy.codex.login, type: 'Bot' },
    updated_at: new Date().toISOString(),
    body: '<!-- codex-review-state:v1 {not json} -->',
  });
  const r = evaluate(f);
  assert.equal(r.allowed, false);
  assert.ok(r.ai.limitations.includes('current_head_state_missing'));
});

test('the deployed policy reads Codex for R1 and R2', () => {
  const policy = require('./policy.json');
  assert.equal(policy.reviewers.R1.primary, 'codex');
  assert.equal(policy.reviewers.R2.primary, 'codex');
  assert.equal(policy.providers.codex, 'sha-bound-review');
  assert.equal(policy.codex.login, 'chatgpt-codex-connector[bot]');
});
