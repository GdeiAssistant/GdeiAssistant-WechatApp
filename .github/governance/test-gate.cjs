'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const gate = require('./gate.cjs');
const actualPolicy = require('./policy.json');
const { fixture, approve, ownerApproval, evaluate, HEAD, BASE, POLICY, at } = require('./fixtures.cjs');

test('R0 prose passes with an explicit no-review decision and matched rule', () => {
  const f = fixture('README.md');
  const r = evaluate(f);
  assert.equal(r.allowed, true); assert.equal(r.reason, 'review_not_required'); assert.equal(r.rules[0].tier, 'R0');
});

for (const path of ['src/ai_service/auth.py', 'AGENTS.md', 'nested/AGENTS.md', '.coderabbit.yaml', '.coderabbit.yml',
  '.github/engineering.md', '.github/CODEOWNERS', '.github/workflows/ci.yml', 'tests/test_auth.py',
  'fixtures/order.json', 'examples/trading.py', 'docs/deploy.md', 'src/IAM.js', 'package.json', 'package-lock.json',
  'pyproject.toml', 'setup.py', 'requirements-dev.txt', 'src/execution_service.py', '.env.prod']) {
  test(`protected path is R2: ${path}`, () => assert.equal(evaluate(fixture(path)).tier, 'R2'));
}
test('repository-specific protected paths are enforced', () => {
  for (const rule of actualPolicy.r2_paths) {
    assert.equal(evaluate(fixture(rule.endsWith('/') ? `${rule}ordinary.js` : rule)).tier, 'R2');
  }
});
test('ordinary UI behavior defaults to R1', () => assert.equal(evaluate(fixture('pages/home/home.js')).tier, 'R1'));
test('unlisted docs do not silently qualify as R0', () => assert.equal(evaluate(fixture('docs/architecture.md')).tier, 'R1'));
test('code in prose requires a review', () => {
  const f = fixture('README.md'); f.snapshot.files[0].patch = '@@ -1 +1 @@\n-before\n+`npm install`';
  assert.equal(evaluate(f).tier, 'R1');
});
test('strategy and deployment prose are protected', () => {
  const f = fixture('README.md'); f.snapshot.files[0].patch = '@@ -1 +1 @@\n-before\n+Change the trading strategy';
  assert.equal(evaluate(f).tier, 'R2');
});
test('renaming auth into prose preserves R2', () => {
  const f = fixture('README.md'); Object.assign(f.snapshot.files[0], { status: 'renamed', previous_filename: 'src/ai_service/auth.py' });
  assert.equal(evaluate(f).tier, 'R2');
});
test('zero-line pure rename still checks both paths', () => {
  const f = fixture('docs/prose/moved.md'); Object.assign(f.snapshot.files[0], { status: 'renamed', previous_filename: 'AGENTS.md', additions: 0, deletions: 0, patch: '' });
  assert.equal(evaluate(f).tier, 'R2');
});

for (const [name, mutate] of [
  ['partial files', f => { f.snapshot.pr.changed_files = 2; }],
  ['missing patch', f => { delete f.snapshot.files[0].patch; }],
  ['truncated patch', f => { f.snapshot.files[0].additions = 2; }],
  ['binary diff', f => { Object.assign(f.snapshot.files[0], { patch: '', additions: 0, deletions: 0 }); }],
  ['missing old rename path', f => { f.snapshot.files[0].status = 'renamed'; }],
  ['unknown file state', f => { f.snapshot.files[0].status = 'unknown'; }],
  ['path traversal', f => { f.snapshot.files[0].filename = '../README.md'; }],
  ['duplicate file', f => { f.snapshot.files.push(f.snapshot.files[0]); f.snapshot.pr.changed_files = 2; }],
  ['incomplete commit coverage', f => { f.snapshot.pr.commits = 2; }],
  ['unknown head', f => { f.snapshot.pr.head.sha = ''; }],
  ['incomplete snapshot', f => { f.snapshot.complete = false; }],
  ['wrong repository', f => { f.snapshot.repository = 'other/repo'; }],
]) test(`${name} fails closed`, () => { const f = fixture(); mutate(f); assert.throws(() => evaluate(f)); });

test('file API cap is refused even if the count matches', () => {
  const f = fixture(); f.snapshot.files = Array.from({ length: 3000 }, (_, i) => ({ ...f.snapshot.files[0], filename: `src/${i}.js` }));
  f.snapshot.pr.changed_files = 3000; assert.throws(() => evaluate(f), /Incomplete/);
});
test('commit API cap is refused', () => {
  const f = fixture(); f.snapshot.commits = Array(250).fill(f.snapshot.commits[0]); f.snapshot.pr.commits = 250;
  assert.throws(() => evaluate(f), /Incomplete/);
});

