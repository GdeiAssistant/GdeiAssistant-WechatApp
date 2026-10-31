#!/usr/bin/env python3
"""Execute the real github-script bodies with offline GitHub API doubles."""
import json
import os
import subprocess
import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = yaml.load((ROOT / '.github/workflows/risk-gate.yml').read_text(), Loader=yaml.BaseLoader)
SHA = 'a' * 40

# Only explicitly mocked endpoints exist; no Octokit client or network is used.
HARNESS = r'''
const fs = require('fs');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const f = input.fixture;
const calls = [], statuses = [], comments = [], failures = [];
let prReads = 0, reviewReads = 0;
const github = {rest: {
  pulls: {get: async args => {
    calls.push(['pulls.get', args]);
    if (f.getError) throw new Error('mock PR API failure');
    if (input.job === 'targets') return {data: f.prs[String(args.pull_number)]};
    return {data: ++prReads > 1 && f.current ? f.current : f.pr};
  }, listFiles: 'files', listReviews: 'reviews', list: 'open'},
  issues: {listEvents: 'events', listComments: 'comments', createComment: async args => comments.push(args)},
  repos: {listPullRequestsAssociatedWithCommit: 'associated', get: async () => ({data: {stargazers_count: 0}}),
    createCommitStatus: async args => statuses.push(args)}
}, paginate: async (endpoint, args) => {
  calls.push([endpoint, args]);
  if (f.errors?.includes(endpoint)) throw new Error('mock ' + endpoint + ' API failure');
  if (endpoint === 'reviews') return f.reviewReads ? f.reviewReads[reviewReads++] : (f.reviews || []);
  if (endpoint === 'comments') return [];
  if (!Object.hasOwn(f, endpoint)) throw new Error('Unmocked API: ' + endpoint);
  return f[endpoint];
}};
const core = {setFailed: message => failures.push(message), warning: () => {}};
const context = {repo: {owner: 'example', repo: 'project'}, serverUrl: 'https://example.invalid',
  runId: 1, eventName: input.event || 'pull_request_target', payload: f.payload || {pull_request: f.pr}};
(async () => {
  let result, error;
  try {
    result = await new (Object.getPrototypeOf(async function(){}).constructor)('github', 'context', 'core', input.script)(github, context, core);
  } catch (e) { error = e.message; }
  process.stdout.write(JSON.stringify({result, error, statuses, comments, failures, calls}));
})();
'''


def label_event(event_id=1, event='labeled', actor='Pigbibi'):
    return {'id': event_id, 'event': event, 'label': {'name': 'owner-approved'}, 'actor': {'login': actor}}


def review(state='APPROVED', sha=SHA, review_id=1):
    return {'id': review_id, 'state': state, 'commit_id': sha,
            'submitted_at': '2026-01-01T00:00:00Z', 'user': {'login': 'coderabbitai[bot]', 'type': 'Bot'}}


