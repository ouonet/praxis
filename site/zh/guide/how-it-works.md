# 工作原理

Session 开始时，一个 hook 注入 `praxis:using-praxis` 技能。在每次消息时，智能体：

1. **分类范围** —— 使用分类表内联分类，无需额外技能调用。
2. **声明** 范围并并行加载所需技能。
3. **遵循** 已加载的技能，尊重 `<gate>` 标记。

## 分类表

| 范围 | 信号 | 加载技能 |
|---|---|---|
| vague | 问题空间未定义 | `discover` |
| trivial | 拼写错误、改名、仅文档、≤1 行 | 无 |
| small | 单个函数、单文件、≤50 LOC | `tdd` |
| standard | 功能或源代码更改 | `design`, `plan`, `tdd`, `review` |
| complex | 新系统、≥5 个任务、并行编辑 | `design`, `plan`, `worktree`, `subagents`, `review`, `ship` |
| debug | 破坏、回归、测试失败 | `debug` |
| onboard | 现有项目，无技术规范 | `onboard` |

## 示例流程

### 微小修复
```
你：   fix the typo "teh" in README
智能体：scope=trivial → edit → done
```

### 标准功能
```
你：   add OAuth login with GitHub
智能体：scope=standard → design → plan → tdd → review → ship
```

### 模糊目标
```
你：   I want to build something that helps developers manage their workflow
智能体：scope=vague → discover (假设、实验、spike 代码)
                  → 确认方向 → design → ...
```

### 大型项目（滚动波浪）
```
你：   build a new auth system from scratch
智能体：scope=complex → design (规范 + roadmap M1/M2/M3)
                     → plan M1 → tdd → ship M1
                     → plan M2 → tdd → ship M2 → ...
```
