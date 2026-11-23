# onboard

`onboard` 技能用于在接手尚未建立技术规范的现有项目时，仅从代码与配置文件出发生成客观的现存文档（`docs/tech-spec.md` 与按需拆分的 `docs/specs/*.md`），不修改代码、不做计划、不写主观差距分析。

## 执行步骤

1. **事实探索**：直接从代码中核查入口点、公开接口、关键依赖、测试模式与目录结构，杜绝猜测。
2. **澄清歧义**：对代码无法确定意图的架构决策向用户提问，绝不凭空臆测。
3. **编写 `docs/tech-spec.md`**：仅用标准声明式字段（`purpose`、`user`、`use-case`、`architecture`、`stack`、`entry`、`contract`、`flow`、`invariant`、`constraint`、`convention`）记录当前事实，省略 `milestone`。超过 15 行的子系统细节拆入 `docs/specs/<topic>.md`，句子保持精炼（≤25 词/字词等价短句）。
4. **用户确认**：请用户核对文档是否准确反映系统现状。

## 完成关卡

`<gate>`
完成 `onboard` 前，`docs/tech-spec.md` 必须明确包含 `stack`、至少一项 `contract`，以及从代码读取的质量基线 `convention`（见[质量标准](./quality)）。
`</gate>`
