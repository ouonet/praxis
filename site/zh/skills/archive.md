# archive

`archive` 技能在交付（ship）阶段执行，用于将阶段性规范合并至现有系统文档，并归档项目记录。

## 主要职责

1. **现存文档同步**：将 `docs/staging/specs/YYYY-MM-DD-<topic>.md` 合并入 `docs/tech-spec.md`（或拆分至 `docs/specs/`）。
2. **暂存区清理**：验证并合并修改后，删除暂存规范与计划文件。
3. **决策记录归档**：将探索过程中产生的持久化知识产物或架构决策归档至 `docs/decisions/`。
4. **路线图与变更日志**：更新 `docs/ROADMAP.md` 里程碑状态（`[x]`），并在 `CHANGELOG.md` 中记录版本历史。

## 流程关卡

`<gate>`
归档前，暂存规范必须准确反映实际代码行为。现存文档更新必须严格符合标准字段格式（`purpose`、`user`、`use-case`、`architecture`、`stack`、`entry`、`contract`、`flow`、`invariant`、`constraint`、`convention`）。
`</gate>`
