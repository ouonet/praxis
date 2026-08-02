# Spec Reviewers Gate

The Spec Reviewers protocol (`skills/references/reviewers.md`) governs the parallel review gate executed during `design` before handing off to `plan`.

## Trigger-Based Selection

Reviewers are selected dynamically based on spec characteristics:

| Trigger Condition | Reviewer Dispatched | Charter |
|---|---|---|
| Always (baseline) | `spec-compliance` | Verifies contract completeness, unambiguous test criteria, and non-narrative formatting. |
| State transitions / async | `state-machine` | Checks state-machine completeness, illegal transitions, timeout, and race conditions. |
| Cross-rule / multiple specs | `cross-rule` | Verifies consistency across system rules, existing specs, and project invariants. |
| Spans modules / repos | `cross-module` | Verifies contract boundaries, schema compatibility, and dependency ordering. |
| Crash / recovery / persistence | `safety` | Checks crash recovery, data loss prevention, idempotent retries, and rollback safety. |
| Implementation complexity | `implementability` | Evaluates whether tasks can be executed cleanly within estimated scope without hidden ambiguities. |

## Parallel Execution & Coordinator Synthesis

1. **Parallel Dispatch**: All triggered reviewers run concurrently as independent subagents.
2. **Coordinator Synthesis**: The primary agent evaluates reviewer findings critically, resolves conflicts, identifies gaps, judges severity, and applies fixes to the spec in a single pass. Reviewers advise; coordinator decides.
