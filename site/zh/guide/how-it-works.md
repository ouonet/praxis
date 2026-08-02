# 工作原理

在会话开始时，钩子（Hook）注入 `praxis:using-praxis` 技能。在处理每条用户消息时，智能体会：

1. **诊断范围与拓扑**：直接根据诊断表进行分类 —— 无需额外的技能调用。
2. **宣告分类**：宣告范围（若涉及多仓库则附带 `topology=multi-module`），并并行加载所需技能。
3. **字面执行**：严格遵循已加载技能的规则，遵守 `<gate>` 关卡标记。

## 诊断宣告格式

智能体的每次响应都以一行范围宣告开头：

```
praxis: scope=<x>, loading=<skills>                         # 单模块 (默认)
praxis: scope=<x>, topology=multi-module, loading=<skills>  # 多模块
```

| 范围 (Scope) | 触发信号 | 加载的技能 |
|---|---|---|
| vague | 问题空间未定义 —— 无法确定构建什么 | `design` |
| trivial | 拼写错误、改名、仅修改文档、≤1 行、纯提问 | none |
| small | 单个函数、单文件、≤50 LOC | `tdd` |
| standard | 功能变更或源码修改 | `design`, `plan`, `tdd`, `review` |
| complex | 新系统、≥5 个任务或并行修改 | `design`, `plan`, `worktree`, `subagents`, `review`, `ship` |
| debug | 功能受损、回归问题、失败测试 | `debug` |
| onboard | 现有项目，无 tech-spec.md | `onboard` |

## 核心生命周期关卡

1. **规范评审关卡 (`design`)**：草拟规范后，Praxis 检查触发条件并并行派发匹配的评审员 Subagent（`spec-compliance`、`state-machine`、`cross-rule`、`cross-module`、`safety`、`implementability`）。Coordinator 在交接给计划前进行批判性合成。
2. **三维质量关卡 (`tdd` / `review`)**：实现循环从机械化检查、约定遵循、设计内聚与耦合、文档覆盖率四个维度进行评估。
3. **模型能力分级派发 (`subagents`)**：Fan-out 任务指定 ROLE 契约（`implementer`、`spec-reviewer`、`quality-reviewer`）和能力分级（`fast`、`balanced`、`strongest`）。
4. **现存文档同步 (`ship` / `archive`)**：暂存规范合并入现存文档（`docs/tech-spec.md` 或 `docs/specs/*.md`），更新 CHANGELOG 并清理暂存区文件。

## 典型流程示例

### 微小修复
```
你:    把 README 里的 "teh" 改成 "the"
智能体: scope=trivial → 修改 → 完成
```

### 标准功能
```
你:    添加 GitHub OAuth 登录
智能体: scope=standard → design (规范 + 规范评审关卡) → plan → tdd (质量校验) → review → ship
```

### 多模块变更
```
你:    在 api 和 web 仓库间添加共享结算流程
智能体: scope=complex, topology=multi-module → design (Coordinator 规范) → plan → 按仓库派发 subagents → ship
```
