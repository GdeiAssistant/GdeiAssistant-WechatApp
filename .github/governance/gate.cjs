'use strict';

const { createHash } = require('node:crypto');

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const matches = (path, rule) => rule.endsWith('/') ? path.startsWith(rule) : path === rule;

function pathTier(path, policy) {
  assert(typeof path === 'string' && path.length > 0 && !path.startsWith('/')
    && !path.includes('\\') && !path.split('/').some(p => p === '..' || p === '.' || p === ''), 'Unknown path');
  const p = path.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  // Protected paths take precedence over prose, tests, examples and fixtures.
  if (p.startsWith('.github/') || /(^|\/)(agents|claude)\.md$/.test(p)
    || /(^|\/)(codeowners|\.coderabbit\.ya?ml|\.env(?:[._-].*)?)$/.test(p)
    || /(^|[\/_.-])(auth(?:entication|orization)?|oauth|login|session|tokens?|credentials?|secrets?|iam|permissions?|privacy|storage|trad(?:e|es|ing)|execut(?:ion|or)s?|orders?|brokers?|risk|deploy(?:ment)?|runtime|strateg(?:y|ies)|governance)([\/_.-]|$)/.test(p)
    || /(^|\/)(dockerfile(?:\..*)?|docker-compose[^/]*|compose\.ya?ml|vercel\.json|wrangler\.(?:toml|jsonc?)|firebase\.json|package(?:-lock)?\.json|requirements[^/]*|pyproject\.toml|setup\.(?:py|cfg)|uv\.lock|poetry\.lock|yarn\.lock|pnpm-lock\.yaml|makefile|.*\.config\.[^/]+)$/.test(p)
    || /\.(?:tf|tfvars|sh|bash|ps1)$/.test(p)
    || policy.r2_paths.some(rule => matches(path, rule))) return 'R2';
  return policy.r0_paths.some(rule => matches(path, rule)) && /\.(?:md|txt)$/.test(p) ? 'R0' : 'R1';
}

