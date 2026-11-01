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
| R1 | Ordinary application behavior and content not proven to be R0 | Independent maintainer with current write, maintain or admin access | A different eligible independent admin, with a reason the primary route is unavailable | Current-head native GitHub APPROVED review with a complete `pr-review/v1` receipt; existing required CI |
| R2 | Trading, orders, risk, authentication, permissions, credentials, privacy/data access, IAM, deployment, dependency hooks, workflows and review policy | Independent maintainer | Independent admin with the same technical review requirements | R1 evidence plus an independently signed owner decision bound to that evidence |

Routes describe eligible roles, not a claim that a reviewer has been assigned.
The reviewer cannot be the PR author or a linked author/committer of any PR
commit. A fallback is another actual review, never timeout, quota, CI success or
an owner label. The fallback does not overrule an active changes-requested review.

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

CodeRabbit remains an optional second opinion. Its approval is not technical
or owner authorization. Codex stays in observation until a trusted adapter can
verify current-commit completion, full coverage and finding disposition.
QuantAIService stays in non-blocking shadow mode: its absence, failure and
output never satisfy or veto the gate.

This phase makes no service call and does not claim that a live shadow review
ran. In particular, changes to QuantAIService are reviewed by an independent
human route, not the changed service itself.

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
Labels and arbitrary issue comments have no approval authority. Review
identity, state, commit and current repository permission are obtained from
GitHub, not from the JSON body.

GitHub authentication alone cannot distinguish a human from an agent using the
same account; owner approval therefore has a separate signer.

## Technical review receipt

Use the complete JSON object as the native GitHub review body, optionally inside
one `json` code fence, and submit the review as APPROVED at the explicit current
head SHA. Copy binding and discussion fields from the trusted gate run summary
after independently reviewing that exact diff. A receipt in an issue comment,
PR description or check output is never a technical review.

```json
{
  "schema_version": "pr-review/v1",
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
and is included in the owner decision for R2. This is authenticated human
judgment, not an automated claim that a fix is semantically correct.

CI references in the review must identify the actual commit/run; existing
native required checks independently enforce CI.

The discussion digest includes native non-receipt reviews, inline comments,
thread states and CodeRabbit second-opinion comments. Structured review/owner
receipts are excluded to avoid circular hashes; changes-requested reviews are
always included. The owner evidence digest additionally binds the selected
technical review's exact GitHub record.

Late findings, edits, dismissal, new pushes, base changes and policy changes
require fresh evidence.

## Owner approval

The pilot intentionally ships `owner_keys: []`. No production signing identity
has been established by this change. R2 reports
`owner_approval_channel_not_configured` until a separately authorized setup
adds a verified owner public key to trusted policy. No private key belongs in
the repository, workflow, agent environment or chat.

The signing credential must be inaccessible to coding agents; a key controlled
by the same agent does not establish owner approval. Key enrollment is itself
an R2 change and needs an independently reviewed bootstrap decision under the
existing governance.

The owner first reads the exact technical evidence and remaining risk. Using
their authenticated client, they create a pending native review for the
current head, obtain its review ID, sign the following payload with their
isolated Ed25519 key, update that review body and submit it as COMMENTED (or
APPROVED).

The signature is standard base64 of Ed25519 over UTF-8 canonical JSON of every
field except `signature`. `owner_keys` entries contain `key_id`, the
authenticated GitHub numeric `user_id`, and a PEM `public_key`; examples and
tests use only ephemeral synthetic keys.

```json
{
  "schema_version": "owner-approval/v1",
  "repository": "example/project",
  "repository_id": 100,
  "pr_number": 42,
  "base_sha": "<base SHA>",
  "head_sha": "<head SHA>",
  "diff_sha256": "<diff digest>",
  "policy_sha256": "<policy digest>",
  "evidence_sha256": "<digest of the selected technical review and discussion>",
  "review_id": 900,
  "key_id": "<enrolled owner key>",
  "decision": "approve",
  "reason": "<scope and remaining risk accepted by the owner>",
  "issued_at": 2000000000,
  "expires_at": 2000003600,
  "signature": "<base64 signature>"
}
```

Only the latest submitted review from the enrolled owner identities can count.
Its authenticated actor, review ID, state and commit must match. The review-ID
binding prevents copying a signed approval into a later review to undo a
revocation. Dismissal, editing the signed body, a later owner review or
expiration withdraws approval.

The maximum lifetime is 24 hours. Approval grants only the reviewed PR
decision, never deployment, IAM or trading permission.

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
still runs the base branch's existing gate until this proposal is merged by an
authorized human; this proposal cannot self-activate. Required CI and protection
are not changed. API errors and incomplete evidence fail the evaluator closed.

GitHub commit statuses are asynchronous and have no automatic expiry. A
dismissal, base update, runner outage or suppressed/delayed event can leave a
previously published status visible until re-evaluation; the sweep reduces but
cannot remove that window. Native strict-base and conversation rules remain
important.

This pilot does not claim synchronous revocation or production acceptance.
Before any later enforcement rollout, verify actual event delivery, provider
completion and the isolated owner signing channel on the current commit.

Run the dependency-free offline suite with:

```sh
node --test .github/governance/test-*.cjs
```

The API semantics follow [GitHub reviews](https://docs.github.com/en/rest/pulls/reviews)
and [workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
