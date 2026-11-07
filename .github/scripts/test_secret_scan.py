import importlib.util
import contextlib
import io
import json
import os
import secrets
import shutil
import string
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('secret_scan', Path(__file__).with_name('secret_scan.py'))
SCANNER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SCANNER)
BINARY = os.environ.get('GITLEAKS_BIN', 'gitleaks')


def fake_value(length=32):
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(length))


class SecretScanTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.output = self.root / 'report.json'
        self.source = self.root / 'payload'
        self.source.mkdir()

    def detect(self, text, filename='credentials.properties'):
        (self.source / filename).write_text(text)
        return SCANNER.scan(BINARY, 'dir', self.source, self.output)

    def suppression_repository(self):
        subprocess.run(['git', 'init', '--quiet', str(self.source)], check=True,
                       capture_output=True)
        self.git('config', 'user.name', 'Synthetic Test')
        self.git('config', 'user.email', 'fixture@example.invalid')
        (self.source / 'clean.txt').write_text('clean fixture\n')
        self.git('add', '.')
        self.git('commit', '--quiet', '-m', 'test: clean fixture')
        return self.git('rev-parse', 'HEAD')

    def git(self, *arguments):
        return subprocess.run(['git', '-C', str(self.source), *arguments], check=True,
                              capture_output=True, text=True).stdout.strip()

    def suppressed_payload(self, suppression, mode):
        self.source = self.root / ('payload-' + mode)
        self.source.mkdir()
        base = self.suppression_repository()
        payload = self.source / 'credentials.properties'
        payload.write_text('password=' + fake_value() + '\n')
        if suppression == 'comment':
            payload.write_text(payload.read_text().rstrip() + ' # gitleaks:allow\n')
        self.git('add', '.')
        self.git('commit', '--quiet', '-m', 'test: synthetic credential')
        if suppression == 'ignore':
            findings = SCANNER.scan(BINARY, mode, self.source, self.output)
            self.assertTrue(findings)
            (self.source / '.gitleaksignore').write_text(
                '\n'.join(row['Fingerprint'] for row in findings) + '\n')
            self.git('add', '.gitleaksignore')
            self.git('commit', '--quiet', '-m', 'test: source suppression')
        return base

    def test_helper_ignores_allow_comments(self):
        for mode in ('dir', 'git'):
            with self.subTest(mode=mode):
                self.suppressed_payload('comment', mode)
                self.assertTrue(SCANNER.scan(BINARY, mode, self.source, self.output))

    def test_helper_rejects_source_ignore(self):
        for mode in ('dir', 'git'):
            with self.subTest(mode=mode):
                self.suppressed_payload('ignore', mode)
                with self.assertRaises(RuntimeError):
                    SCANNER.scan(BINARY, mode, self.source, self.output)
                (self.source / '.gitleaksignore').unlink()

    def test_ignore_rejection_is_redacted_at_artifact_sink(self):
        value = fake_value()
        nested = self.source / 'nested'
        nested.mkdir()
        (nested / '.gitleaksignore').write_text(value)
        output = io.StringIO()
        with patch('sys.argv', ['secret_scan.py', 'artifacts', '--gitleaks', BINARY]), \
                patch.dict(os.environ, {'ARTIFACT_PATHS': str(self.source)}), \
                contextlib.redirect_stdout(output):
            self.assertEqual(SCANNER.main(), 2)
        self.assertNotIn(value, output.getvalue())
        self.assertNotIn(str(self.source), output.getvalue())

    def run_added_commit_workflow(self, base, head=None):
        workflow = (SCANNER.ROOT / '.github/workflows/engineering-governance.yml').read_text()
        step = workflow.split('      - name: Scan added commits with redacted findings\n', 1)[1]
        body = step.split('        run: |\n', 1)[1].split('\n  commitlint:', 1)[0]
        script = '\n'.join(line[10:] for line in body.splitlines())
        runner = self.root / 'runner'
        binary_dir = runner / 'gitleaks-bin'
        binary_dir.mkdir(parents=True, exist_ok=True)
        binary_link = binary_dir / 'gitleaks'
        if not binary_link.exists():
            binary_link.symlink_to(Path(shutil.which(BINARY)).resolve())
        shutil.copyfile(SCANNER.ROOT / '.gitleaks.toml', self.source / '.gitleaks.toml')
        result = subprocess.run(['bash', '-c', script], cwd=self.source, capture_output=True,
                                env={**os.environ, 'PR_BASE': base,
                                     'PR_HEAD': head or self.git('rev-parse', 'HEAD'),
                                     'RUNNER_TEMP': str(runner)}, check=False)
        return result.returncode

    def test_added_commit_workflow_blocks_allow_comment(self):
        base = self.suppressed_payload('comment', 'git')
        self.assertEqual(self.run_added_commit_workflow(base), 1)

    def test_added_commit_workflow_blocks_source_ignore(self):
        base = self.suppressed_payload('ignore', 'git')
        self.assertEqual(self.run_added_commit_workflow(base), 1)

    def test_added_commit_workflow_clean_control(self):
        base = self.suppression_repository()
        (self.source / 'clean.txt').write_text('another clean fixture\n')
        self.git('add', '.')
        self.git('commit', '--quiet', '-m', 'test: clean addition')
        self.assertEqual(self.run_added_commit_workflow(base), 0)

    def test_added_commit_invalid_range_fails(self):
        base = self.suppressed_payload('comment', 'git')
        self.assertEqual(self.run_added_commit_workflow(base), 1)
        self.assertNotEqual(self.run_added_commit_workflow('f' * 40), 0)

    def test_added_commit_empty_range_passes(self):
        base = self.suppression_repository()
        self.assertEqual(self.run_added_commit_workflow(base), 0)

    def test_added_commit_invalid_head_fails(self):
        base = self.suppression_repository()
        self.assertNotEqual(self.run_added_commit_workflow(base, 'f' * 40), 0)

    def test_missing_blob_blocks_history_and_range(self):
        base = self.suppressed_payload('comment', 'git')
        # Both tips resolve, but reading the complete patch must fail.
        blob = self.git('rev-parse', 'HEAD:credentials.properties')
        (self.source / '.git' / 'objects' / blob[:2] / blob[2:]).unlink()
        with self.assertRaises(RuntimeError):
            SCANNER.scan(BINARY, 'git', self.source, self.output)
        self.assertNotEqual(self.run_added_commit_workflow(base), 0)

    def test_helper_history_git_failure_blocks(self):
        (self.source / 'credentials.properties').write_text('password=' + fake_value())
        with self.assertRaises(RuntimeError):
            SCANNER.scan(BINARY, 'git', self.source, self.output)

    def test_history_cli_git_failure_blocks(self):
        value = fake_value()
        (self.source / 'credentials.properties').write_text('password=' + value)
        shutil.copyfile(SCANNER.ROOT / '.gitleaks.toml', self.source / '.gitleaks.toml')
        baseline = self.root / 'baseline.json'
        baseline.write_text('[]')
        output = io.StringIO()
        with patch.object(SCANNER, 'ROOT', self.source), \
                patch('sys.argv', ['scan', 'history', '--gitleaks', BINARY,
                                   '--baseline', str(baseline), '--summary',
                                   str(self.root / 'summary.json')]), \
                contextlib.redirect_stdout(output):
            self.assertNotEqual(SCANNER.main(), 0)
        self.assertNotIn(value, output.getvalue())
        self.assertNotIn(str(self.source), output.getvalue())

    def test_history_cannot_inherit_parent_repository(self):
        self.suppression_repository()
        nested = self.source / 'nested'
        nested.mkdir()
        with self.assertRaises(RuntimeError):
            SCANNER.scan(BINARY, 'git', nested, self.output)

    def test_missing_history_source_blocks(self):
        with self.assertRaises(RuntimeError):
            SCANNER.scan(BINARY, 'git', self.source / 'absent', self.output)

    def test_history_without_head_blocks(self):
        subprocess.run(['git', 'init', '--quiet', str(self.source)], check=True,
                       capture_output=True)
        with self.assertRaises(RuntimeError):
            SCANNER.scan(BINARY, 'git', self.source, self.output)

    def test_helper_history_enumeration_failure_blocks(self):
        self.suppression_repository()
        result = subprocess.run

        def fail_history(command, **kwargs):
            if command[0] == 'git' and 'log' in command:
                return subprocess.CompletedProcess(command, 128)
            return result(command, **kwargs)

        with patch.object(SCANNER.subprocess, 'run', side_effect=fail_history), \
                self.assertRaises(RuntimeError):
            SCANNER.scan(BINARY, 'git', self.source, self.output)

    def test_history_clean_control(self):
        self.suppression_repository()
        self.assertEqual(SCANNER.scan(BINARY, 'git', self.source, self.output), [])

    def test_mongodb_protocols_are_detected_without_keywords(self):
        for protocol in ('mongodb', 'mongodb+srv'):
            with self.subTest(protocol=protocol):
                findings = self.detect(f'{protocol}://fixture:{fake_value()}@example.invalid/db')
                self.assertIn('mongodb-userinfo-password', {row['RuleID'] for row in findings})

    def test_alibaba_access_key_secret_is_detected(self):
        for name in ('ALIBABA_ACCESS_KEY_SECRET', 'accessKeySecret', 'access_key_secret',
                     'access-key', 'accessKey'):
            with self.subTest(name=name):
                findings = self.detect(name + '=' + fake_value(30))
                self.assertIn('alibaba-access-key-secret', {row['RuleID'] for row in findings})

    def test_configuration_credentials_are_detected(self):
        for name in ('jwt.secret', 'wechat.appsecret', 'request.validate.token',
                     'PASSWORD', 'passwd', 'access-key', 'aliyunAccessKey'):
            with self.subTest(name=name):
                findings = self.detect(f'{name}={fake_value()}')
                self.assertIn('configuration-secret-value', {row['RuleID'] for row in findings})

    def test_yaml_and_env_assignments_are_detected(self):
        for filename, assignment in (('config.yaml', '  appsecret: "'), ('.env', 'export TOKEN="')):
            with self.subTest(filename=filename):
                findings = self.detect(assignment + fake_value() + '"', filename)
                self.assertIn('configuration-secret-value', {row['RuleID'] for row in findings})

    def test_clean_placeholders_pass(self):
        self.assertEqual(self.detect('jwt.secret=${JWT_SECRET}\npassword=\n'
                                     'token=${LONG_TOKEN_VARIABLE}\ntoken=${_TOKEN_1}\n'
                                     'token=your-token-placeholder\npassword=xxxxxxxxxxxxxxxx\n'), [])

    def test_punctuation_in_password_is_detected(self):
        findings = self.detect('password=' + fake_value(16) + '&$*()!<>')
        self.assertIn('configuration-secret-value', {row['RuleID'] for row in findings})

    def test_placeholder_with_literal_text_is_detected(self):
        for value in ('${X}' + fake_value(), fake_value() + '${X}',
                      '${LONG_TOKEN_VARIABLE}' + fake_value(),
                      '${LONG_TOKEN_VARIABLE};' + fake_value(),
                      '${LONG_TOKEN_VARIABLE}#' + fake_value(),
                      '${LONG_TOKEN_VARIABLE:-' + fake_value() + '}',
                      '${LONG_TOKEN_VARIABLE}${OTHER_VARIABLE}'):
            findings = self.detect('token=' + value)
            self.assertIn('configuration-secret-value', {row['RuleID'] for row in findings})

    def test_alibaba_access_key_id_is_not_a_secret_assignment(self):
        for name in ('accessKeyId', 'access_key_id', 'ALIBABA_ACCESS_KEY_ID'):
            with self.subTest(name=name):
                findings = self.detect(name + '=' + fake_value(30))
                rules = {row['RuleID'] for row in findings}
                self.assertNotIn('alibaba-access-key-secret', rules)
                self.assertNotIn('configuration-secret-value', rules)

    def test_short_low_entropy_password_is_detected(self):
        for length in (8, 12, 15):
            with self.subTest(length=length):
                value = (''.join(secrets.SystemRandom().sample(string.ascii_lowercase, 2)) * length)[:length]
                findings = self.detect('password=' + value)
                self.assertIn('configuration-secret-value', {row['RuleID'] for row in findings})

    def test_junit_xml_credentials_block_artifacts(self):
        for prefix in ('<system-out><![CDATA[\n', '<system-out><![CDATA[',
                       '<system-err><![CDATA['):
            with self.subTest(prefix=prefix):
                value = ''.join(secrets.SystemRandom().sample(string.ascii_lowercase, 3)) * 8
                findings = self.detect(prefix + 'password=' + value + ']]></system-out>',
                                       'TEST-fixture.xml')
                self.assertIn('configuration-secret-value', {row['RuleID'] for row in findings})
                output = io.StringIO()
                with contextlib.redirect_stdout(output):
                    self.assertEqual(SCANNER.artifacts(BINARY, str(self.source / '*.xml')), 1)
                self.assertNotIn(value, output.getvalue())

    def test_junit_xml_placeholder_passes(self):
        self.assertEqual(self.detect('<system-out><![CDATA[token=${TOKEN_VARIABLE}'
                                     ']]></system-out>', 'TEST-fixture.xml'), [])

    def test_history_baseline_counts_same_identity_findings(self):
        repository = self.root / 'repository'
        subprocess.run(['git', 'init', '--quiet', str(repository)], check=True)

        def git(*arguments):
            return subprocess.run(['git', '-C', str(repository), *arguments], check=True,
                                  capture_output=True, text=True).stdout.strip()

        git('config', 'user.name', 'Synthetic Test')
        git('config', 'user.email', 'fixture@example.invalid')
        shutil.copyfile(SCANNER.ROOT / '.gitleaks.toml', repository / '.gitleaks.toml')
        # Different matches on the same line receive the same Gitleaks identity.
        (repository / 'credentials.txt').write_text(' '.join(
            f'mongodb://fixture:{fake_value()}@example.invalid/db' for _ in range(2)))
        git('add', '.')
        git('commit', '--quiet', '-m', 'test: same-line synthetic credentials')
        baseline = repository / '.gitleaks-baseline.json'
        summary = self.root / 'summary.json'
        with patch.object(SCANNER, 'ROOT', repository):
            findings = SCANNER.scan(BINARY, 'git', repository, self.output)
            matches = [row for row in findings if row['RuleID'] == 'mongodb-userinfo-password']
            self.assertEqual(len(matches), 2)
            self.assertEqual(SCANNER.identity(matches[0]), SCANNER.identity(matches[1]))
            baseline.write_text(json.dumps([SCANNER.project(row) for row in findings]))
            self.assertEqual(SCANNER.history(BINARY, baseline, summary), 0)
            # Simulate a baseline approved before a rule exposed the second match.
            findings.remove(matches[0])
            baseline.write_text(json.dumps([SCANNER.project(row) for row in findings]))
            self.assertEqual(SCANNER.history(BINARY, baseline, summary), 1)
            rows = json.loads(summary.read_text())
            self.assertEqual(rows, {'new_findings': 1, 'by_rule': {'mongodb-userinfo-password': 1}})

    def test_fixture_directories_still_detect_unapproved_credentials(self):
        for directory in ('tests',):
            with self.subTest(directory=directory):
                repository = self.root / directory.replace('/', '-')
                repository.mkdir()
                subprocess.run(['git', 'init', '--quiet', str(repository)], check=True)
                payload = repository / directory / 'credentials.properties'
                payload.parent.mkdir(parents=True)
                payload.write_text('token=fake-' + fake_value() + '\n')
                shutil.copyfile(SCANNER.ROOT / '.gitleaks.toml', repository / '.gitleaks.toml')
                with patch.object(SCANNER, 'ROOT', repository):
                    subprocess.run(['git', '-C', str(repository), 'add', '.'], check=True)
                    subprocess.run(['git', '-C', str(repository), '-c', 'user.name=Synthetic Test',
                                    '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet',
                                    '-m', 'test: approved synthetic fixture'], check=True)
                    self.assertEqual(SCANNER.scan(BINARY, 'git', repository, self.output), [])
                    # Keep the default rule's entropy and word filters deterministic.
                    api_value = ''.join(character + str(index % 10) for index, character in enumerate(
                        secrets.SystemRandom().sample(string.ascii_letters, 16)))
                    payload.write_text('token=fake-' + fake_value() + '\n'
                                       'token=${X}' + fake_value() + '\n'
                                       'mongodb://fixture:' + fake_value() + '@example.invalid/db\n'
                                       'ALIBABA_ACCESS_KEY_SECRET=' + fake_value(30) + '\n'
                                       'api_key=' + api_value + '\n')
                    subprocess.run(['git', '-C', str(repository), 'add', '.'], check=True)
                    subprocess.run(['git', '-C', str(repository), '-c', 'user.name=Synthetic Test',
                                    '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet',
                                    '-m', 'test: unapproved synthetic credentials'], check=True)
                    findings = SCANNER.scan(BINARY, 'git', repository, self.output)
                    expected = {'configuration-secret-value', 'mongodb-userinfo-password',
                                'alibaba-access-key-secret', 'generic-api-key'}
                    self.assertTrue(expected <= {row['RuleID'] for row in findings},
                                    {row['RuleID'] for row in findings})
                    # Directory scanning traverses relative paths before checking values.
                    result = subprocess.run(
                        [BINARY, 'dir', '.', '--config', str(repository / '.gitleaks.toml'),
                         '--redact', '--no-banner', '--report-format', 'json',
                         '--report-path', str(self.output)],
                        cwd=repository, capture_output=True, check=False)
                    self.assertEqual(result.returncode, 1)
                    findings = json.loads(self.output.read_text())
                    self.assertTrue(expected <= {row['RuleID'] for row in findings},
                                    {row['RuleID'] for row in findings})

    def test_runtime_uri_expression_exception_does_not_skip_source_file(self):
        filename = '.github/scripts/test_secret_scan.py'
        (self.source / filename).parent.mkdir(parents=True)
        # This source expression is evaluated only when the fixture is generated.
        expression = 'mongodb://fixture:' + '{fake_value()}' + '@example.invalid/db'
        self.assertEqual(self.detect(expression, filename), [])
        findings = self.detect(expression + '\n' + 'mongodb://fixture:' + fake_value()
                               + '@example.invalid/db', filename)
        self.assertIn('mongodb-userinfo-password', {row['RuleID'] for row in findings})
        # The same literal is not exempted outside the scanner regression source.
        findings = self.detect(expression, 'other.py')
        self.assertIn('mongodb-userinfo-password', {row['RuleID'] for row in findings})

    def test_clean_directory_passes(self):
        self.assertEqual(SCANNER.scan(BINARY, 'dir', self.source, self.output), [])

    def test_fake_value_outside_test_paths_is_not_allowlisted(self):
        findings = self.detect('token=fake-' + fake_value())
        self.assertTrue(findings)

    def test_artifact_findings_block_upload(self):
        value = fake_value()
        self.detect('jwt.secret=' + value)
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            self.assertEqual(SCANNER.artifacts(BINARY, str(self.source / '*.properties')), 1)
        self.assertIn('RuleID', output.getvalue())
        self.assertNotIn(value, output.getvalue())

    def test_empty_artifact_glob_passes_without_scanning_workspace(self):
        self.detect('jwt.secret=' + fake_value())
        self.assertEqual(SCANNER.artifacts(BINARY, str(self.source / '*.absent')), 0)

    def test_missing_binary_fails(self):
        with self.assertRaises(OSError):
            SCANNER.scan(str(self.root / 'missing'), 'dir', self.source, self.output)

    def test_unredacted_baseline_is_rejected(self):
        self.output.write_text(json.dumps([{'Secret': fake_value()}]))
        with self.assertRaises(ValueError):
            SCANNER.load_baseline(self.output)

    def test_history_baseline_passes_and_new_remote_commit_fails(self):
        repository = self.root / 'repository'
        subprocess.run(['git', 'init', '--quiet', '-b', 'security/leak-prevention-20261101', str(repository)], check=True)

        def git(*arguments):
            return subprocess.run(['git', '-C', str(repository), *arguments], check=True,
                                  capture_output=True, text=True).stdout.strip()

        git('config', 'user.name', 'Synthetic Test')
        git('config', 'user.email', 'fixture@example.invalid')
        shutil.copyfile(SCANNER.ROOT / '.gitleaks.toml', repository / '.gitleaks.toml')
        payload = repository / 'credentials.properties'
        payload.write_text('jwt.secret=' + fake_value())
        git('add', '.')
        git('commit', '--quiet', '-m', 'test: synthetic historical fixture')
        old_commit = git('rev-parse', 'HEAD')
        baseline = repository / '.gitleaks-baseline.json'
        summary = self.root / 'summary.json'
        with patch.object(SCANNER, 'ROOT', repository):
            self.assertEqual(SCANNER.history(BINARY, baseline, summary, create=True), 0)
            self.assertTrue(SCANNER.load_baseline(baseline))
            self.assertTrue(SCANNER.scan(BINARY, 'git', repository, self.output, baseline))
            self.assertEqual(SCANNER.history(BINARY, baseline, summary), 0)
            payload.write_text('jwt.secret=' + fake_value())
            git('add', 'credentials.properties')
            git('commit', '--quiet', '-m', 'test: new synthetic credential')
            git('update-ref', 'refs/remotes/origin/security/leak-prevention-20261101', 'HEAD')
            git('checkout', '--quiet', '--detach', old_commit)
            self.assertEqual(SCANNER.history(BINARY, baseline, summary), 1)
        rows = json.loads(summary.read_text())
        self.assertEqual(rows['new_findings'], 1)
        self.assertEqual(set(rows), {'new_findings', 'by_rule'})
        self.assertTrue(all(isinstance(count, int) for count in rows['by_rule'].values()))


if __name__ == '__main__':
    unittest.main()