test('English and existing Gdei template headings are accepted', () => {
  assert.equal(gate.completeTemplate('## AI assistance\nCodex used.\n## What changed\nFixed governance.\n## How verified\nOffline tests passed.'), true);
  assert.equal(gate.completeTemplate('## AI assistance\nCodex used.\n## 这个 PR 做了什么\n修复评审门槛。\n## 怎么验证的\n离线测试通过。'), true);
  assert.equal(gate.completeTemplate('## AI assistance\nTODO\n## What changed\nTODO\n## How verified\nTODO'), false);
});

test('template comments cannot manufacture headings or expose unfinished comments', () => {
  const ai = '## AI assistance\nCodex used.\n';
  assert.equal(gate.completeTemplate(ai + '<!-- unfinished\n## What changed\nHidden change.\n## How verified\nHidden test.'), false);
  assert.equal(gate.completeTemplate(ai + '## W<!-- removed -->hat changed\nChange detail.\n## How verified\nTest detail.'), false);
  assert.equal(gate.completeTemplate(ai + '<!-- ## What changed\nHidden change. -->\n## How verified\nTest detail.'), false);
});

test('R1 uses completed current-head CodeRabbit evidence without human approval', () => {
  const f = fixture(); approve(f); const r = evaluate(f);
  assert.equal(r.allowed, true); assert.equal(r.ai.coverage, 'reported_complete');
  assert.equal(r.ai.check_id, 100); assert.equal(r.ai.review_id, 10);
});
for (const [name, mutate] of [
  ['stale SHA', f => { f.snapshot.pr.head.sha = 'e'.repeat(40); }],
  ['stale native review SHA', f => { f.snapshot.reviews[0].commit_id = BASE; }],
  ['wrong App ID', f => { f.snapshot.checkRuns[0].app.id = 1; }],
  ['wrong App slug', f => { f.snapshot.checkRuns[0].app.slug = 'forged'; }],
  ['wrong bot ID', f => { f.snapshot.reviews[0].user.id = 1; }],
  ['wrong bot type', f => { f.snapshot.reviews[0].user.type = 'User'; }],
  ['dismissed review', f => { f.snapshot.reviews[0].state = 'DISMISSED'; }],
  ['skipped check', f => { f.snapshot.checkRuns[0].conclusion = 'skipped'; }],
  ['rate-limited neutral', f => { f.snapshot.checkRuns[0].conclusion = 'neutral'; }],
  ['rate-limit green wrapper', f => { f.snapshot.checkRuns[0].output.summary = 'Result: Success - Review rate limited'; }],
  ['no files green wrapper', f => { f.snapshot.checkRuns[0].output.title = 'No files to review'; }],
  ['cancelled', f => { f.snapshot.checkRuns[0].conclusion = 'cancelled'; }],
  ['pending', f => { f.snapshot.checkRuns[0].status = 'in_progress'; }],
  ['review publication missing', f => { f.snapshot.reviews = []; }],
  ['different run ID', f => { f.snapshot.reviews[0].body = f.snapshot.reviews[0].body.replace('11111111', '99999999'); }],
  ['approve command without completed review', f => { f.snapshot.reviews[0].state = 'APPROVED'; f.snapshot.reviews[0].body = 'Approved on request'; }],
  ['review before check started', f => { f.snapshot.reviews[0].submitted_at = at(-200); }],
  ['review after check completed', f => { f.snapshot.reviews[0].submitted_at = at(-10); }],
  ['latest rerun skipped', f => { f.snapshot.checkRuns.push({ ...f.snapshot.checkRuns[0], id: 101, started_at: at(-10), conclusion: 'skipped' }); }],
]) test(`${name} does not count as a completed review`, () => {
  for (const path of ['src/view.js', 'pages/login/login.js']) {
    const f = fixture(path); approve(f); mutate(f);
    const r = evaluate(f); assert.equal(r.allowed, false); assert.equal(r.ai.execution_status, 'unavailable');
  }
});
for (const [name, mutate] of [
  ['unproven full range', f => { f.snapshot.pr.base.sha = 'e'.repeat(40); }],
  ['missing coverage', f => { f.snapshot.reviews[0].body = f.snapshot.reviews[0].body.replace('Files selected for processing', 'Unknown format'); }],
  ['wrong coverage path', f => { f.snapshot.reviews[0].body = f.snapshot.reviews[0].body.replace(f.snapshot.files[0].filename, 'src/other.js'); }],
  ['explicit partial', f => { f.snapshot.reviews[0].body += '\nFiles not reviewed: oversized'; }],
  ['no analysis stage', f => { f.snapshot.checkRuns[0].output.summary = f.snapshot.checkRuns[0].output.summary.replace('Generate review feedback', 'Other stage'); }],
  ['candidate config relaxed', f => { f.snapshot.coderabbitConfig += '\n# changed'; }],
  ['command config override', f => { f.snapshot.issueComments.push({ body: '@coderabbitai full review --with-config path_filters=[]' }); }],
]) test(`${name} needs an explicit partial override`, () => {
  for (const path of ['src/view.js', 'pages/login/login.js']) {
    const f = fixture(path); approve(f); mutate(f);
    assert.equal(evaluate(f).ai.coverage, 'partial'); assert.equal(evaluate(f).allowed, false);
    ownerApproval(f, 'override'); assert.equal(evaluate(f).reason, 'approved_with_override');
  }
});
test('R2 uses complete App evidence without any account approval comment', () => {
  const f = fixture('pages/login/login.js'); approve(f);
  const r = evaluate(f);
  assert.equal(r.allowed, true); assert.equal(r.reason, 'current_commit_reviewed');
  assert.equal(r.owner_comment_id, null); assert.equal(r.decision_actor_id, null);
  assert.equal(f.snapshot.issueComments.length, 0);
  f.policy.owner_actors = [];
  assert.equal(evaluate(f).allowed, true);
});
test('human or Grok approve comments cannot satisfy R2 or release revocation', () => {
  for (const login of ['owner', 'grok', 'author']) {
    const f = fixture('pages/login/login.js');
    const c = ownerApproval(f, 'approve'); c.user.login = login;
    assert.equal(evaluate(f).allowed, false);
  }
  const f = fixture('pages/login/login.js'); approve(f); ownerApproval(f, 'revoke');
  ownerApproval(f, 'approve');
  assert.equal(evaluate(f).allowed, false);
  assert.equal(gate.command('/governance approve'), null);
});
for (const decisions of [undefined, [], ['approve', 'revoke']]) {
  test(`missing or unauthorized exception decision rejects override: ${JSON.stringify(decisions)}`, () => {
    const f = fixture('pages/login/login.js'); ownerApproval(f);
    f.policy.owner_actors[0].decisions = decisions;
    assert.equal(evaluate(f).allowed, false);
  });
}
test('exception owner may revoke App-based R2 and is recorded by identity', () => {
  const f = fixture('pages/login/login.js'); approve(f);
  assert.equal(evaluate(f).allowed, true);
  ownerApproval(f, 'revoke');
  const r = evaluate(f);
  assert.equal(r.allowed, false); assert.equal(r.reason, 'owner_revoked');
  assert.equal(r.decision_actor_id, 4); assert.equal(r.decision_actor_login, 'owner');
});
test('only a fresh bound override can release an observed owner hold', () => {
  const f = fixture('pages/login/login.js'); approve(f); ownerApproval(f, 'revoke');
  f.snapshot.ownerWatermark = evaluate(f).owner_watermark;
  ownerApproval(f, 'override');
  assert.equal(evaluate(f).allowed, true);
  assert.equal(evaluate(f).reason, 'approved_with_override');
});
test('an override cannot name unrelated scopes after review conditions are met', () => {
  const f = fixture('pages/login/login.js'); approve(f);
  const c = ownerApproval(f, 'override'); c.body += '\nscope: ai-review-unavailable';
  assert.equal(evaluate(f).allowed, false);
});
for (const [name, mutate] of [
  ['wrong login', (f, c) => { c.user.login = 'impostor'; }],
  ['wrong numeric ID', (f, c) => { c.user.id = 99; }],
  ['bot owner', (f, c) => { c.user.type = 'Bot'; }],
  ['removed permission', f => { f.snapshot.permissions.owner = 'read'; }],
  ['old head', f => { f.snapshot.pr.head.sha = 'e'.repeat(40); }],
  ['old base', f => { f.snapshot.pr.base.sha = 'e'.repeat(40); }],
  ['old evidence', f => { f.snapshot.reviews[0].body += '\nNew review content'; }],
  ['old diff', f => { f.snapshot.files[0].patch = '@@ -1 +1 @@\n-before\n+different'; }],
  ['wrong policy', (f, c) => { c.body = c.body.replace(POLICY, '0'.repeat(64)); }],
  ['duplicate field', (f, c) => { c.body += `\nhead: ${HEAD}`; }],
  ['missing reason', (f, c) => { c.body = c.body.replace(/^reason:.*\n?/m, ''); }],
  ['edited approval', (f, c) => { c.updated_at = at(-10); }],
  ['deleted approval', f => { f.snapshot.issueComments = []; }],
  ['expired approval', (f, c) => { c.created_at = c.updated_at = at(-86401); }],
  ['future approval', (f, c) => { c.created_at = c.updated_at = at(60); }],
  ['copied to another PR', f => { f.snapshot.pr.number++; }],
]) test(`${name} invalidates an exception override`, () => {
  const f = fixture('pages/login/login.js'); approve(f);
  f.snapshot.checkRuns[0].conclusion = 'neutral';
  const c = ownerApproval(f); assert.equal(evaluate(f).allowed, true); mutate(f, c);
  assert.equal(evaluate(f).allowed, false);
});
test('ordinary approval cannot override skip or rate limit', () => {
  for (const conclusion of ['skipped', 'neutral']) {
    const f = fixture('pages/login/login.js'); approve(f); f.snapshot.checkRuns[0].conclusion = conclusion;
    ownerApproval(f, 'approve'); assert.equal(evaluate(f).allowed, false);
  }
});
test('unavailability override stays distinct from completed AI review', () => {
  const f = fixture('pages/login/login.js'); ownerApproval(f, 'override'); const r = evaluate(f);
  assert.equal(r.allowed, true); assert.equal(r.reason, 'approved_with_override'); assert.equal(r.ai.execution_status, 'unavailable');
});
test('findings override names every blocker and every missing-review scope', () => {
  const f = fixture('pages/login/login.js'); approve(f); f.snapshot.reviews[0].state = 'CHANGES_REQUESTED';
  f.snapshot.threads.push({ id: 'thread1', isResolved: false });
  assert.equal(evaluate(f).allowed, false);
  const c = ownerApproval(f, 'override'); assert.equal(evaluate(f).allowed, true);
  c.body = c.body.replace(',thread:thread1', ''); assert.equal(evaluate(f).allowed, false);
});
test('revoke defeats older approval and older edits', () => {
  const f = fixture('pages/login/login.js'); approve(f); const old = ownerApproval(f);
  ownerApproval(f, 'revoke'); assert.equal(evaluate(f).reason, 'owner_revoked');
  old.updated_at = at(0); assert.equal(evaluate(f).allowed, false);
});
test('deleting an observed revoke cannot resurrect an older approval', () => {
  const f = fixture('pages/login/login.js'); approve(f); ownerApproval(f); ownerApproval(f, 'revoke');
  f.snapshot.ownerWatermark = evaluate(f).owner_watermark;
  f.snapshot.issueComments.pop(); assert.equal(evaluate(f).reason, 'owner_decision_invalid');
});
test('malformed latest command blocks old approval, ordinary conversation does not', () => {
  const f = fixture('pages/login/login.js'); approve(f); const old = ownerApproval(f);
  f.snapshot.issueComments.push({ ...old, id: 21, body: 'Thanks for reviewing' }); assert.equal(evaluate(f).allowed, true);
  f.snapshot.issueComments[1].body = '/governance broken'; assert.equal(evaluate(f).allowed, false);
});
test('owner may be PR author but author-provided AI records cannot pass', () => {
  const f = fixture('pages/login/login.js'); f.snapshot.pr.user.id = 4; approve(f);
  assert.equal(evaluate(f).allowed, true);
  f.snapshot.reviews = []; assert.equal(evaluate(f).allowed, false);
});
test('labels and arbitrary self-attestations cannot replace native evidence', () => {
  const f = fixture(); f.snapshot.pr.labels = [{ name: 'owner-approved' }];
  f.snapshot.issueComments.push({ body: '{"schema_version":"ai-review/v1","verdict":"pass"}', user: { id: 1 } });
  assert.equal(evaluate(f).allowed, false);
});

