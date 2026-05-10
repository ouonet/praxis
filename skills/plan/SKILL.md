---
name: plan
description: Use after design approval for milestone plans with executable acceptance.
---
# Plan

`docs/plans/YYYY-MM-DD-<topic>.md`. Reference the spec; don't restate it.

If unresolved spec notes affect implementation or task order, return to `design`.

## Milestone tasks (30-60 min each)
Every task is `- [ ] T<n>: <name>` - always a checkbox, never a heading. `tdd`/`subagents` flip it to `- [x]` on completion; `ship` refuses to run while any `- [ ]` remains.

```
goal:       <one sentence>
files:      <paths>
acceptance: <test or cmd>
spec:       <docs/specs/...#anchor>
```
No exact code. No step-by-step. Acceptance is executable: test name, command, or scripted check. Each task leaves the repo green.

Mark independent tasks: `[parallel] T3, T4, T5`.

Only mark `[parallel]` when shared contracts, state, errors, and acceptance are closed.

**Atomic expansion is lazy** - `subagents` expands a milestone into 2-5 min steps at dispatch time, not here.

New repo: T1 includes repo baseline (`README.md`, `.gitignore`).

## Don't put in the plan
background, architecture, rationale (spec), CI commands, copy-pasted acceptance.

## Hand off

**Gate: `docs/plans/YYYY-MM-DD-<topic>.md` must exist on disk before handing off to `tdd`/`subagents`.**

mostly `[parallel]` -> `subagents`. Otherwise -> `tdd`.