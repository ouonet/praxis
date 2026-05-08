---
name: plan
when: after design approval
---
# Plan

`docs/plans/YYYY-MM-DD-<topic>.md`. Reference the spec; don't restate it.

## Milestone tasks (30-60 min each)
```
goal:       <one sentence>
files:      <paths>
acceptance: <test or cmd>
spec:       <docs/specs/...#anchor>
```
No exact code. No step-by-step. Each task leaves the repo green.

Mark independent tasks: `[parallel] T3, T4, T5`.

**Atomic expansion is lazy** — `subagents` expands a milestone into 2-5 min steps at dispatch time, not here.

## Don't put in the plan
background, architecture, rationale (spec), CI commands, copy-pasted acceptance.

## Hand off
mostly `[parallel]` → `subagents`. Otherwise → `tdd`.

