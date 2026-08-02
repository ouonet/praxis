# design

`design` 技能在编码或计划开始前生成可执行的技术规范。它处理新功能、架构变更、模糊目标及多模块协同工作。

## 核心特性

1. **依序澄清**：首先从代码库和工具中查找已知事实，仅按依赖顺序向用户询问当前决策边界上的问题。
2. **声明式规范**：使用声明式契约记录决策（`contract:`、`invariant:`、`test:`、`convention:`、`deferred:`）。
3. **规范评审关卡 (Spec Review Gate)**：在交接给 `plan` 前，根据 [评审员匹配表](./reviewers) 检查规范，并行派发匹配的评审员 Subagent。Coordinator 进行批判性合成并统一修补规范。
4. **多模块拓扑**：对于跨多个仓库的变更，指定 Coordinator 仓库，写入磁盘模式标记（`topology: multi-module`），并维护共享规范与模块局部规范。
5. **放弃路径 (Abandon)**：若探索结论是不进行构建，可干净利落地终止流程，并将学习心得归档至 `docs/decisions/`。
