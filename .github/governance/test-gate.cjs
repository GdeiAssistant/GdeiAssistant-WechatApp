'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const gate = require('./gate.cjs');
const actualPolicy = require('./policy.json');
const { fixture, approve, aiApproval, ownerApproval, editReceipt, evaluate, HEAD, POLICY, NOW } = require('./fixtures.cjs');

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

test('R1 primary is an authenticated current-head independent review', () => {
  const f = fixture(); approve(f); assert.equal(evaluate(f).allowed, true); assert.equal(evaluate(f).route, 'primary');
});
test('R1 fallback requires a separate admin review and reason', () => {
  const f = fixture(); const r = approve(f, 'fallback'); assert.equal(evaluate(f).allowed, true);
  editReceipt(r, v => { delete v.fallback_reason; }); assert.equal(evaluate(f).allowed, false);
});

for (const [name, mutate] of [
  ['new head', f => { f.snapshot.pr.head.sha = 'e'.repeat(40); }],
  ['new base', f => { f.snapshot.pr.base.sha = 'e'.repeat(40); }],
  ['wrong native review commit', f => { f.snapshot.reviews[0].commit_id = 'e'.repeat(40); }],
  ['changed patch', f => { f.snapshot.files[0].patch = '@@ -1 +1 @@\n-before\n+changed'; }],
  ['permission removed', f => { f.snapshot.permissions.reviewer = 'read'; }],
  ['PR self-review', f => { f.snapshot.pr.user.id = 2; }],
  ['commit author self-review', f => { f.snapshot.commits[0].author.id = 2; }],
  ['commit committer self-review', f => { f.snapshot.commits[0].committer.id = 2; }],
  ['bot impersonates reviewer', f => { f.snapshot.reviews[0].user.type = 'Bot'; }],
  ['dismissed review', f => { f.snapshot.reviews[0].state = 'DISMISSED'; }],
  ['commented review', f => { f.snapshot.reviews[0].state = 'COMMENTED'; }],
  ['changes requested', f => { f.snapshot.reviews[0].state = 'CHANGES_REQUESTED'; }],
  ['unresolved thread', f => { f.snapshot.threads.push({ id: 'thread', isResolved: false }); }],
  ['late finding', f => { f.snapshot.reviewComments.push({ id: 50, body: 'New P1 finding', user: { login: 'reviewer' } }); }],
  ['late CodeRabbit second opinion', f => { f.snapshot.issueComments.push({ id: 51, body: 'New finding', user: { login: 'coderabbitai[bot]', type: 'Bot' } }); }],
]) test(`${name} invalidates approval`, () => {
  const f = fixture(); approve(f); mutate(f); assert.equal(evaluate(f).allowed, false);
});

for (const [name, mutate] of [
  ['wrong repository id', v => { v.repository_id = 101; }],
  ['wrong PR', v => { v.pr_number = 43; }],
  ['wrong policy', v => { v.policy_sha256 = '0'.repeat(64); }],
  ['missing coverage', v => { delete v.coverage; }],
  ['partial coverage', v => { v.coverage.reviewed_files = 0; }],
  ['incomplete execution', v => { v.execution_status = 'incomplete'; }],
  ['limitations', v => { v.limitations = ['Missing context']; }],
  ['blocking findings', v => { v.blocking_findings = ['P1']; }],
  ['wrong route provider', v => { v.reviewer = 'codex'; }],
  ['wrong tier', v => { v.risk_tier = 'R0'; }],
]) test(`${name} cannot pass`, () => {
  const f = fixture(); editReceipt(approve(f), mutate); assert.equal(evaluate(f).allowed, false);
});

