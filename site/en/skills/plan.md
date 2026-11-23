# plan

The `plan` skill breaks an approved specification into executable milestone tasks in `docs/staging/plans/YYYY-MM-DD-<topic>.md`. It references the spec rather than restating background, architecture, or rationale.

## Rolling Wave & Multi-Module Scope

- **Rolling wave**: When a spec references `milestone: MN` in `docs/ROADMAP.md`, expand only that milestone and leave later milestones as one-line stubs. After `ship`, confirm the next milestone before expanding it; return to `design` only if its goal materially changed.
- **Multi-module topology**: If `topology=multi-module` is declared, read [Multi-Module Protocol](./multi-module) and open the coordinator workspace plan with the declaration block (`topology: multi-module`, `change-set`, `coordinator`, `repos`, module plan paths, and integration task). Every task names one `repository:` and one `module:`, ordered contracts → consumers → local acceptance → integration → linked commits.

## Milestone Tasks (30–60 min each)

Each task is written as a checkbox (`- [ ] T<n>: <name>`) — never a heading — with concrete metadata:

```text
goal:       <one sentence>
files:      <paths>
acceptance: <executable test, command, or explicit manual check>
spec:       <docs/staging/specs/...#anchor>
```

Independent tasks with closed contracts and disjoint write scopes are marked `[parallel] T3, T4, T5`. Atomic step-by-step expansion is deferred to dispatch time (`subagents`).

## Hand-Off Gate

`<gate>`
`docs/staging/plans/YYYY-MM-DD-<topic>.md` (and every module plan for multi-module work) must exist on disk and be confirmed by the user before handing off to `tdd` or `subagents`.
`</gate>`
