# Pull request evidence contract

This pilot implements `pr-governance/v1`. It proposes changes to the two pilot
repositories only. Existing required CI, strict base updates and conversation
resolution remain separate merge requirements. A successful `risk-gate` means
the review contract passed; it does not mean CI, deployment or business
execution succeeded.

The workflow never merges, labels, calls a model, reads service secrets or
changes protection.

## Risk and reviewer routes

| Tier | Scope | Primary | Fallback | Required evidence |
| --- | --- | --- | --- | --- |
| R0 | Modified plain prose in the explicit allowlist, with a complete text patch | Deterministic prose rules | Independent maintainer after escalation to R1 | `review_not_required`, matched paths, policy and diff digests; existing required CI |
| R1 | Ordinary application behavior and content not proven to be R0 | SHA-bound AI review recorded by an allowlisted actor | AI-assisted independent maintainer/admin review | Complete current-head AI evidence; existing required CI |
| R2 | Trading, orders, risk, authentication, permissions, credentials, privacy/data access, IAM, deployment, dependency hooks, workflows and review policy | SHA-bound AI review | Same AI evidence requirements | R1 evidence plus an allowlisted structured Grok approval comment bound to that evidence |

The primary route is a completed AI review recorded in an authenticated PR
comment. The publisher may share the PR author's account; the record must state
whether the AI review was independent or a self-review. It is not an independent
human approval.

Native AI-assisted reviews remain an alternative: their reviewer
must be independent of the PR author and linked commit authors/committers, with
current write/maintain/admin access (admin for fallback). No route overrides an
active changes-requested review or unresolved thread.

Both old and new paths are classified; the maximum tier wins. Protected paths
are checked before documentation, tests, examples and fixtures. In particular,
`src/ai_service/auth.py`, every `AGENTS.md`, `.coderabbit.yaml`, CODEOWNERS
and all of `.github/` are R2. Repository-specific paths live in `policy.json`.

Executable or ambiguous prose is escalated; unknown file states, missing or
truncated patches, binary changes and incomplete API lists stop evaluation.
There is no blanket low-risk exception for tests or dependency bots. Changes
outside the allowlist are at least R1.

A reviewer may request R2 treatment by changing the trusted path policy
through an R2 PR; a model cannot downgrade risk.

CodeRabbit remains an optional second opinion; its free-form summary or label
cannot pass the gate. An allowlisted publisher can record a completed Codex,
CodeRabbit or Grok AI review with its model and execution reference.
QuantAIService remains non-blocking shadow: its absence, failure and output never
satisfy or veto the gate. The evaluator itself never calls a model.

## Trusted inputs and binding

The privileged workflow reads its evaluator and policy from the current
default branch at one immutable commit. It never checks out PR code or
consumes relay artifacts. A candidate policy cannot approve its own change.

The policy digest is SHA-256 of canonical JSON containing the exact
`gate.cjs`, `runner.cjs`, `policy.json` and `risk-gate.yml` source strings.
The canonical encoder sorts object keys lexicographically, preserves array
order and uses JSON encoding.

Every receipt binds repository name and numeric ID, PR number, base SHA, head
SHA, policy digest and canonical diff digest. The latter covers the complete
sorted file list, old/new paths, status, file object SHA, additions, deletions
and patch text.

The collector reads every REST page, checks file and commit counts and reads
every GraphQL thread page. PRs with 3,000 files or 250 commits are refused
because the corresponding APIs can cap results.

The collector re-reads the entire evidence snapshot and default-branch commit
before publication. Changes during evaluation produce an error, never success.

Labels alone have no approval authority. Actor numeric ID and login must match
the trusted `ai_review_actors` or `owner_actors` allowlist; current write, maintain
or admin permission is checked through GitHub. Identity is never taken from the
JSON body.

All comments by allowlisted actors are included in publication race
detection, including malformed edits.

Option A trusts the allowlisted account to attest the referenced AI execution and
Grok decision. GitHub authentication does not distinguish a person from an agent
using that account, and a reference string is not proof that a model ran. The
publisher must verify the real result before posting it.

No signing key, secret
or cryptographic owner identity is required. Allowlist changes are R2 changes.

## Technical review receipt

For the primary route, post a placeholder PR Conversation comment, obtain its
GitHub ID, then edit it to the complete `ai-review/v1` JSON object (optionally in
one JSON fence).

Copy the binding and discussion fields from the trusted gate
summary and include `comment_id` matching that comment. Use the fields below,
with `schema_version: ai-review/v1`; the native-only `reviewer`, `route` and
`independent` fields are not needed.

`ai_review.mode` records the actual review
method. Include the exact model and a traceable run/session/report reference.
A newer failed, incomplete or malformed record blocks older evidence.

Alternatively submit this `pr-review/v1` JSON object as a native APPROVED review
at the current head SHA through an independent maintainer/admin account. This
route also requires AI provenance; a human-only review does not satisfy it.