test('later COMMENTED review invalidates prior APPROVED on the same head', () => {
  const f = fixture(); const r = approve(f); f.snapshot.reviews.push({ ...r, id: 11, state: 'COMMENTED' });
  assert.equal(evaluate(f).allowed, false);
});
test('unknown submitted review metadata is an error', () => {
  const f = fixture(); const r = approve(f); r.submitted_at = 'unknown'; assert.throws(() => evaluate(f));
});
test('fake labels, issue receipts and CI claims never replace reviews', () => {
  const f = fixture(); const r = approve(f); f.snapshot.reviews = []; f.snapshot.pr.labels = [{ name: 'owner-approved' }];
  f.snapshot.issueComments.push({ id: 30, body: r.body, user: r.user }); f.snapshot.ci = 'success';
  assert.equal(evaluate(f).allowed, false);
});
test('CodeRabbit and Codex native approvals are not eligible primary routes', () => {
  for (const login of ['coderabbitai[bot]', 'chatgpt-codex-connector[bot]']) {
    const f = fixture(); const r = approve(f); r.user = { id: 90, login, type: 'Bot' }; f.snapshot.permissions[login] = 'admin';
    assert.equal(evaluate(f).allowed, false);
  }
});
test('QAS shadow failure or success does not affect a valid primary review', () => {
  const f = fixture(); approve(f);
  for (const state of ['success', 'failure', 'unavailable']) {
    f.snapshot.issueComments = [{ id: 60, user: { login: 'quantaiservice[bot]', type: 'Bot' }, body: state }];
    assert.equal(evaluate(f).allowed, true);
  }
});
test('provider promotion is not a policy-only switch', () => {
  const f = fixture(); f.policy.providers.codex = 'primary'; assert.throws(() => evaluate(f), /provider policy/);
});
test('resolved flag alone cannot dispose of an inline finding', () => {
  const f = fixture(); f.snapshot.reviewComments.push({ id: 50, body: 'P1 finding' }); f.snapshot.threads.push({ id: 'thread', isResolved: true });
  const r = approve(f); assert.equal(evaluate(f).allowed, false);
  editReceipt(r, v => { v.dispositions = [{ source_id: 'comment:50', severity: 'P1', outcome: 'accepted', reason: 'Accepting the known issue', evidence: 'offline fixture result' }]; });
  assert.equal(evaluate(f).allowed, false);
  editReceipt(r, v => { v.dispositions[0].outcome = 'fixed'; v.dispositions[0].fixed_in = HEAD; });
  assert.equal(evaluate(f).allowed, true);
  f.snapshot.reviewComments[0].body = 'Edited material finding'; assert.equal(evaluate(f).allowed, false);
});
test('an admin fallback cannot override active changes requested', () => {
  const f = fixture(); approve(f, 'fallback'); f.snapshot.reviews.push({ id: 30, user: { id: 2, login: 'reviewer', type: 'User' },
    state: 'CHANGES_REQUESTED', commit_id: HEAD, submitted_at: '2033-05-18T03:33:20Z', body: 'Fix required' });
  assert.equal(evaluate(f).reason, 'changes_requested');
});