test('PR template needs three distinct sections and an explicit AI heading', () => {
  assert.equal(gate.completeTemplate('## Main changes and tests\nEverything is complete.'), false);
  assert.equal(gate.completeTemplate('## AI changes and tests\nEverything is complete.'), false);
  assert.equal(gate.completeTemplate('## Main work\nCompleted the task.\n## Changes\nUpdated the gate.\n## Tests\nAll tests passed.'), false);
  assert.equal(gate.completeTemplate('## AI assistance\nCodex used.\n## Changes\nUpdated the gate.\n## Tests\nAll tests passed.'), true);
});

test('R0 exemption cannot hide active review blockers', () => {
  const f = fixture('README.md');
  f.snapshot.reviews.push({ id: 1, user: { id: 2, login: 'reviewer', type: 'User' },
    state: 'CHANGES_REQUESTED', commit_id: HEAD, submitted_at: at(-10) });
  assert.equal(evaluate(f).allowed, false);
  f.snapshot.reviews = []; f.snapshot.threads.push({ id: 'thread', isResolved: false });
  assert.equal(evaluate(f).allowed, false);
});

test('provider bold summary markup preserves file coverage evidence', () => {
  const f = fixture(); const review = approve(f);
  review.body = review.body.replace('Files selected for processing: 1</summary>', '<strong>Files selected for processing: 1</strong></summary>');
  assert.equal(evaluate(f).ai.coverage, 'reported_complete');
  assert.equal(evaluate(f).allowed, true);
});
