'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { fixture, approve, approveWithoutFindings, ownerApproval, HEAD, BASE, POLICY } = require('./fixtures.cjs');
const { selectTargets, readThreads, collect, snapshotVersion, run } = require('./runner.cjs');

function mock(f = fixture()) {
  const statuses = [], failures = [], calls = [];
  const context = { repo: { owner: f.policy.repository.split('/')[0], repo: f.policy.repository.split('/')[1] },
    eventName: 'pull_request_target', payload: { pull_request: { number: 42 } },
    ref: 'refs/heads/main', serverUrl: 'https://github.example', runId: 123 };
  const github = {
    rest: {
      pulls: { get: async () => ({ data: structuredClone(f.snapshot.pr) }), list: 'pulls', listFiles: 'files',
        listReviews: 'reviews', listReviewComments: 'reviewComments', listCommits: 'commits' },
      issues: { listComments: 'issueComments' },
      checks: { listForRef: 'checkRuns' },
      repos: {
        listPullRequestsAssociatedWithCommit: 'associated',
        listCommitStatusesForRef: 'statuses',
        getContent: async ({ ref }) => ({ data: { type: 'file', encoding: 'base64',
          content: Buffer.from(ref === BASE ? f.snapshot.trustedCoderabbitConfig : f.snapshot.coderabbitConfig).toString('base64') } }),
        getBranch: async () => ({ data: { commit: { sha: BASE } } }),
        getCollaboratorPermissionLevel: async ({ username }) => ({ data: { permission: f.snapshot.permissions[username], user: { id: [...f.snapshot.reviews, ...f.snapshot.issueComments].find(r => r.user.login === username).user.id } } }),
        createCommitStatus: async s => { statuses.push(s); return {}; },
      },
    },
    paginate: async (method, params) => {
      calls.push({ method, params });
      if (method === 'pulls') return [structuredClone(f.snapshot.pr)];
      if (method === 'associated') return [];
      if (method === 'statuses') return structuredClone(f.snapshot.statuses || []);
      return structuredClone(f.snapshot[method]);
    },
    graphql: async () => ({ repository: { pullRequest: { reviewThreads: {
      nodes: structuredClone(f.snapshot.threads), pageInfo: { hasNextPage: false, endCursor: null },
    } } } }),
  };
  const summary = { addHeading: () => summary, addCodeBlock: () => summary, addRaw: () => summary, write: async () => {} };
  const core = { setFailed: message => failures.push(message), summary };
  return { github, context, core, statuses, failures, calls, policy: f.policy, policySha: POLICY, policyCommit: BASE, defaultBranch: 'main' };
}