```json
{
  "schema_version": "pr-review/v1",
  "ai_review": {"provider": "codex", "model": "<actual model>", "run_ref": "<execution reference>", "mode": "independent"},
  "repository": "example/project",
  "repository_id": 100,
  "pr_number": 42,
  "base_sha": "<40-character base SHA>",
  "head_sha": "<40-character head SHA>",
  "diff_sha256": "<trusted diff digest>",
  "policy_sha256": "<trusted policy digest>",
  "discussion_sha256": "<trusted discussion digest>",
  "reviewer": "independent-maintainer",
  "route": "primary",
  "independent": true,
  "risk_tier": "R1",
  "execution_status": "completed",
  "verdict": "pass",
  "coverage": {"complete": true, "reviewed_files": 3},
  "blocking_findings": [],
  "dispositions": [],
  "limitations": []
}
```

The fallback uses `route: fallback`, `reviewer: independent-admin` and a
non-empty `fallback_reason`. An incomplete review or a non-empty limitations
list cannot pass. The latest submitted review per identity controls
eligibility; COMMENTED, CHANGES_REQUESTED or DISMISSED invalidates that
identity's old approval. All unresolved threads block R1/R2.

A thread's resolved flag is insufficient: the independent reviewer must also
account for each inline comment and each changes-requested review in
`dispositions`.

Each disposition contains `source_id` (`comment:<REST-id>` or
`review:<REST-id>`), `severity` (P0–P3), `outcome` (`fixed`, `not_applicable`,
or `accepted`), a concrete `reason` and an `evidence` reference. A fixed
finding also names `fixed_in`, which must be the current head.

P0/P1 cannot be accepted; they require a verified fix or the independent
reviewer's explanation of why they do not apply. P2/P3 acceptance is explicit
and is included in the owner decision for R2. The publisher attests the actual
review result; the gate cannot establish semantic correctness from JSON.

CI references in the review must identify the actual commit/run; existing
native required checks independently enforce CI.

The discussion digest includes native non-receipt reviews, inline comments,
thread states and CodeRabbit second-opinion comments. Structured native review/owner
receipts are excluded to avoid circular hashes; changes-requested reviews are
always included. The owner evidence digest additionally binds the selected
technical review's exact GitHub record.

Late findings, edits, dismissal, new pushes, base changes and policy changes
require fresh evidence.

## Owner approval

R2 uses option A: a SHA-bound AI review plus a structured Grok approval record
posted by an actor in `owner_actors`. The `owner-approved` label is a visible
marker only; it cannot satisfy the gate. This replaces the former empty
`owner_keys`/Ed25519 requirement.

After reading the completed AI review and actual Grok decision for the current
head, an authorized publisher creates a placeholder PR Conversation comment,
obtains its ID, then edits that comment to this complete object:

```json
{
  "schema_version": "owner-approval/v1",
  "repository": "example/project",
  "repository_id": 100,
  "pr_number": 42,
  "base_sha": "<base SHA>",
  "head_sha": "<current head SHA>",
  "diff_sha256": "<diff digest>",
  "policy_sha256": "<policy digest>",
  "evidence_sha256": "<digest of the selected AI review and discussion>",
  "comment_id": 900,
  "approval_source": "grok",
  "approval_ref": "<actual Grok decision reference>",
  "decision": "approve",
  "reason": "<scope and remaining risk accepted>",
  "issued_at": 2000000000,
  "expires_at": 2000003600
}
```

The maximum lifetime is 24 hours. Any new head, base, policy, diff or selected
AI evidence makes the approval stale. Copying an old body into a new comment
fails its comment-ID binding. To withdraw approval, edit `decision` to `revoke`
or post a newer owner comment; newer comments take precedence by creation ID,
not edit time. Malformed newer comments block older approval.

Comments carrying
the other valid receipt schema are excluded when selecting each role's latest
record, so the same account can publish both records. Deleting a record removes
that evidence; use an explicit revocation to keep a durable withdrawal instead
of deleting it and exposing an older record.

Approval grants only the reviewed PR decision, never deployment, IAM or trading
permission. A coding agent must not invent a Grok result or claim its own review
was independent; publishing records and adding labels requires the user's scope.

## Events, failure and operational limits

PR events and review/comment events wake a trusted evaluator. The unprivileged
review relay is only a signal; its conclusion and artifacts are ignored.
Normal events target one PR or associated PRs. Missing fork associations use
one bounded serial sweep.

Default-branch pushes and a 15-minute reconciliation sweep refresh base
changes, thread state, expiry and events GitHub suppresses. Sweeps refuse more
than 100 open PRs without truncating; explicit PR dispatch remains available.
There is no 600-second wait, model request job or per-event all-PR runner
matrix.

The existing `risk-gate` and `pr-template` status names are preserved. A draft PR
still runs the base branch's existing gate until this proposal is merged under
explicit user authorization; this proposal cannot self-activate. Required CI and protection
are not changed. API errors and incomplete evidence fail the evaluator closed.

GitHub commit statuses are asynchronous and have no automatic expiry. A
dismissal, base update, runner outage or suppressed/delayed event can leave a
previously published status visible until re-evaluation; the sweep reduces but
cannot remove that window. Native strict-base and conversation rules remain
important.

This pilot does not claim synchronous revocation or production acceptance.
Before any later enforcement rollout, verify actual event delivery, AI review
completion and Grok approval comment delivery on the current commit.

Run the dependency-free offline suite with:

```sh
node --test .github/governance/test-*.cjs
```

The API semantics follow [GitHub reviews](https://docs.github.com/en/rest/pulls/reviews)
, [issue comments](https://docs.github.com/en/rest/issues/comments)
and [workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
