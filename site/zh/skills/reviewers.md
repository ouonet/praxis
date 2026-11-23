# 规范评审员关卡 (Spec Reviewers)

规范评审员协议（`skills/references/reviewers.md`）规定了在 `design` 阶段写完暂存规范并提交给 `plan` 之前执行的并行评审关卡。

## 触发式匹配机制

运行所有符合当前规范特征的评审员。条件可累加；若仅基线规则 1 命中，则只派发 `spec-compliance`。

| # | 触发条件 | 派发的评审员 | 模型分级 | 审查职责 |
|---|---|---|---|---|
| 1 | **始终触发**（基线） | `spec-compliance` | `balanced` | 验证每个 `contract:`/`invariant:` 都有对应验收 `test:`，失效模式与作用域边界明确，数据形状具体。 |
| 2 | 定义 **≥3 个状态枚举或状态机** | `state-machine` | `strongest` | 枚举所有合法状态迁移；标记缺失边、死状态/不可达状态及未声明的初态/终态。 |
| 3 | 含 **≥2 条交叉引用同一行为的规则** | `consistency` | `strongest` | 检测相互矛盾、未定义优先级、不完整例外列表及正文与表格不一致之处。 |
| 4 | **`topology=multi-module` 或声明共享契约** | `boundary` | `balanced` | 验证共享契约单一归属、显式版本规则、序列化兼容性及跨模块假设。 |
| 5 | 涉及 **持久化写入、外部副作用或提交语义** | `safety` | `strongest` | 追踪每条写入路径；检查崩溃恢复缺口、并发覆盖写、部分提交及原子性边界。 |
| 6 | **`scope=complex` 或预计派发 Subagent 并行实现** | `implementability` | `balanced` | 以首次接手开发者视角审阅；标记未定义数据结构、模糊顺序、未指定错误处理及缺省语义。 |

模型分级解析顺序：项目 `.praxis/model-tiers.yaml` → 用户 `~/.praxis/model-tiers.yaml` → 宿主默认模型（读取 `tiers.<tier>.model`）。

## 并行执行与 Coordinator 批判性合成

1. **并行派发**：所有被触发的评审员作为独立子智能体（Subagent）并行运行，仅传入规范文件路径（`docs/staging/specs/YYYY-MM-DD-<topic>.md`），逐行输出 `BLOCK | GAP | CONFLICT`。
2. **Coordinator 合成**：仅执行一轮。主智能体批判性评估每条发现、裁决冲突、识别视角盲区、判定严重级别（`BLOCK` 或附带理由的 `DEFER`），一次性修补规范并向用户汇报。评审员提供建议，Coordinator 做出最终裁决。
