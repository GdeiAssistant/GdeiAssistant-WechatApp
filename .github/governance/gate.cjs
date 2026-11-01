'use strict';

const { createHash, createPublicKey, verify } = require('node:crypto');

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

function receipt(body, schema) {
  // A whole review/comment body must be a JSON object, optionally in one JSON fence.
  try {
    const text = (body || '').trim().replace(/^```json\s*\n([\s\S]*?)\n```$/, '$1');
    const value = JSON.parse(text);
    return value?.schema_version === schema ? value : null;
  } catch { return null; }
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

function discussion(snapshot) {
  // Review receipts are excluded to avoid a circular digest. Their exact bodies
  // are separately bound into the owner approval. QAS shadow output is advisory.
  const reviews = snapshot.reviews.filter(r => r.state === 'CHANGES_REQUESTED'
    || (!receipt(r.body, 'pr-review/v1') && !receipt(r.body, 'owner-approval/v1')));
  const secondOpinions = snapshot.issueComments.filter(c => c.user?.type === 'Bot' && c.user?.login === 'coderabbitai[bot]');
  return { reviews, comments: snapshot.reviewComments, threads: snapshot.threads, secondOpinions };
}

function sameBinding(value, expected) {
  return Object.entries(expected).every(([key, v]) => value[key] === v);
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

function independent(review, snapshot) {
  const ids = new Set([snapshot.pr.user.id, ...snapshot.commits.flatMap(c => [c.author?.id, c.committer?.id]).filter(Boolean)]);
  return review.user.type === 'User' && !ids.has(review.user.id);
}

function validDispositions(value, snapshot) {
  if (!Array.isArray(value.dispositions) || !Array.isArray(value.blocking_findings) || value.blocking_findings.length) return false;
  const sources = new Set(snapshot.reviewComments.map(c => `comment:${c.id}`));
  for (const r of snapshot.reviews) if (r.state === 'CHANGES_REQUESTED') sources.add(`review:${r.id}`);
  const covered = new Set();
  for (const d of value.dispositions) {
    if (!sources.has(d.source_id) || covered.has(d.source_id) || !['P0', 'P1', 'P2', 'P3'].includes(d.severity)
      || !['fixed', 'not_applicable', 'accepted'].includes(d.outcome) || typeof d.reason !== 'string' || d.reason.trim().length < 8
      || typeof d.evidence !== 'string' || d.evidence.trim().length < 8) return false;
    if (['P0', 'P1'].includes(d.severity) && d.outcome === 'accepted') return false;
    if (d.outcome === 'fixed' && d.fixed_in !== snapshot.pr.head.sha) return false;
    covered.add(d.source_id);
  }
  return [...sources].every(id => covered.has(id));
}

function ownerApproved(snapshot, policy, expected, evidenceSha, now) {
  // No key is installed by this pilot. GitHub identity alone cannot establish
  // human approval when a coding agent also holds the owner's GitHub token.
  const candidates = latestReviews(snapshot.reviews).filter(r => policy.owner_keys.some(k => k.user_id === r.user.id));
  const c = candidates.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at) || b.id - a.id)[0];
  if (!c) return false;
  const v = receipt(c.body, 'owner-approval/v1');
  if (!v) return false;
  const key = policy.owner_keys.find(k => k.key_id === v.key_id && k.user_id === c.user.id);
  const { signature, ...payload } = v;
  if (!key || !['APPROVED', 'COMMENTED'].includes(c.state) || c.commit_id !== expected.head_sha
    || v.review_id !== c.id || c.user.type !== 'User' || !sameBinding(v, expected) || v.evidence_sha256 !== evidenceSha
    || v.decision !== 'approve' || typeof v.reason !== 'string' || v.reason.trim().length < 8
    || !Number.isSafeInteger(v.issued_at) || !Number.isSafeInteger(v.expires_at)
    || v.issued_at > now || v.expires_at <= now || v.expires_at <= v.issued_at
    || v.expires_at - v.issued_at > policy.owner_approval_max_hours * 3600
    || typeof signature !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(signature)) return false;
  try {
    const publicKey = createPublicKey(key.public_key);
    return publicKey.asymmetricKeyType === 'ed25519'
      && verify(null, Buffer.from(canonical(payload)), publicKey, Buffer.from(signature, 'base64'));
  } catch { return false; }
}

