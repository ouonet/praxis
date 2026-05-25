# Discover（探索）

用于目标模糊或愿景级、无法充分定义的情况。

**Gate：** 在用户确认前，无设计、无代码、无规范。

目标是把模糊目标转化为足以进入 `design` 的问题陈述。逐轮提问。

## 探索笔记：`docs/discovery/YYYY-MM-DD-<topic>.md`

```markdown
## 目标
<最初的模糊目标>

## 假设
- [ ] <假设 A>
- [x] <假设 B> → 已验证：<证据>
- [~] <假设 C> → 已否定：<原因>

## 调查计划
条件式步骤 —— 随着发现更新。不是构建计划。
- [x] Phase 1: <做什么> → <之后决定什么>
- [ ] Phase 2: <做什么> (范围由 Phase 1 决定)

## 实验
### YYYY-MM-DD — <实验名>
what: <做了什么>
saw:  <观察到什么>
conclusion: <意味着什么>

## 确认的方向
<以下选其一>
- 问题陈述：谁 / 什么问题 / 什么上下文 / 成功信号
- 知识规范：确认的数据结构、协议或系统行为

## 否定的想法
- <想法> — <为什么排除>
```

探索笔记跨 session 积累。开始前检查现有笔记。

## Spike 代码：`spikes/YYYY-MM-DD-<topic>/`

Spike 代码验证假设，不是功能。

- 每个 spike 有一个 `README.md`，说明它在测试什么假设。
- 不需要测试。
- 不耦合主代码路径。
- 探索结束时删除（学到的东西在笔记里）。
- 如果 spike 代码值得保留，必须经过 `design → plan → tdd` —— 无法直接升级。

## Gate

`docs/discovery/YYYY-MM-DD-<topic>.md` 必须存在且"确认的方向"已填。

然后与用户选择出口：

- **→ design**：方向是要解决的问题 —— 移交给 `design`，引用探索笔记。
- **→ archive**：方向是知识产物（逆向工程发现、协议规范、数据结构图）—— 保存为 `docs/discovery/<topic>-spec.md`，无需设计。

## Abandon（放弃）

如果用户决定不继续：

1. 追加到探索笔记：
   ```
   ## Abandoned — YYYY-MM-DD
   reason: <为什么>
   validated: <确认了什么>
   invalidated: <什么被排除>
   ```
2. 删除 `spikes/<topic>/` —— 学到的在笔记里。
3. 无需 staging spec、plan、ship。
4. 探索笔记永久保留在 `docs/discovery/` 作为记录。
