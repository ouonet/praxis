# Plan（计划）

`docs/staging/plans/YYYY-MM-DD-<topic>.md`。引用规范；不要复述。

如果未解决的规范笔记影响实现或任务顺序，回到 `design`。

## 里程碑任务（30-60 分钟每个）

每个任务是 `- [ ] T<n>: <名>` —— 总是复选框，不是标题。`tdd`/`subagents` 完成时改为 `- [x]`；`ship` 拒绝运行直到所有 `- [ ]` 完成。

```
goal:       <一句话>
files:      <路径>
acceptance: <测试或命令>
spec:       <docs/staging/specs/...#anchor>
```

无精确代码。无步骤。Acceptance 可执行：测试名、命令或脚本检查。每个任务留下仓库是绿色的。

标记独立任务：`[parallel] T3, T4, T5`。

仅当共享契约、状态、错误和 acceptance 闭合时标记 `[parallel]`。

**原子展开在分派时推迟** - `subagents` 在分派时将里程碑展开为 2-5 分钟步骤，不在这里。

**新项目**：派生初始化任务 —— 搭脚手架代码、测试、CI，总是包括：`README.md`、`CHANGELOG.md`、`.gitignore` 和 `Makefile`（或等价的任务运行器配置）。

## 不要放在计划里

背景、架构、理由（规范）、CI 命令、复制粘贴的 acceptance。

## 滚动波浪

规范有 `## Roadmap`？仅展开标记为 `← 现在详细计划` 的里程碑。留下其他的为 stub。

`ship` 后：把 `← 现在详细计划` 标记移到下一个里程碑（改它的 `← stub` 为 `← 现在详细计划`），根据你学到的更新它，然后展开它。仅当里程碑目标实质改变时回到 `design`。

## Gate

`docs/staging/plans/YYYY-MM-DD-<topic>.md` 必须存在于磁盘前移交给 `tdd`/`subagents`。

与用户确认计划。

多数 `[parallel]` → `subagents`。否则 → `tdd`。
