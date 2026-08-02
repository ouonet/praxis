# 技能

技能是注入结构化规范的短 markdown 文件。每个技能仅在需要其范围时加载。

| 技能 | 何时用 | Token |
|---|---|---|
| [design](./design) | 范围 ≥ standard，任何新工作；处理模糊目标与触发式评审关卡 | ~1,180 |
| [plan](./plan) | 设计获批后；拆分里程碑与原子任务 | ~740 |
| [tdd](./tdd) | 实现或修复；三维质量与重构关卡 | ~590 |
| [debug](./debug) | 出问题了；根因隔离 | ~160 |
| [review](./review) | 合并前 / subagent 任务后；代码与文档覆盖率审查 | ~420 |
| [worktree](./worktree) | 非平凡或并行工作；Git worktree 隔离 | ~320 |
| [subagents](./subagents) | 独立任务、fan-out；角色契约与模型能力分级 | ~1,020 |
| [ship](./ship) | 合并 / PR / 清理 | ~430 |
| [archive](./archive) | 合并规范至现存文档并清理暂存区 | ~730 |
| [release](./release) | 版本 / tag / 发布 | ~220 |
| [onboard](./onboard) | 现有项目，无技术规范 | ~450 |

## 共享协议与参考规范

- [质量标准](./quality)（约 ~430 token）：机械化检查、约定遵循、设计评估及文档覆盖率标准。
- [规范评审员](./reviewers)（约 ~1,640 token）：并行规范评审员的触发匹配表与审查职责。
- [多模块协议](./multi-module)（约 ~870 token）：跨仓库与多模块变更的拓扑规范。

