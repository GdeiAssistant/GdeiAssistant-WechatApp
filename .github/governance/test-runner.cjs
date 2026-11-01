'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { fixture, approve, HEAD, BASE, POLICY } = require('./fixtures.cjs');
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
      repos: {
        listPullRequestsAssociatedWithCommit: 'associated',
        getBranch: async () => ({ data: { commit: { sha: BASE } } }),
        getCollaboratorPermissionLevel: async ({ username }) => ({ data: { permission: f.snapshot.permissions[username], user: { id: f.snapshot.reviews.find(r => r.user.login === username).user.id } } }),
        createCommitStatus: async s => { statuses.push(s); return {}; },
      },
    },
    paginate: async (method, params) => {
      calls.push({ method, params });
      if (method === 'pulls') return [structuredClone(f.snapshot.pr)];
      if (method === 'associated') return [];
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
  const m = mock(); m.context.eventName = 'schedule'; m.github.paginate = async () => Array.from({ length: 101 }, (_, i) => ({ number: i + 1 }));
  await assert.rejects(selectTargets(m.github, m.context, 'main'), /exceeds/);
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
  const m = mock(); await collect(m.github, m.context, 42, BASE);
  assert.deepEqual(m.calls.map(c => c.method).sort(), ['commits', 'files', 'issueComments', 'reviewComments', 'reviews']);
  assert.ok(m.calls.every(c => c.params.per_page === 100));
});
test('permission identity mismatch fails collection', async () => {
  const f = fixture(); approve(f); const m = mock(f);
  m.github.rest.repos.getCollaboratorPermissionLevel = async () => ({ data: { permission: 'admin', user: { id: 999 } } });
  await assert.rejects(collect(m.github, m.context, 42, BASE), /permission/);
});
test('native API errors never publish success', async () => {
  const m = mock(); m.github.paginate = async () => { throw new Error('API unavailable'); };
  await run(m); assert.ok(m.statuses.some(s => s.context === 'risk-gate' && s.state === 'error'));
  assert.ok(m.statuses.every(s => s.state !== 'success')); assert.equal(m.failures.length, 1);
});
test('valid R1 publishes preserved contexts on actual head after a full readback', async () => {
  const f = fixture(); approve(f); f.snapshot.pr.body = '## AI assistance\nCodex used.\n## What changed\nReview evidence.\n## How verified\nOffline tests passed.';
  const m = mock(f); await run(m);
  assert.deepEqual(m.statuses.map(s => [s.context, s.state]), [['risk-gate', 'pending'], ['pr-template', 'pending'], ['pr-template', 'success'], ['risk-gate', 'success']]);
  assert.ok(m.statuses.every(s => s.sha === HEAD)); assert.equal(m.calls.filter(c => c.method === 'files').length, 2);
  assert.equal(m.failures.length, 0);
});
for (const field of ['head', 'base', 'body', 'review', 'permission', 'thread', 'policy']) {
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
        if (field === 'permission') f.snapshot.permissions.reviewer = 'read';
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

test('shadow issue updates cannot turn a stable review into a race error', () => {
  const f = fixture(); const before = snapshotVersion(f.snapshot);
  f.snapshot.issueComments.push({ id: 90, user: { login: 'quantaiservice[bot]', type: 'Bot' }, body: 'failure' });
  assert.equal(snapshotVersion(f.snapshot), before);
});
