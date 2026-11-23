# tdd

The `tdd` skill drives implementation after plan approval using strict RED → GREEN → refactor cycles and synchronous documentation updates. In multi-module work, implementation and local acceptance run inside each task's owning repository, updating the coordinator only for shared-contract reality or workspace state.

## Acceptance Modes

Read the active plan task's `acceptance:` field to select the matching mode:

- **Automated acceptance**: No production code without a failing check first. Follow RED (fail for the right reason) → GREEN (minimum implementation to pass) → refactor → sync docs → commit → mark `- [x]`.
- **Manual acceptance**: For config, docs, infra, or content tasks without an automated test, perform the explicit manual verification steps, keep edits minimal, run declared mechanical checks, sync docs, and mark `- [x]`.
- **No acceptance**: Ask the user before writing production code.

## Sync Docs & Completion

- Update `docs/staging/specs/*.md` to reflect actual code behavior (or update living docs directly on `small` tasks with no staging spec).
- Flip `- [ ]` to `- [x]` in `docs/staging/plans/YYYY-MM-DD-<topic>.md` immediately before moving to the next task.
- For linked multi-repository changes, defer commits until coordinator integration passes, then commit in dependency order.

## Refactor Gate

`<gate>`
Before committing: (1) declared lint/format/typecheck checks must pass; (2) evaluate changes against spec `convention:`; (3) verify inward dependencies, isolated side-effects, and cohesion per [Quality Standard](./quality).
`</gate>`