function classify(files, expected, policy) {
  assert(Array.isArray(files) && files.length > 0 && files.length === expected && files.length < 3000, 'Incomplete file list');
  assert(new Set(files.map(f => f.filename)).size === files.length, 'Duplicate file');
  let tier = 'R0';
  const rules = [];
  for (const file of files) {
    assert(['added', 'modified', 'removed', 'renamed', 'copied', 'changed'].includes(file.status), 'Unknown file status');
    assert(sha(file.sha), 'Missing file object SHA');
    assert(Number.isSafeInteger(file.additions) && file.additions >= 0 && Number.isSafeInteger(file.deletions) && file.deletions >= 0, 'Unknown diff size');
    if (file.status === 'renamed') assert(file.previous_filename, 'Missing previous path');
    const paths = [file.filename, file.previous_filename].filter(Boolean);
    let fileTier = paths.map(p => pathTier(p, policy)).sort().at(-1);
    // Count actual hunk lines: missing/truncated/binary patches cannot attest coverage.
    const patch = file.patch || '';
    const lines = patch.split('\n');
    assert(lines.filter(l => l.startsWith('+')).length === file.additions
      && lines.filter(l => l.startsWith('-')).length === file.deletions, 'Incomplete patch');
    assert(patch || (file.additions === 0 && file.deletions === 0 && file.status === 'renamed'), 'Missing patch');
    const changed = lines.filter(l => /^[+-]/.test(l)).map(l => l.slice(1));
    // R0 is deliberately narrow: even inline code, links and HTML need a reviewer.
    if (fileTier === 'R0' && (file.status !== 'modified' || changed.some(l => /[`~<>\[\]{}\\$]|^\s{4}|(?:https?:|javascript:|\b(?:curl|wget|npm|python|sudo|bash)\b)/i.test(l)))) fileTier = 'R1';
    if (paths.some(p => /\.(?:md|txt)$/.test(p)) && changed.some(l => /\b(?:auth|iam|secret|credential|permission|trading|orders?|strategy|deploy|workflow|owner-approved)\b|认证|授权|凭据|交易|下单|部署/i.test(l))) fileTier = 'R2';
    if (fileTier > tier) tier = fileTier;
    rules.push({ paths, tier: fileTier });
  }
  return { tier, rules };
}

function binding(snapshot, policySha) {
  const pr = snapshot.pr;
  assert(sha(pr.head.sha) && sha(pr.base.sha) && sha(snapshot.policyCommit), 'Unknown commit');
  return {
    repository: snapshot.repository, repository_id: pr.base.repo.id, pr_number: pr.number,
    head_sha: pr.head.sha, base_sha: pr.base.sha, policy_sha256: policySha,
    diff_sha256: digest(snapshot.files.map(f => ({ filename: f.filename, previous_filename: f.previous_filename || null,
      status: f.status, sha: f.sha, additions: f.additions, deletions: f.deletions, patch: f.patch || '' }))
      .sort((a, b) => a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0)),
  };
}

function stableComment(comment) {
  // Reactions and profile decoration are not approval or review evidence.
  const { id, body, created_at, updated_at, path, line, original_line, side,
    start_line, start_side, original_start_line, original_start_side, position,
    original_position, subject_type, commit_id, original_commit_id, in_reply_to_id,
    pull_request_review_id } = comment;
  return { id, body, created_at, updated_at, path, line, original_line, side,
    start_line, start_side, original_start_line, original_start_side, position,
    original_position, subject_type, commit_id, original_commit_id, in_reply_to_id,
    pull_request_review_id,
    user: { id: comment.user?.id, login: comment.user?.login, type: comment.user?.type } };
}

const stableReview = r => ({ ...stableComment(r), state: r.state, submitted_at: r.submitted_at });
const stableThread = t => ({ id: t.id, isResolved: t.isResolved, isOutdated: t.isOutdated });
function stableCheck(c) {
  return { id: c.id, name: c.name, head_sha: c.head_sha, status: c.status,
    conclusion: c.conclusion, started_at: c.started_at, completed_at: c.completed_at,
    app: { id: c.app?.id, slug: c.app?.slug },
    output: { title: c.output?.title, summary: c.output?.summary, text: c.output?.text } };
}

function latestReviews(reviews) {
  const result = new Map();
  for (const r of reviews) {
    if (r.state === 'PENDING') continue;
    assert(Number.isSafeInteger(r.id) && Number.isSafeInteger(r.user?.id)
      && Number.isFinite(Date.parse(r.submitted_at))
      && ['APPROVED', 'COMMENTED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(r.state), 'Unknown review metadata');
    const old = result.get(r.user.id);
    if (!old || r.submitted_at > old.submitted_at || (r.submitted_at === old.submitted_at && r.id > old.id)) result.set(r.user.id, r);
  }
  return [...result.values()];
}

function allowlisted(comment, actors) {
  return comment.user?.type === 'User' && actors.some(actor => actor.enabled === true && actor.user_id === comment.user.id
    && actor.login.toLowerCase() === comment.user.login?.toLowerCase());
}

function evidenceComments(snapshot, actors) {
  return snapshot.issueComments.filter(c => allowlisted(c, actors));
}

function command(body) {
  const lines = (body || '').trim().split(/\r?\n/);
  const match = /^\/governance (approve|override|revoke)$/.exec(lines.shift());
  if (!match) return null;
  const result = { decision: match[1] };
  for (const line of lines) {
    const field = /^(head|base|policy|evidence|scope|findings|reason): (\S.*)$/.exec(line);
    if (!field || Object.hasOwn(result, field[1])) return null;
    result[field[1]] = field[2].trim();
  }
  return result;
}

function ownerDecision(snapshot, policy, expected, evidenceSha, now) {
  const candidates = evidenceComments(snapshot, policy.owner_actors)
    .filter(c => /^\s*\/governance\b/.test(c.body || ''));
  for (const c of candidates) assert(Number.isSafeInteger(c.id) && c.id > 0
    && Number.isFinite(Date.parse(c.created_at)) && Number.isFinite(Date.parse(c.updated_at)), 'Unknown comment metadata');
  const c = candidates.sort((a, b) => b.id - a.id)[0];
  // A previously observed decision cannot disappear and reveal an older approval.
  const watermark = Math.max(snapshot.ownerWatermark || 0, c?.id || 0);
  if (!c || c.id < watermark) return { valid: false, watermark };
  const v = command(c.body);
  const created = Date.parse(c.created_at) / 1000;
  const valid = !!v && ['write', 'maintain', 'admin'].includes(snapshot.permissions[c.user.login])
    && c.created_at === c.updated_at && created <= now && now < created + policy.owner_approval_max_hours * 3600
    && v.head === expected.head_sha && v.base === expected.base_sha
    && v.policy === expected.policy_sha256 && v.evidence === evidenceSha
    && typeof v.reason === 'string' && v.reason.trim().length >= 8;
  return { valid, watermark, comment_id: c.id, ...v };
}

function codeRabbit(snapshot, policy) {
  const identity = policy.coderabbit;
  const isBot = r => r.user?.type === 'Bot' && r.user.id === identity.user_id && r.user.login === identity.login;
  const checks = snapshot.checkRuns.filter(c => c.name === 'CodeRabbit' && c.head_sha === snapshot.pr.head.sha
    && c.app?.id === identity.app_id && c.app.slug === identity.app_slug);
  for (const c of checks) assert(Number.isSafeInteger(c.id) && Number.isFinite(Date.parse(c.started_at)), 'Unknown check metadata');
  const check = checks.sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at) || b.id - a.id)[0];
  const result = { provider: 'coderabbit', check_id: check?.id || null, review_id: null,
    execution_status: 'unavailable', coverage: 'unknown', limitations: [] };
  if (!check) return { ...result, limitations: ['current_head_check_missing'] };
  if (check.status !== 'completed' || check.conclusion !== 'success'
    || check.output?.title !== 'Finished'
    || !/^Result: Success - Review completed\s*$/m.test(check.output?.summary || '')
    || !Number.isFinite(Date.parse(check.completed_at))) {
    return { ...result, limitations: ['review_not_completed'] };
  }
  const runId = /Run ID:\s*`([a-f0-9-]+)`/.exec(check.output.summary)?.[1];
  const reports = snapshot.reviews.filter(r => isBot(r) && r.commit_id === snapshot.pr.head.sha
    && ['APPROVED', 'COMMENTED', 'CHANGES_REQUESTED'].includes(r.state)
    && Date.parse(r.submitted_at) >= Date.parse(check.started_at)
    && Date.parse(r.submitted_at) <= Date.parse(check.completed_at)
    && runId && r.body?.includes(runId));
  const report = reports.sort((a, b) => b.id - a.id)[0];
  const latest = latestReviews(snapshot.reviews.filter(isBot))[0];
  if (!report || !latest || latest.commit_id !== snapshot.pr.head.sha || latest.state === 'DISMISSED') {
    return { ...result, limitations: ['current_head_completion_review_missing'] };
  }
  const limitations = [];
  // Native provider metadata is used, never a receipt supplied by the PR author.
  const scope = /Files selected for processing:\s*(\d+)(?:<\/strong>)?\s*<\/summary>([\s\S]*?)<\/details>/.exec(report.body);
  const paths = scope ? [...scope[2].matchAll(/^\* `([^`]+)`\s*$/gm)].map(m => m[1]).sort() : [];
  const expectedPaths = snapshot.files.map(f => f.filename).sort();
  if (!scope || Number(scope[1]) !== paths.length || canonical(paths) !== canonical(expectedPaths)) limitations.push('file_coverage_partial');
  if (!report.body.includes(`between ${snapshot.pr.base.sha} and ${snapshot.pr.head.sha}`)) limitations.push('full_diff_range_unproven');
  // Explicit stage completion prevents a successful wrapper from standing in for analysis.
  for (const stage of ['Generate review feedback', 'Publish review results']) {
    if (!check.output.summary.includes(`| ${stage} | Completed |`)) limitations.push('review_stages_unproven');
  }
  if (/files? (?:not reviewed|skipped|excluded)|(?:review|coverage) (?:incomplete|partial)|oversized|超出.{0,8}限制|未审查的文件/i.test(report.body)) limitations.push('provider_coverage_limitation');
  if (snapshot.coderabbitConfig !== snapshot.trustedCoderabbitConfig || !snapshot.coderabbitConfig) limitations.push('candidate_config_changed');
  if (snapshot.issueComments.some(c => /^\s*@coderabbitai\s+(?:full\s+)?review\b[^\n]*--with-config/m.test(c.body || ''))) limitations.push('command_config_override');
  return { ...result, review_id: report.id, decision_review_id: latest.id, run_id: runId,
    execution_status: 'completed', coverage: limitations.length ? 'partial' : 'reported_complete', limitations };
}

function evaluate(snapshot, policy, policySha, now = Math.floor(Date.now() / 1000)) {
  assert(policy.version === 'pr-governance/v2' && policy.repository === snapshot.repository, 'Policy repository mismatch');
  assert(policy.providers.coderabbit === 'sha-bound-review', 'Unsupported provider policy');
  assert(snapshot.pr.state === 'open' && snapshot.complete === true, 'Incomplete snapshot');
  assert(snapshot.commits.length === snapshot.pr.commits && snapshot.commits.length < 250, 'Incomplete commit list');
  assert(Array.isArray(snapshot.checkRuns), 'Incomplete checks');
  const risk = classify(snapshot.files, snapshot.pr.changed_files, policy);
  const expected = binding(snapshot, policySha);
  const result = { ...risk, binding: expected, policy_version: policy.version, allowed: false,
    reason: 'current_commit_review_required', providers: policy.providers };
  const latest = latestReviews(snapshot.reviews);
  const blockers = latest.filter(r => r.state === 'CHANGES_REQUESTED'
    && (r.user.id === policy.coderabbit.user_id || ['write', 'maintain', 'admin'].includes(snapshot.permissions[r.user.login])))
    .map(r => `review:${r.id}`);
  blockers.push(...snapshot.threads.filter(t => !t.isResolved).map(t => `thread:${t.id}`));
  if (risk.tier === 'R0') return { ...result, allowed: !blockers.length, blocking_findings: blockers,
    reason: blockers.length ? 'review_findings_blocking' : 'review_not_required' };
  const ai = codeRabbit(snapshot, policy);
  const scopes = [];
  if (ai.execution_status !== 'completed') scopes.push('ai-review-unavailable');
  else if (ai.coverage !== 'reported_complete') scopes.push('ai-review-partial');
  if (blockers.length) scopes.push('review-findings');
  const providerComments = snapshot.issueComments.filter(c => c.user?.id === policy.coderabbit.user_id);
  const evidenceSha = digest({ binding: expected, ai, blockers, reviews: snapshot.reviews.map(stableReview),
    checks: snapshot.checkRuns.filter(c => c.app?.id === policy.coderabbit.app_id).map(stableCheck),
    reviewComments: snapshot.reviewComments.map(stableComment), threads: snapshot.threads.map(stableThread), providerComments: providerComments.map(stableComment),
    config: snapshot.coderabbitConfig, trustedConfig: snapshot.trustedCoderabbitConfig });
  const decision = ownerDecision(snapshot, policy, expected, evidenceSha, now);
  Object.assign(result, { ai, blocking_findings: blockers, required_override_scopes: scopes,
    evidence_sha256: evidenceSha, owner_comment_id: decision.comment_id || null, owner_watermark: decision.watermark });
  if (decision.decision === 'revoke' || (decision.watermark && !decision.valid)) {
    return { ...result, reason: decision.decision === 'revoke' ? 'owner_revoked' : 'owner_decision_invalid' };
  }
  if (scopes.length) {
    const requested = (decision.scope || '').split(',').map(s => s.trim()).sort();
    const findings = (decision.findings || '').split(',').map(s => s.trim()).filter(Boolean).sort();
    const overridden = decision.valid && decision.decision === 'override'
      && canonical(requested) === canonical([...scopes].sort())
      && canonical(findings) === canonical([...blockers].sort());
    return { ...result, allowed: overridden, reason: overridden ? 'approved_with_override' : scopes[0] };
  }
  const approved = risk.tier !== 'R2' || (decision.valid && decision.decision === 'approve' && !decision.scope && !decision.findings);
  return { ...result, allowed: approved, reason: approved ? 'current_commit_reviewed' : 'owner_approval_required' };
}

function completeTemplate(body) {
  // Whitespace prevents joining delimiters; an unterminated comment hides the rest.
  const text = (body || '').replace(/<!--[\s\S]*?(?:-->|$)/g, ' ');
  const sections = [...text.matchAll(/^#{1,6}\s+(.+)\r?\n([\s\S]*?)(?=^#{1,6}\s|$(?![\s\S]))/gm)];
  const used = new Set();
  const present = pattern => {
    const index = sections.findIndex(([, heading, content], i) => !used.has(i) && pattern.test(heading)
      && content.replace(/```[\s\S]*?```/g, '').replace(/[-*]\s*\[[ x]\]/g, '').trim().length > 3
      && !/^\s*(?:TODO|TBD|N\/A|Describe the change.*|Which AI tool.*|List the checks.*)\s*$/i.test(content));
    if (index < 0) return false;
    used.add(index);
    return true;
  };
  return present(/\bAI\b|模型|人工智能/i) && present(/what changed|summary|problem|changes|变更|改动|做了什么/i)
    && present(/how verified|verif|validat|test(?:ing| plan)?|验证|测试/i);
}

module.exports = { stableComment, stableReview, stableThread, stableCheck, canonical, digest, classify, pathTier, binding, evaluate, completeTemplate, evidenceComments, command };
