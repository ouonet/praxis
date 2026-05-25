# Ship（交付）

所有计划任务完成且绿灯时。

## Gate —— 任何一个失败就停：

- 测试通过。
- `docs/staging/plans/YYYY-MM-DD-<topic>.md` 中无 `- [ ]`。
- Staging 规范反映实际代码行为。
- 无未完成的 TodoWrite 任务。

## 流程

1. `review` 整个 diff。
2. `archive` —— 规范合并进 living doc，删除 staging 规范和计划。
3. 如果用户可见，加到 CHANGELOG `Unreleased`。
4. 问：**merge / PR / keep / discard.**
5. 在 merge 或 PR 上：清理 worktree，删除本地分支。
6. Roadmap 有未勾选里程碑？→ `plan` 下一个。

无用户明确批准不 push 或 PR。