test('ordinary PR and comment events target only that PR', async () => {
  const m = mock(); assert.deepEqual(await selectTargets(m.github, m.context, 'main'), [42]);
  m.context.eventName = 'issue_comment'; m.context.payload = { issue: { number: 8, pull_request: {} } };
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), [8]); assert.equal(m.calls.length, 0);
  m.context.payload.issue.pull_request = null;
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), []);
});
test('dispatch validates number and default branch', async () => {
  const m = mock(); m.context.eventName = 'workflow_dispatch'; m.context.payload = { inputs: { pr_number: '42' } };
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), [42]);
  m.context.payload.inputs.pr_number = '1; command'; await assert.rejects(selectTargets(m.github, m.context, 'main'));
  m.context.payload.inputs.pr_number = '42'; m.context.ref = 'refs/heads/attacker';
  await assert.rejects(selectTargets(m.github, m.context, 'main'), /default branch/);
});
test('workflow relay conclusion and artifacts are not approval inputs', async () => {
  const m = mock(); m.context.eventName = 'workflow_run';
  m.context.payload = { workflow_run: { conclusion: 'success', artifacts: ['forged'], pull_requests: [{ number: 9 }], head_sha: HEAD } };
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), [9]); assert.equal(m.calls.length, 0);
  await run(m); assert.equal(m.statuses.at(-1).state, 'failure');
});
test('fork relay without associations uses commit lookup before a bounded sweep', async () => {
  const m = mock(); m.context.eventName = 'workflow_run'; m.context.payload = { workflow_run: { pull_requests: [], head_sha: HEAD } };
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), [42]);
  assert.deepEqual(m.calls.map(c => c.method), ['associated', 'pulls']);
});
test('commit association avoids all-open PR scan', async () => {
  const m = mock(); m.context.eventName = 'workflow_run'; m.context.payload = { workflow_run: { head_sha: HEAD } };
  m.github.paginate = async method => { assert.equal(method, 'associated'); return [{ number: 3, state: 'open' }]; };
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), [3]);
});
test('oversized sweep errors without truncation', async () => {
  const m = mock(); m.context.eventName = 'schedule'; m.github.paginate = async () => Array.from({ length: 11 }, (_, i) => ({ number: i + 1 }));
  await assert.rejects(selectTargets(m.github, m.context, 'main'), /exceeds/);
});
test('bounded sweep includes every PR at capacity and targeted events bypass its cap', async () => {
  const m = mock(); m.context.eventName = 'schedule';
  m.github.paginate = async () => Array.from({ length: 10 }, (_, i) => ({ number: i + 1 }));
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  m.github.paginate = async () => { throw new Error('Targeted evaluation must not sweep'); };
  m.context.eventName = 'workflow_dispatch'; m.context.payload = { inputs: { pr_number: '11' } };
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), [11]);
  m.context.eventName = 'pull_request_target'; m.context.payload = { pull_request: { number: 11 } };
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), [11]);
});

