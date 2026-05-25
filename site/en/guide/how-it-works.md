# How It Works

At session start, a hook injects the `praxis:using-praxis` skill. On every message, the agent:

1. **Classifies scope** inline using the triage table — no extra skill call needed.
2. **Announces** the scope and loads required skills in parallel.
3. **Follows** the loaded skills literally, respecting `<gate>` markers.

## Triage

| Scope | Signal | Skills loaded |
|---|---|---|
| vague | problem space undefined | `discover` |
| trivial | typo, rename, docs-only, ≤1 line | none |
| small | one function, single file, ≤50 LOC | `tdd` |
| standard | feature or source-code change | `design`, `plan`, `tdd`, `review` |
| complex | new system, ≥5 tasks, parallel edits | `design`, `plan`, `worktree`, `subagents`, `review`, `ship` |
| debug | broken, regression, failing test | `debug` |
| onboard | existing project, no tech-spec | `onboard` |

## Example flows

### Tiny fix
```
You:   fix the typo "teh" in README
Agent: scope=trivial → edit → done
```

### Standard feature
```
You:   add OAuth login with GitHub
Agent: scope=standard → design → plan → tdd → review → ship
```

### Vague goal
```
You:   I want to build something that helps developers manage their workflow
Agent: scope=vague → discover (hypotheses, experiments, spike code)
                   → confirmed direction → design → ...
```

### Large project (rolling wave)
```
You:   build a new auth system from scratch
Agent: scope=complex → design (spec + roadmap M1/M2/M3)
                     → plan M1 → tdd → ship M1
                     → plan M2 → tdd → ship M2 → ...
```
