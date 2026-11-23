# subagents

`subagents` 技能将计划中标记为 `[parallel]` 的独立里程碑派发给具备独立上下文窗口的 Subagent，通过明确的角色契约与可选能力分级路由实现并行执行与交叉评审。

## 派发与写作用域隔离

仅在派发时刻将里程碑展开为原子步骤；向 Subagent 传递规范与计划文件路径，严禁大段粘贴正文内容：

```text
TASK: <一句话任务>
ROLE: <implementer | spec-reviewer | quality-reviewer>
MODEL: <fast | balanced | strongest>
REPOSITORY / MODULE / FILES / SPEC / ACCEPTANCE / EXTRA
```

每条任务拥有单一仓库与模块写入边界，禁止向重叠模块根目录同时派发多个写者。仅当依赖模块均报告本地验收通过后才派发集成任务，且仅由协调者勾选 `- [x]`。

## 任务闭环与状态处理

单任务执行闭环：`implementer`（默认 `balanced`） → `spec-reviewer`（默认 `fast`） → `quality-reviewer`（默认 `strongest`） → 协调者勾选完成。协调者按状态协议处理返回：

- `DONE_WITH_CONCERNS`：涉及正确性则立刻处理，属观察性提醒则记录。
- `NEEDS_CONTEXT`：补充缺失事实后重新派发。
- `BLOCKED`：诊断阻塞根因（缺失上下文 / 能力分级不足 / 任务过大 / 计划有误），严禁盲目重试。

## 模型分级

`MODEL`（`fast | balanced | strongest`）缺省使用宿主默认模型；也可通过 `.praxis/model-tiers.yaml` 映射具体模型（解析顺序：项目 `.praxis/model-tiers.yaml` → 用户 `~/.praxis/model-tiers.yaml` → 宿主默认模型；模板见仓库根目录 `model-tiers.example.yaml` 的 `tiers.<tier>.{provider, model}` 结构）。