function evaluate(snapshot, policy, policySha, now = Math.floor(Date.now() / 1000)) {
  assert(policy.version === 'pr-governance/v1' && policy.repository === snapshot.repository, 'Policy repository mismatch');
  assert(policy.providers.codex === 'observe' && policy.providers.coderabbit === 'second-opinion'
    && policy.providers.quantaiservice === 'shadow', 'Provider promotion requires a verified adapter');
  assert(snapshot.pr.state === 'open' && snapshot.complete === true, 'Incomplete snapshot');
  assert(snapshot.commits.length === snapshot.pr.commits && snapshot.commits.length < 250, 'Incomplete commit list');
  const risk = classify(snapshot.files, snapshot.pr.changed_files, policy);
  const expected = binding(snapshot, policySha);
  const discussionSha = digest(discussion(snapshot));
  const result = { ...risk, binding: expected, discussion_sha256: discussionSha, allowed: false,
    reason: 'current_commit_review_required', providers: policy.providers };
  if (risk.tier === 'R0') return { ...result, allowed: true, reason: 'review_not_required', reviewer: policy.reviewers.R0.primary };
  const latest = latestReviews(snapshot.reviews);
  const authorized = r => ['write', 'maintain', 'admin'].includes(snapshot.permissions[r.user.login]);
  if (latest.some(r => authorized(r) && r.state === 'CHANGES_REQUESTED')) return { ...result, reason: 'changes_requested' };
  if (snapshot.threads.some(t => !t.isResolved)) return { ...result, reason: 'unresolved_review_thread' };
  for (const route of ['primary', 'fallback']) {
    for (const review of latest) {
      const value = receipt(review.body, 'pr-review/v1');
      if (!value || !authorized(review) || !independent(review, snapshot) || review.state !== 'APPROVED'
        || review.commit_id !== expected.head_sha || !sameBinding(value, expected)
        || value.discussion_sha256 !== discussionSha || value.route !== route
        || value.reviewer !== policy.reviewers[risk.tier][route]
        || value.execution_status !== 'completed' || value.verdict !== 'pass'
        || value.risk_tier !== risk.tier || value.independent !== true
        || !value.coverage || value.coverage.complete !== true
        || value.coverage.reviewed_files !== snapshot.files.length
        || !Array.isArray(value.limitations) || value.limitations.length
        || !validDispositions(value, snapshot)) continue;
      if (route === 'fallback' && (snapshot.permissions[review.user.login] !== 'admin'
        || typeof value.fallback_reason !== 'string' || value.fallback_reason.trim().length < 8)) continue;
      const evidenceSha = digest({ binding: expected, discussion_sha256: discussionSha, review });
      const approved = risk.tier !== 'R2' || ownerApproved(snapshot, policy, expected, evidenceSha, now);
      return { ...result, evidence_sha256: evidenceSha, review_id: review.id,
        reviewer: value.reviewer, route, allowed: approved,
        reason: approved ? 'current_commit_reviewed' : policy.owner_keys.length ? 'owner_approval_required' : 'owner_approval_channel_not_configured' };
    }
  }
  return result;
}

function completeTemplate(body) {
  const text = (body || '').replace(/<!--[\s\S]*?-->/g, '');
  const sections = [...text.matchAll(/^#{1,6}\s+(.+)\r?\n([\s\S]*?)(?=^#{1,6}\s|$(?![\s\S]))/gm)];
  const present = pattern => sections.some(([, heading, content]) => pattern.test(heading)
    && content.replace(/```[\s\S]*?```/g, '').replace(/[-*]\s*\[[ x]\]/g, '').trim().length > 3
    && !/^\s*(?:TODO|TBD|N\/A|Describe the change.*|Which AI tool.*|List the checks.*)\s*$/i.test(content));
  return present(/AI|模型|人工智能/i) && present(/what changed|summary|problem|changes|变更|改动|做了什么/i)
    && present(/how verified|verif|validat|test(?:ing| plan)?|验证|测试/i);
}

module.exports = { canonical, digest, classify, pathTier, receipt, binding, discussion, evaluate, completeTemplate };
