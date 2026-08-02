# 多模块架构协议 (Multi-Module Protocol)

多模块协议 (`skills/references/multi-module.md`) 用于协调跨越多个模块或仓库的变更。

## 概述

当一项功能影响多个仓库或工作区时，Praxis 会切换至 `multi-module` 拓扑。

```
praxis: scope=complex, topology=multi-module, loading=design,plan,worktree,subagents,review,ship
```

## 协议核心要素

1. **Coordinator 协调仓库**：用户显式指定一个现有的仓库作为 Coordinator，由其持有跨模块规范、工作区计划及变更清单（change-set）。
2. **磁盘模式标记**：规范与计划文件顶部包含显式声明块：
   ```yaml
   topology: multi-module
   change-set: <topic-id>
   coordinator: <repo path>
   repos: <repo paths>
   ```
   后续技能通过读取该声明重锚定模式，无需依赖会话上下文记忆。
3. **共享与局部规范**：共享契约仅定义在 Coordinator 规范中；各模块在其仓库中维护局部规范并引用共享契约，严禁重复定义。
4. **集成与提交顺序**：各模块独立构建并针对共享验收测试进行验证。提交按照依赖顺序执行，Coordinator 仓库最后提交，并在提交信息中共享 change-set ID。
