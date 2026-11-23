# Spec Reviewers Gate

The Spec Reviewers protocol (`skills/references/reviewers.md`) governs the parallel review gate executed during `design` after a staging spec exists on disk and before handing off to `plan`.

## Trigger-Based Selection

Run every reviewer whose trigger condition matches the spec. Conditions are additive — if only baseline trigger 1 fires, only `spec-compliance` runs.

| # | Trigger Condition | Reviewer | Model Tier | Charter |
|---|---|---|---|---|
| 1 | **Always** (baseline) | `spec-compliance` | `balanced` | Verify every `contract:`/`invariant:` has an acceptance `test:`, failure modes are defined, scope boundaries are explicit, and data shapes are concrete. |
| 2 | Spec defines **≥3 state enums or state machines** | `state-machine` | `strongest` | Enumerate every legal state transition; flag missing edges, dead/unreachable states, and unstated initial/terminal states. |
| 3 | Spec contains **≥2 rules cross-referencing the same behavior** | `consistency` | `strongest` | Detect contradictions, undefined rule priority, incomplete exception lists, and text-vs-table discrepancies. |
| 4 | **`topology=multi-module` or shared contracts** | `boundary` | `balanced` | Verify single shared-contract owner, explicit versioning rules, serialization compatibility, and cross-module assumptions. |
| 5 | Spec involves **durable writes, external side effects, or commit semantics** | `safety` | `strongest` | Trace every write path; check crash-recovery gaps, overlapping writes, partial-commit behavior, and atomicity boundaries. |
| 6 | **`scope=complex` or expects parallel/subagent execution** | `implementability` | `balanced` | Read as a fresh implementer; flag undefined data structures, ambiguous ordering, unspecified error handling, and missing optional/default semantics. |

Resolution order for reviewer tiers: project `.praxis/model-tiers.yaml` → user `~/.praxis/model-tiers.yaml` → harness default model (`tiers.<tier>.model`).

## Parallel Execution & Coordinator Synthesis

1. **Parallel Dispatch**: Each triggered reviewer runs as an independent subagent given the spec path (`docs/staging/specs/YYYY-MM-DD-<topic>.md`) and returns one finding per line (`BLOCK | GAP | CONFLICT`).
2. **Coordinator Synthesis**: Runs once. The coordinator evaluates each finding critically, resolves conflicts, spots gaps between charters, judges severity (`BLOCK` vs `DEFER` with reason), patches the spec in one pass, and reports findings to the user. Reviewers advise; the coordinator decides.
