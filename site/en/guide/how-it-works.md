# How It Works

At session start, a hook injects the `praxis:using-praxis` skill. On every message, the agent:

1. **Classifies scope and topology** inline using the triage table — no extra skill call needed.
2. **Announces** the scope (and `topology=multi-module` if multi-repo) and loads required skills in parallel.
3. **Follows** the loaded skills literally, respecting `<gate>` markers.

## Triage Announcement

Every response opens with a scope classification line:

```
praxis: scope=<x>, loading=<skills>                         # single-module (default)
praxis: scope=<x>, topology=multi-module, loading=<skills>  # multi-module
```

| Scope | Signal | Skills loaded |
|---|---|---|
| vague | problem space undefined — can't say what to build | `design` |
| trivial | typo, rename, docs-only, ≤1 line, pure Q | none |
| small | one function, single file, ≤50 LOC | `tdd` |
| standard | feature or source-code change | `design`, `plan`, `tdd`, `review` |
| complex | new system, ≥5 tasks, parallel edits | `design`, `plan`, `worktree`, `subagents`, `review`, `ship` |
| debug | broken, regression, failing test | `debug` |
| onboard | existing project, no tech-spec | `onboard` |

## Core Lifecycle Gates

1. **Spec Review Gate (`design`)**: After drafting a spec, Praxis inspects trigger conditions and dispatches parallel reviewers (`spec-compliance`, `state-machine`, `cross-rule`, `cross-module`, `safety`, `implementability`). The coordinator synthesizes findings critically before plan handoff.
2. **3D Quality Gate (`tdd` / `review`)**: Implementation cycles are evaluated against mechanical checks, convention adherence, design cohesion/coupling, and documentation coverage.
3. **Model Tier Dispatch (`subagents`)**: Fan-out tasks designate a ROLE charter (`implementer`, `spec-reviewer`, `quality-reviewer`) and a capability tier (`fast`, `balanced`, `strongest`).
4. **Living Documentation Sync (`ship` / `archive`)**: Staging specs merge into living docs (`docs/tech-spec.md` or `docs/specs/*.md`), CHANGELOG is updated, and staging files are cleaned up.

## Example flows

### Tiny fix
```
You:   fix the typo "teh" in README
Agent: scope=trivial → edit → done
```

### Standard feature
```
You:   add OAuth login with GitHub
Agent: scope=standard → design (spec + spec review gate) → plan → tdd (quality check) → review → ship
```

### Multi-module change
```
You:   add a shared checkout flow across api and web repos
Agent: scope=complex, topology=multi-module → design (coordinator spec) → plan → subagents per repo → ship
```
