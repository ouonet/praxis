# plan

`plan` 技能将已批准的规范拆解为 `docs/staging/plans/YYYY-MM-DD-<topic>.md` 中的可执行里程碑任务。只引用规范路径，不复述背景、架构或决策理由。

## 滚动波浪与多模块拓扑

- **滚动波浪（Rolling wave）**：当规范引用 `docs/ROADMAP.md` 中的 `milestone: MN` 时，仅展开当前里程碑，其余里程碑保留单行桩（stub）。`ship` 完成后确认下一个里程碑再继续展开；仅当目标发生实质变化时回到 `design`。
- **多模块拓扑**：若声明了 `topology=multi-module`，请先阅读[多模块协议](./multi-module)，并在协调者（Coordinator）工作区计划顶部写入模式声明块（`topology: multi-module`、`change-set`、`coordinator`、`repos`、各模块计划路径与集成任务）。每个任务唯一归属一个 `repository:` 与 `module:`，按「契约 → 消费方 → 模块本地验收 → 集成验收 → 依赖序提交」排列。

## 里程碑任务（每项 30–60 分钟）

每条任务必须写成复选框（`- [ ] T<n>: <名称>`），绝不使用标题，并附带声明式字段：

```text
goal:       <一句话目标>
files:      <涉及路径>
acceptance: <可执行测试、命令或显式手工核验步骤>
spec:       <docs/staging/specs/...#anchor>
```

仅当共享契约、状态与验收边界均已闭合且写入范围互不重叠时，才标记 `[parallel] T3, T4, T5`。原子化操作步骤推迟到 `subagents` 派发时再展开。

## 移交关卡

`<gate>`
移交给 `tdd` 或 `subagents` 之前，`docs/staging/plans/YYYY-MM-DD-<topic>.md`（多模块场景还须包含各受影响模块的计划文件）必须已在磁盘就绪并获得用户确认。
`</gate>`
