---
name: plan
when: after design approval
---
# Plan

`docs/plans/YYYY-MM-DD-<topic>.md`. Reference the spec; don't restate it.

If unresolved spec notes affect implementation or task order, return to `design`.

## Milestone tasks (30-60 min each)
Use `- [ ] T1: <name>` for milestone tasks only.

```
goal:       <one sentence>
files:      <paths>
acceptance: <test or cmd>
spec:       <docs/specs/...#anchor>
```
No exact code. No step-by-step. Acceptance is executable: test name, command, or scripted check. Each task leaves the repo green.

Mark independent tasks: `[parallel] T3, T4, T5`.

Only mark `[parallel]` when shared contracts, state, errors, and acceptance are closed.

**Atomic expansion is lazy** — `subagents` expands a milestone into 2-5 min steps at dispatch time, not here.

## Don't put in the plan
background, architecture, rationale (spec), CI commands, copy-pasted acceptance.

## Hand off
mostly `[parallel]` → `subagents`. Otherwise → `tdd`.

