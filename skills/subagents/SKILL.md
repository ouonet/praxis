---
name: subagents
description: Use when a plan has parallel tasks and the harness supports dispatching subagents.
---
# Subagents

If `topology=multi-module` (triage announcement or coordinator spec/plan declaration), read `../references/multi-module.md`.

Fresh context per task. No session history.

## Dispatch: reference, don't copy
Subagents have file-read tools. Don't inline what they can read.

```
TASK: <one sentence>
ROLE: <implementer | spec-reviewer | quality-reviewer>
MODEL: <fast | balanced | strongest>
REPOSITORY: <registered repo id and path>
MODULE: <module id and root>
FILES: <paths>
SPEC: <docs/staging/specs/...#anchor>
ACCEPTANCE: <test or cmd>
EXTRA: <only what's NOT in referenced files>
```

`ROLE` is required. See role charters below for what each role owns and does not own.

`MODEL` is optional. Omitted → uses harness default. Resolution: `.praxis/model-tiers.yaml` in project root or user home maps the three tiers (`fast`, `balanced`, `strongest`) to concrete model IDs. No config file → all subagents use harness default.

Pasting >10 lines from the spec? Stop - let the subagent read it.

Expand milestone → atomic steps **at dispatch time**, not in the plan.

One task has one repository and module write scope. Agents may read shared coordinator contracts, but must not edit another module or repository. Never dispatch two writers to overlapping module roots. Integration tasks are dispatched only after every required module reports local acceptance.

## Loop per task
implementer → on DONE: spec-reviewer (matches spec?) → quality-reviewer (`review`) → mark complete, continue.
The coordinator marks `- [x]`, never the subagent.

## Status
- `DONE_WITH_CONCERNS` - address if correctness; note if observation.
- `NEEDS_CONTEXT` - supply the fact, re-dispatch.
- `BLOCKED` - diagnose (missing context / stronger model / too big / plan wrong). Never silently retry.

## Model tier

`MODEL: fast | balanced | strongest`（可选，省略则用 harness 默认）

通过项目根目录或用户目录的 `.praxis/model-tiers.yaml` 解析为具体模型 ID。模板见 Praxis 仓库根目录的 `model-tiers.example.yaml`。

| Tier | 适用角色 | 特征 |
|------|---------|------|
| `fast` | 机械性任务（单文件格式化、简单 spec-review） | 低延迟，低成本 |
| `balanced` | 标准实现（implementer、多文件集成） | 默认档位，性价比最优 |
| `strongest` | 设计探索、quality-reviewer、状态机审查 | 深度推理，长上下文 |

## Role charters

### implementer
- **Owns**: writing the minimum code to make the acceptance test pass (GREEN phase).
- **Does NOT own**: refactoring, adding abstractions, touching files outside FILES, marking the task complete.
- **Model tier**: `balanced` (standard implementation).
- **On DONE**: hands off to spec-reviewer.

### spec-reviewer
- **Owns**: verifying implementation matches every contract and acceptance criterion in SPEC. Reports drift with file:line references.
- **Does NOT own**: suggesting improvements beyond the spec, checking code quality, re-running tests.
- **Model tier**: `fast` (pattern-matching contracts against code).
- **On DONE_WITH_CONCERNS**: coordinator decides whether to address or note.

### quality-reviewer
- **Owns**: running `review` skill against the diff — convention compliance, simplification opportunities, idiomatic patterns, security, scope.
- **Does NOT own**: re-verifying spec compliance (already done), re-running acceptance tests (already done).
- **Model tier**: `strongest` (deep code review requires full reasoning).
- **On DONE**: task is complete. Coordinator marks `- [x]`.

All done → `review` whole diff → `ship`.
