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

function stableComment(comment) {
  // Reactions and profile decoration are not approval or review evidence.
  const { id, body, created_at, updated_at, path, line, original_line, side,
    start_line, start_side, commit_id, original_commit_id, in_reply_to_id,
    pull_request_review_id } = comment;
  return { id, body, created_at, updated_at, path, line, original_line, side,
    start_line, start_side, commit_id, original_commit_id, in_reply_to_id,
    pull_request_review_id,
    user: { id: comment.user?.id, login: comment.user?.login, type: comment.user?.type } };
}

function discussion(snapshot) {
  // Review receipts are excluded to avoid a circular digest. Their exact bodies
  // are separately bound into the owner approval. QAS shadow output is advisory.
  const reviews = snapshot.reviews.filter(r => r.state === 'CHANGES_REQUESTED'
    || (!receipt(r.body, 'pr-review/v1') && !receipt(r.body, 'owner-approval/v1')));
  const secondOpinions = snapshot.issueComments.filter(c => c.user?.type === 'Bot' && c.user?.login === 'coderabbitai[bot]').map(stableComment);
  return { reviews, comments: snapshot.reviewComments.map(stableComment), threads: snapshot.threads, secondOpinions };
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

function allowlisted(comment, actors) {
  return comment.user?.type === 'User' && actors.some(actor => actor.enabled === true && actor.user_id === comment.user.id
    && actor.login.toLowerCase() === comment.user.login?.toLowerCase());
}

function evidenceComments(snapshot, actors) {
  // Include all allowlisted comments in race detection, including malformed edits.
  return snapshot.issueComments.filter(c => allowlisted(c, actors));
}

function latestReceipt(snapshot, actors, schema) {
  const otherSchemas = ['ai-review/v1', 'owner-approval/v1', 'owner-override/v1'].filter(s => s !== schema);
  const candidates = evidenceComments(snapshot, actors).filter(c => !otherSchemas.some(s => receipt(c.body, s)));
  for (const c of candidates) assert(Number.isSafeInteger(c.id) && c.id > 0
    && Number.isFinite(Date.parse(c.created_at)) && Number.isFinite(Date.parse(c.updated_at)), 'Unknown comment metadata');
  // Creation order is authoritative. Editing an older approval cannot undo a later revocation.
  return candidates.sort((a, b) => b.id - a.id)[0];
}

function validAI(value, policy) {
  const ai = value.ai_review;
  return ai && ai.provider === 'dot' && policy.providers.dot === 'recorded-review'
    && typeof ai.model === 'string' && ai.model.trim().length > 0
    && typeof ai.run_ref === 'string' && ai.run_ref.trim().length >= 8
    && ['independent', 'self-review'].includes(ai.mode);
}

function ownerApproved(snapshot, policy, expected, evidenceSha, now) {
  const c = latestReceipt(snapshot, policy.owner_actors, 'owner-approval/v1');
  if (!c) return false;
  const v = receipt(c.body, 'owner-approval/v1');
  return !!v && ['write', 'maintain', 'admin'].includes(snapshot.permissions[c.user.login])
    && v.comment_id === c.id && sameBinding(v, expected) && v.evidence_sha256 === evidenceSha
    && v.decision === 'approve' && v.approval_source === 'dot' && policy.providers.dot === 'recorded-review'
    && typeof v.approval_ref === 'string' && v.approval_ref.trim().length >= 8
    && typeof v.reason === 'string' && v.reason.trim().length >= 8
    && Number.isSafeInteger(v.issued_at) && Number.isSafeInteger(v.expires_at)
    && v.issued_at <= now && v.expires_at > now && v.expires_at > v.issued_at
    && v.expires_at - v.issued_at <= policy.owner_approval_max_hours * 3600;
}

function ownerOverride(snapshot, policy) {
  const actor = policy.owner_override_actor;
  if (!actor || actor.enabled !== true) return null;
  const comment = latestReceipt(snapshot, [actor], 'owner-override/v1');
  if (!comment) return null;
  const value = receipt(comment.body, 'owner-override/v1');
  if (!value || !['write', 'maintain', 'admin'].includes(snapshot.permissions[comment.user.login])
    || (value.repository !== undefined && value.repository !== snapshot.repository)
    || (value.pr_number !== undefined && value.pr_number !== snapshot.pr.number)
    || value.head_sha !== snapshot.pr.head.sha || value.decision !== 'approve') return null;
  return comment;
}

function evaluate(snapshot, policy, policySha, now = Math.floor(Date.now() / 1000)) {
  assert(policy.version === 'pr-governance/v1' && policy.repository === snapshot.repository, 'Policy repository mismatch');
  assert(policy.providers.dot === 'recorded-review' && policy.providers.codex === 'observe' && policy.providers.coderabbit === 'second-opinion'
    && policy.providers.quantaiservice === 'shadow', 'Unsupported provider policy');
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
  const override = risk.tier === 'R2' ? ownerOverride(snapshot, policy) : null;
  if (override) return { ...result, allowed: true, reason: 'owner_override', route: 'owner-override',
    reviewer: override.user.login, override_comment_id: override.id,
    override: { actor_id: override.user.id, head_sha: expected.head_sha,
      created_at: override.created_at, updated_at: override.updated_at, comment_sha256: digest(override.body) },
    evidence_sha256: digest({ binding: expected, discussion_sha256: discussionSha, override: stableComment(override) }) };
  // Option A: the allowlisted publisher attests a completed AI review. Account
  // identity authenticates the record; it does not prove a separate human/model.
  const comment = latestReceipt(snapshot, policy.ai_review_actors, 'ai-review/v1');
  if (comment) {
    const value = receipt(comment.body, 'ai-review/v1');
    if (value && authorized(comment) && value.comment_id === comment.id && sameBinding(value, expected)
      && value.discussion_sha256 === discussionSha && validAI(value, policy)
      && value.execution_status === 'completed' && value.verdict === 'pass'
      && value.risk_tier === risk.tier && value.coverage?.complete === true
      && value.coverage.reviewed_files === snapshot.files.length
      && Array.isArray(value.limitations) && value.limitations.length === 0
      && validDispositions(value, snapshot)) {
      const evidenceSha = digest({ binding: expected, discussion_sha256: discussionSha, review: stableComment(comment) });
      const approved = risk.tier !== 'R2' || ownerApproved(snapshot, policy, expected, evidenceSha, now);
      return { ...result, evidence_sha256: evidenceSha, review_comment_id: comment.id,
        reviewer: value.ai_review.provider, route: 'recorded-ai', allowed: approved,
        reason: approved ? 'current_commit_reviewed' : 'owner_approval_required' };
    }
    // A newer incomplete/failed AI record must not fall through to older evidence.
    return result;
  }
  for (const route of ['primary', 'fallback']) {
    for (const review of latest) {
      const value = receipt(review.body, 'pr-review/v1');
      if (!value || !validAI(value, policy) || !authorized(review) || !independent(review, snapshot) || review.state !== 'APPROVED'
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
        reason: approved ? 'current_commit_reviewed' : 'owner_approval_required' };
    }
  }
  return result;
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

module.exports = { stableComment, canonical, digest, classify, pathTier, receipt, binding, discussion, evaluate, completeTemplate, evidenceComments };