test('R2 requires an owner comment even with a valid technical review', () => {
  const f = fixture('src/ai_service/auth.py'); approve(f);
  assert.equal(evaluate(f).reason, 'owner_approval_required');
});
test('R2 accepts an allowlisted Grok approval comment bound to exact AI evidence', () => {
  const f = fixture('src/ai_service/auth.py'); aiApproval(f); ownerApproval(f);
  assert.equal(evaluate(f).allowed, true); assert.equal(evaluate(f).route, 'recorded-ai');
});
test('R2 accepts AI-assisted independent native review plus owner comment', () => {
  const f = fixture('src/ai_service/auth.py'); approve(f); ownerApproval(f); assert.equal(evaluate(f).allowed, true);
});
for (const [name, mutate] of [
  ['expired approval', (f, r) => editReceipt(r, v => { v.expires_at = NOW; })],
  ['wrong evidence', (f, r) => editReceipt(r, v => { v.evidence_sha256 = '0'.repeat(64); })],
  ['wrong actor id', (f, r) => { r.user.id = 5; }],
  ['wrong actor login', (f, r) => { r.user.login = 'impostor'; }],
  ['bot impersonation', (f, r) => { r.user.type = 'Bot'; }],
  ['actor removed', f => { f.policy.owner_actors = []; }],
  ['actor permission removed', f => { f.snapshot.permissions.owner = 'read'; }],
  ['new head', f => { f.snapshot.pr.head.sha = 'e'.repeat(40); }],
  ['wrong approval head', (f, r) => editReceipt(r, v => { v.head_sha = 'e'.repeat(40); })],
  ['wrong approval base', (f, r) => editReceipt(r, v => { v.base_sha = 'e'.repeat(40); })],
  ['wrong approval repository', (f, r) => editReceipt(r, v => { v.repository = 'other/project'; })],
  ['wrong approval PR', (f, r) => editReceipt(r, v => { v.pr_number = 43; })],
  ['wrong approval policy', (f, r) => editReceipt(r, v => { v.policy_sha256 = '0'.repeat(64); })],
  ['missing Grok record', (f, r) => editReceipt(r, v => { delete v.approval_ref; })],
  ['wrong approval source', (f, r) => editReceipt(r, v => { v.approval_source = 'codex'; })],
  ['future approval', (f, r) => editReceipt(r, v => { v.issued_at = NOW + 1; })],
  ['excessive lifetime', (f, r) => editReceipt(r, v => { v.expires_at = NOW + 90000; })],
  ['malformed approval', (f, r) => { r.body = 'not JSON'; }],
  ['deleted approval', f => { f.snapshot.issueComments.pop(); }],
  ['withdrawn approval', (f, r) => editReceipt(r, v => { v.decision = 'revoke'; })],
  ['technical receipt edited', f => editReceipt(f.snapshot.reviews[0], v => { v.note = 'Edited after owner decision'; })],
  ['approval copied to another comment', (f, r) => { f.snapshot.issueComments.push({ ...r, id: 21 }); }],
]) test(`${name} blocks R2`, () => {
  const f = fixture('src/ai_service/auth.py'); approve(f); const r = ownerApproval(f); mutate(f, r); assert.equal(evaluate(f).allowed, false);
});
test('time passing alone expires owner approval', () => {
  const f = fixture('src/ai_service/auth.py'); approve(f); ownerApproval(f);
  assert.equal(gate.evaluate(f.snapshot, f.policy, POLICY, NOW + 3601).allowed, false);
});
test('later owner comment withdraws approval; copied body cannot restore it', () => {
  const f = fixture('src/ai_service/auth.py'); approve(f); const r = ownerApproval(f);
  f.snapshot.issueComments.push({ ...r, id: 21, body: 'Withdraw approval' });
  assert.equal(evaluate(f).allowed, false);
  f.snapshot.issueComments.push({ ...r, id: 22 }); assert.equal(evaluate(f).allowed, false);
});
test('editing an older owner comment cannot outrank a newer revocation', () => {
  const f = fixture('src/ai_service/auth.py'); approve(f); const r = ownerApproval(f);
  const revoked = { ...r, id: 21 }; editReceipt(revoked, v => { v.comment_id = 21; v.decision = 'revoke'; });
  f.snapshot.issueComments.push(revoked); r.updated_at = '2033-05-18T04:00:00Z';
  assert.equal(evaluate(f).allowed, false);
  revoked.body = 'malformed edit'; assert.equal(evaluate(f).allowed, false);
});
test('owner evidence and labels cannot replace AI review', () => {
  const f = fixture('src/ai_service/auth.py'); approve(f); ownerApproval(f); f.snapshot.reviews = [];
  f.snapshot.pr.labels = [{ name: 'owner-approved' }]; assert.equal(evaluate(f).allowed, false);
});
test('labels cannot replace the structured owner comment', () => {
  const f = fixture('src/ai_service/auth.py'); aiApproval(f); f.snapshot.pr.labels = [{ name: 'owner-approved' }];
  assert.equal(evaluate(f).allowed, false);
});
test('native technical review without AI provenance cannot pass', () => {
  const f = fixture(); editReceipt(approve(f), v => { delete v.ai_review; }); assert.equal(evaluate(f).allowed, false);
});
test('R1 accepts a SHA-bound AI review with honest self-review provenance', () => {
  const f = fixture(); aiApproval(f); assert.equal(evaluate(f).allowed, true);
});
for (const [name, mutate] of [
  ['unlisted publisher', (f, c) => { c.user.id = 99; }],
  ['read-only publisher', f => { f.snapshot.permissions.author = 'read'; }],
  ['missing AI execution', (f, c) => editReceipt(c, v => { delete v.ai_review; })],
  ['missing run reference', (f, c) => editReceipt(c, v => { v.ai_review.run_ref = ''; })],
  ['incomplete AI', (f, c) => editReceipt(c, v => { v.execution_status = 'incomplete'; })],
  ['failed AI', (f, c) => editReceipt(c, v => { v.verdict = 'fail'; })],
  ['stale AI head', (f, c) => editReceipt(c, v => { v.head_sha = 'e'.repeat(40); })],
  ['stale discussion', (f, c) => editReceipt(c, v => { v.discussion_sha256 = '0'.repeat(64); })],
  ['partial AI coverage', (f, c) => editReceipt(c, v => { v.coverage.reviewed_files = 0; })],
  ['AI limitation', (f, c) => editReceipt(c, v => { v.limitations = ['Missing file']; })],
  ['AI finding', (f, c) => editReceipt(c, v => { v.blocking_findings = ['P1']; })],
  ['copied AI record', (f, c) => { f.snapshot.issueComments.push({ ...c, id: 16 }); }],
  ['malformed newer record', (f, c) => { f.snapshot.issueComments.push({ ...c, id: 16, body: 'Review withdrawn' }); }],
]) test(`${name} cannot satisfy AI review`, () => {
  const f = fixture(); const c = aiApproval(f); mutate(f, c); assert.equal(evaluate(f).allowed, false);
});
test('a failed new AI comment cannot fall back to an older native approval', () => {
  const f = fixture(); approve(f); const c = aiApproval(f); editReceipt(c, v => { v.verdict = 'fail'; });
  assert.equal(evaluate(f).allowed, false);
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


test('PR template needs three distinct sections and an explicit AI heading', () => {
  assert.equal(gate.completeTemplate('## Main changes and tests\nEverything is complete.'), false);
  assert.equal(gate.completeTemplate('## AI changes and tests\nEverything is complete.'), false);
  assert.equal(gate.completeTemplate('## Main work\nCompleted the task.\n## Changes\nUpdated the gate.\n## Tests\nAll tests passed.'), false);
  assert.equal(gate.completeTemplate('## AI assistance\nCodex used.\n## Changes\nUpdated the gate.\n## Tests\nAll tests passed.'), true);
});
test('reactions do not invalidate SHA-bound AI and owner evidence', () => {
  const f = fixture('src/ai_service/auth.py');
  f.snapshot.issueComments.push({ id: 5, user: { type: 'Bot', login: 'coderabbitai[bot]' }, body: 'Second opinion' });
  aiApproval(f); ownerApproval(f); const before = evaluate(f);
  assert.equal(before.allowed, true);
  for (const c of f.snapshot.issueComments) c.reactions = { '+1': 1, total_count: 1 };
  assert.deepEqual(evaluate(f), before);
});