test('untrusted workflow events cannot replace a trusted pending run', () => {
  const source = fs.readFileSync('.github/workflows/risk-gate.yml', 'utf8');
  const expression = /^concurrency:\n[\s\S]*?\$\{\{([\s\S]*?)\}\}/m.exec(source)?.[1];
  assert.ok(expression, 'Isolation must apply at workflow scope');
  // This expression uses the boolean/format subset shared with JavaScript.
  const group = new Function('github', 'format', `return (${expression});`);
  const format = (pattern, id) => pattern.replace('{0}', id);
  const trusted = [
    { event_name: 'schedule' }, { event_name: 'push' },
    { event_name: 'pull_request_target' }, { event_name: 'workflow_run' },
    ...[20649888, 136622811].map(id => ({ event_name: 'issue_comment', event: { issue: { pull_request: {} }, comment: { user: { id } } } })),
    { event_name: 'check_run', event: { check_run: { app: { id: 347564 } } } },
  ];
  for (const event of trusted) assert.equal(group({ event: {}, ...event, run_id: 1 }, format), 'pr-governance');
  const untrusted = [
    { event_name: 'issue_comment', event: { issue: { pull_request: {} }, comment: { user: { id: 9 } } } },
    { event_name: 'issue_comment', event: { issue: {}, comment: { user: { id: 20649888 } } } },
    { event_name: 'check_run', event: { check_run: { app: { id: 9 } } } },
  ];
  for (const event of untrusted) {
    assert.notEqual(group({ ...event, run_id: 1 }, format), 'pr-governance');
    assert.notEqual(group({ ...event, run_id: 1 }, format), group({ ...event, run_id: 2 }, format));
  }
});
test('unknown relay SHA cannot select an unrelated fallback target', async () => {
  const m = mock(); m.context.eventName = 'workflow_run'; m.context.payload = { workflow_run: { head_sha: '' } };
  await assert.rejects(selectTargets(m.github, m.context, 'main'), /commit/);
});
test('GraphQL thread pagination reads the final page', async () => {
  const m = mock(); let page = 0;
  m.github.graphql = async (query, params) => {
    page++; assert.equal(params.cursor, page === 1 ? null : 'cursor1');
    return { repository: { pullRequest: { reviewThreads: { nodes: [{ id: `thread${page}`, isResolved: page === 1 }],
      pageInfo: { hasNextPage: page === 1, endCursor: page === 1 ? 'cursor1' : null } } } } };
  };
  assert.equal((await readThreads(m.github, m.context.repo, 42)).length, 2); assert.equal(page, 2);
});
test('missing or repeating thread cursor is refused', async () => {
  const m = mock(); m.github.graphql = async () => ({ repository: { pullRequest: { reviewThreads: {
    nodes: [], pageInfo: { hasNextPage: true, endCursor: null },
  } } } });
  await assert.rejects(readThreads(m.github, m.context.repo, 42), /page/);
});
test('all REST collection endpoints use the pagination helper', async () => {
  const m = mock(); await collect(m.github, m.context, 42, BASE, m.policy);
  assert.deepEqual(m.calls.map(c => c.method).sort(), ['checkRuns', 'commits', 'files', 'issueComments', 'reviewComments', 'reviews', 'statuses']);
  assert.ok(m.calls.every(c => c.params.per_page === 100));
});
test('permission identity mismatch fails collection', async () => {
  const f = fixture(); approve(f); ownerApproval(f); const m = mock(f);
  m.github.rest.repos.getCollaboratorPermissionLevel = async () => ({ data: { permission: 'admin', user: { id: 999 } } });
  await assert.rejects(collect(m.github, m.context, 42, BASE, f.policy), /permission/);
});
test('native API errors never publish success', async () => {
  const m = mock(); m.github.paginate = async () => { throw new Error('API unavailable'); };
  await run(m); assert.ok(m.statuses.some(s => s.context === 'risk-gate' && s.state === 'error'));
  assert.ok(m.statuses.every(s => s.state !== 'success')); assert.equal(m.failures.length, 1);
});
for (const path of ['src/view.js', 'pages/login/login.js']) test(`App-reviewed ${path} publishes success without account comments after readback`, async () => {
  const f = fixture(path); approve(f); f.snapshot.pr.body = '## AI assistance\nCodex used.\n## What changed\nReview evidence.\n## How verified\nOffline tests passed.';
  const m = mock(f); await run(m);
  assert.deepEqual(m.statuses.map(s => [s.context, s.state]), [['risk-gate', 'pending'], ['pr-template', 'pending'], ['pr-template', 'success'], ['risk-gate', 'success']]);
  assert.ok(m.statuses.every(s => s.sha === HEAD)); assert.equal(m.calls.filter(c => c.method === 'files').length, 2);
  assert.equal(m.failures.length, 0);
});
for (const field of ['head', 'base', 'body', 'review', 'check', 'config', 'thread', 'policy']) {
  test(`readback detects concurrent ${field} change`, async () => {
    const f = fixture(); approve(f); const m = mock(f); let reads = 0;
    const get = m.github.rest.pulls.get;
    m.github.rest.pulls.get = async () => {
      reads++;
      if (reads === 3) {
        if (field === 'head') f.snapshot.pr.head.sha = 'e'.repeat(40);
        if (field === 'base') f.snapshot.pr.base.sha = 'e'.repeat(40);
        if (field === 'body') f.snapshot.pr.body = 'changed';
        if (field === 'review') f.snapshot.reviews[0].state = 'DISMISSED';
        if (field === 'check') f.snapshot.checkRuns[0].conclusion = 'neutral';
        if (field === 'config') f.snapshot.coderabbitConfig += '\nchanged';
        if (field === 'thread') f.snapshot.threads.push({ id: 'new', isResolved: false });
        if (field === 'policy') m.github.rest.repos.getBranch = async () => ({ data: { commit: { sha: 'e'.repeat(40) } } });
      }
      return get();
    };
    await run(m); assert.ok(m.statuses.some(s => s.context === 'risk-gate' && s.state === 'error'));
    assert.ok(m.statuses.every(s => s.state !== 'success'));
  });
}
test('snapshot comparison ignores labels but binds the entire evidence content', () => {
  const f = fixture(); const version = snapshotVersion(f.snapshot);
  f.snapshot.pr.labels = [{ name: 'owner-approved' }]; assert.equal(snapshotVersion(f.snapshot), version);
  f.snapshot.reviewComments.push({ id: 10, body: 'material finding' }); assert.notEqual(snapshotVersion(f.snapshot), version);
});
test('closed PR publishes no statuses', async () => {
  const f = fixture(); f.snapshot.pr.state = 'closed'; const m = mock(f); await run(m); assert.equal(m.statuses.length, 0);
});
test('trusted workflow never checks out PR code or consumes relay artifacts', () => {
  const source = fs.readFileSync('.github/workflows/risk-gate.yml', 'utf8');
  assert.ok(source.includes('ref: policyCommit')); assert.ok(source.includes("['gate.cjs', 'runner.cjs', 'policy.json']"));
  assert.doesNotMatch(source, /actions\/checkout|download-artifact|secrets\.|id-token:|issues: write|pull-requests: write|sleep|matrix:/);
  const relay = fs.readFileSync('.github/workflows/pr-review-signal.yml', 'utf8');
  assert.ok(relay.includes('permissions: {}')); assert.doesNotMatch(relay.replace(/^\s*#.*$/gm, ''), /uses:|checkout|artifact/);
});

test('unrelated bot comments cannot change the evidence snapshot', () => {
  const f = fixture(); const before = snapshotVersion(f.snapshot);
  f.snapshot.issueComments.push({ id: 90, user: { login: 'unrelated[bot]', type: 'Bot' }, body: 'failure' });
  assert.equal(snapshotVersion(f.snapshot), before);
});

for (const field of ['edit', 'delete', 'withdraw', 'permission']) {
  test(`R2 readback detects owner comment ${field}`, async () => {
    const f = fixture('src/ai_service/auth.py'); approve(f); const approval = ownerApproval(f);
    const m = mock(f); let reads = 0; const get = m.github.rest.pulls.get;
    m.github.rest.pulls.get = async () => {
      if (++reads === 3) {
        if (field === 'edit') approval.body = '{}';
        if (field === 'delete') f.snapshot.issueComments.pop();
        if (field === 'withdraw') f.snapshot.issueComments.push({ ...approval, id: 21, body: 'Withdrawn' });
        if (field === 'permission') f.snapshot.permissions.owner = 'read';
      }
      return get();
    };
    await run(m); assert.ok(m.statuses.some(s => s.context === 'risk-gate' && s.state === 'error'));
    assert.ok(m.statuses.every(s => s.state !== 'success'));
  });
}
test('collector verifies allowlisted comment publisher identity and permission', async () => {
  const f = fixture('src/ai_service/auth.py'); approve(f); ownerApproval(f); const m = mock(f);
  const snapshot = await collect(m.github, m.context, 42, BASE, f.policy);
  assert.equal(snapshot.permissions.owner, 'admin'); assert.equal(snapshot.permissions.author, undefined);
});
test('snapshot binds malformed allowlisted comments while ignoring unrelated comments', () => {
  const f = fixture(); const before = snapshotVersion(f.snapshot, f.policy);
  f.snapshot.issueComments.push({ id: 22, user: { id: 4, login: 'owner', type: 'User' }, body: 'Withdrawn' });
  assert.notEqual(snapshotVersion(f.snapshot, f.policy), before);
});

test('CodeRabbit check events target associated PRs and ignore other Apps', async () => {
  const m = mock(); m.context.eventName = 'check_run';
  m.context.payload = { check_run: { app: { id: 347564, slug: 'coderabbitai' }, head_sha: HEAD, pull_requests: [{ number: 42 }] } };
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), [42]);
  m.context.payload.check_run.app.id = 1;
  assert.deepEqual(await selectTargets(m.github, m.context, 'main'), []);
});
test('collector reads only trusted Actions decision watermarks on the current head', async () => {
  const f = fixture(); approve(f);
  f.snapshot.statuses = [
    { context: 'risk-gate', description: 'revoked; owner=21', creator: { id: 41898282, login: 'github-actions[bot]' } },
    { context: 'risk-gate', description: 'forged; owner=999', creator: { id: 1, login: 'author' } },
  ];
  const m = mock(f); const s = await collect(m.github, m.context, 42, BASE, f.policy);
  assert.equal(s.ownerWatermark, 21);
  assert.ok(m.calls.filter(c => ['checkRuns', 'statuses'].includes(c.method)).every(c => c.params.ref === HEAD));
});
test('R2 publication persists revoke watermark and does not resurrect deleted decisions', async () => {
  const f = fixture('pages/login/login.js'); approve(f); ownerApproval(f); const revoke = ownerApproval(f, 'revoke');
  const first = mock(f); await run(first);
  const last = first.statuses.findLast(s => s.context === 'risk-gate');
  assert.equal(last.state, 'failure'); assert.ok(last.description.endsWith(`owner=${revoke.id}`));
  f.snapshot.statuses = [{ ...last, creator: { id: 41898282, login: 'github-actions[bot]' } }];
  f.snapshot.issueComments.pop(); const second = mock(f); await run(second);
  assert.equal(second.statuses.at(-1).state, 'failure');
  assert.match(second.statuses.at(-1).description, /owner_decision_invalid/);
});
test('unrelated CI changes do not invalidate a stable review during readback', async () => {
  const f = fixture(); approve(f); const m = mock(f); let reads = 0; const get = m.github.rest.pulls.get;
  m.github.rest.pulls.get = async () => {
    if (++reads === 3) f.snapshot.checkRuns.push({ id: 999, name: 'Other CI', app: { id: 15368 } });
    return get();
  };
  await run(m); assert.equal(m.statuses.at(-1).state, 'success');
});

