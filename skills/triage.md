---
name: triage
when: first action on every user message
---
# Triage

Classify, announce, proceed. One line:
```
praxis: scope=<x>, loading=<skills>
```

| scope | signal | load |
|---|---|---|
| trivial | typo, rename, doc, ≤1-line, pure Q | none |
| small | one function, single file, ≤50 LOC | `tdd` |
| standard | feature, multi-file, new behavior | `design` → `plan` → `tdd` → `review` |
| complex | new system, ≥5 tasks, parallel | `design` → `plan` → `worktree` → `subagents` → `review` → `ship` |
| debug | broken, regression, failing test | `debug` first, then route fix |
| release | version, tag, publish, release notes | `release` |

Torn? Pick smaller. "just X" / "quickly" / "no tests" → downgrade. "design it" / "properly" → upgrade.

- Never load a skill not listed for the chosen scope.
