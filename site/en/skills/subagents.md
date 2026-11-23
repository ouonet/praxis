# subagents

The `subagents` skill dispatches independent `[parallel]` plan milestones to subagents with fresh context windows, explicit role charters, and optional capability-tiered model routing.

## Dispatch & Write Isolation

Expand milestone tasks into atomic steps only at dispatch time — pass spec/plan file paths rather than pasting inline content:

```text
TASK: <one sentence>
ROLE: <implementer | spec-reviewer | quality-reviewer>
MODEL: <fast | balanced | strongest>
REPOSITORY / MODULE / FILES / SPEC / ACCEPTANCE / EXTRA
```

One task owns one repository/module write scope; never dispatch concurrent writers to overlapping module roots. Coordinator dispatches integration tasks only after required modules report green local acceptance, and only the coordinator marks `- [x]`.

## Role Loop & Status Handling

Execution loop per task: `implementer` (`balanced` default) → `spec-reviewer` (`fast` default) → `quality-reviewer` (`strongest` default) → coordinator marks complete. Handle subagent statuses explicitly:

- `DONE_WITH_CONCERNS`: address correctness issues; note observations.
- `NEEDS_CONTEXT`: supply missing facts and re-dispatch.
- `BLOCKED`: diagnose root blocker rather than blind retry.

## Model Tiers

`MODEL` (`fast | balanced | strongest`) defaults to the harness model unless configured via `.praxis/model-tiers.yaml` (resolution order: project `.praxis/model-tiers.yaml` → user `~/.praxis/model-tiers.yaml` → harness default; template `model-tiers.example.yaml` under `tiers.<tier>.{provider, model}`).