class ScriptTests(unittest.TestCase):
    def run_script(self, fixture, job='evaluate', event=None):
        script = WORKFLOW['jobs'][job]['steps'][0]['with']['script']
        result = subprocess.run(['node', '-e', HARNESS], input=json.dumps({
            'fixture': fixture, 'script': script, 'job': job, 'event': event,
        }), capture_output=True, text=True, check=True, timeout=10,
            env={'PATH': os.environ['PATH'], 'PR_NUMBER': '7'})
        return json.loads(result.stdout)

    def fixture(self, labels=True, events=None, files=None, reviews=None, **extra):
        files = files if files is not None else [{'filename': '.github/workflows/build.yml'}]
        return {'pr': {'number': 7, 'state': 'open', 'head': {'sha': SHA}, 'changed_files': len(files),
                       'labels': [{'name': 'owner-approved'}] if labels else [],
                       'body': '## AI assistance\nCoding assistant.\n## What changed\nGate validation.\n## How verified\nOffline regression tests.\n'},
                'files': files, 'events': events if events is not None else [label_event()],
                'reviews': reviews or [], **extra}

    def assert_gate(self, fixture, allowed):
        result = self.run_script(fixture)
        states = [s['state'] for s in result['statuses'] if s['context'] == 'risk-gate']
        self.assertTrue(states, result)
        if allowed:
            self.assertEqual(states[-1], 'success', result)
            self.assertFalse(result.get('error'), result)
            self.assertFalse(result['failures'], result)
        else:
            self.assertIn(states[-1], ('failure', 'error'), result)
            self.assertTrue(result.get('error') or result['failures'], result)
        return result

    def test_right_actor_passes(self):
        self.assert_gate(self.fixture(), True)

    def test_wrong_actor_fails(self):
        self.assert_gate(self.fixture(events=[label_event(actor='other')]), False)

    def test_latest_unlabeled_fails(self):
        self.assert_gate(self.fixture(events=[label_event(9, 'unlabeled'), label_event(3)]), False)

    def test_latest_wrong_actor_overrides_old_owner(self):
        self.assert_gate(self.fixture(events=[label_event(9, actor='other'), label_event(3)]), False)

    def test_no_event_fails(self):
        self.assert_gate(self.fixture(events=[]), False)

    def test_event_api_error_fails_closed_even_with_bot_approval(self):
        self.assert_gate(self.fixture(errors=['events'], reviews=[review()]), False)

    def test_unknown_event_id_fails_closed(self):
        self.assert_gate(self.fixture(events=[label_event(None)]), False)

    def test_missing_actor_fails(self):
        event = label_event()
        del event['actor']
        self.assert_gate(self.fixture(events=[event]), False)

    def test_label_absent_does_not_use_event(self):
        self.assert_gate(self.fixture(labels=False), False)

    def test_bot_approval_without_label_passes(self):
        result = self.assert_gate(self.fixture(labels=False, reviews=[review()]), True)
        self.assertNotIn('events', [name for name, _ in result['calls']])

    def test_wrong_actor_can_still_use_valid_bot_approval(self):
        self.assert_gate(self.fixture(events=[label_event(actor='other')], reviews=[review()]), True)

    def test_stale_bot_approval_fails(self):
        self.assert_gate(self.fixture(labels=False, reviews=[review(sha='b' * 40)]), False)

    def test_latest_nonapproval_blocks_earlier_bot_approval(self):
        for state in ('COMMENTED', 'CHANGES_REQUESTED', 'DISMISSED'):
            with self.subTest(state=state):
                self.assert_gate(self.fixture(labels=False, reviews=[review(), review(state, review_id=2)]), False)

    def test_review_race_fails_closed(self):
        self.assert_gate(self.fixture(labels=False, reviewReads=[[review()], [review('DISMISSED')]]), False)

    def test_unknown_review_metadata_fails_closed(self):
        self.assert_gate(self.fixture(labels=False, reviews=[review(review_id=None)]), False)

    def test_review_api_error_fails_closed(self):
        self.assert_gate(self.fixture(labels=False, errors=['reviews']), False)

    def test_pr_head_race_fails_closed(self):
        fixture = self.fixture()
        fixture['current'] = dict(fixture['pr'], head={'sha': 'b' * 40})
        self.assert_gate(fixture, False)

    def test_low_risk_still_passes(self):
        self.assert_gate(self.fixture(labels=False, files=[{'filename': 'docs/guide.md'}]), True)

    def test_incomplete_diff_fails_closed(self):
        fixture = self.fixture()
        fixture['pr']['changed_files'] += 1
        self.assert_gate(fixture, False)

    def test_only_evaluator_gains_issue_read_permission(self):
        self.assertEqual(WORKFLOW['permissions'], {})
        self.assertEqual(WORKFLOW['jobs']['evaluate']['permissions'], {
            'pull-requests': 'read', 'issues': 'read', 'statuses': 'write'})
        self.assertEqual(WORKFLOW['jobs']['targets']['permissions'], {'pull-requests': 'read'})


if __name__ == '__main__':
    unittest.main()