test('review comment reactions do not affect snapshot but review content still does', () => {
  const f = fixture(); f.snapshot.reviewComments.push({ id: 8, user: { id: 2, login: 'reviewer', type: 'User' }, body: 'Finding' });
  const before = snapshotVersion(f.snapshot, f.policy);
  f.snapshot.reviewComments[0].reactions = { '+1': 1 };
  assert.equal(snapshotVersion(f.snapshot, f.policy), before);
  f.snapshot.reviewComments[0].body = 'Changed finding';
  assert.notEqual(snapshotVersion(f.snapshot, f.policy), before);
});
test('failed error status publication does not abort later PRs in a sweep', async () => {
  const m = mock(); m.context.eventName = 'schedule'; const paginate = m.github.paginate;
  m.github.paginate = async (method, params) => method === 'pulls' ? [{ number: 42 }, { number: 43 }] : paginate(method, params);
  const evaluated = new Set(); const get = m.github.rest.pulls.get;
  m.github.rest.pulls.get = async params => { evaluated.add(params.pull_number); return get(); };
  m.github.rest.repos.createCommitStatus = async s => { m.statuses.push(s); throw new Error('status unavailable'); };
  await run(m);
  assert.deepEqual([...evaluated], [42, 43]); assert.equal(m.failures.length, 2);
  assert.equal(m.statuses.filter(s => s.state === 'error').length, 4);
});


test('native zero-finding summary publishes R2 after complete readback', async () => {
  const f = fixture('pages/login/login.js'); approveWithoutFindings(f);
  const m = mock(f); await run(m);
  assert.equal(m.statuses.at(-1).state, 'success');
});
test('native summary edits during readback prevent publication', async () => {
  const f = fixture('pages/login/login.js'); const c = approveWithoutFindings(f);
  const m = mock(f); let reads = 0; const get = m.github.rest.pulls.get;
  m.github.rest.pulls.get = async () => {
    if (++reads === 3) c.body += '\nNew report content';
    return get();
  };
  await run(m);
  assert.ok(m.statuses.some(s => s.context === 'risk-gate' && s.state === 'error'));
  assert.ok(m.statuses.every(s => s.state !== 'success'));
});
