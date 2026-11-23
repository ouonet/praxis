# release

`release` 技能仅在用户明确要求发版、更新版本号、打 tag 或发布包时执行，用于规范化语义版本与发布状态确认。

在 `topology=multi-module` 场景下，仅发布通过集成验收的精确协调者 revision set，并严格遵循各仓库依赖顺序。单次开发变更完成本身不构成自动发版授权。

## 发布步骤

1. 确认目标语义版本号变更（`MAJOR.MINOR.PATCH`）。
2. 确保测试全绿且 Git 工作区干净。
3. 从单一版本源同步更新所有受管版本清单。
4. 将 `CHANGELOG.md` 的 `Unreleased` 归档为 `<version> - <date>`，并重建空的 `Unreleased` 标题。

`<gate>`
第 5–7 步涉及共享或不可逆外部状态，**每一步执行前必须单独获得用户明确确认**——严禁一次确认连续执行：
`</gate>`

5. 提交发布修改（Commit）。
6. 创建带附注的 Git 标签（`v<version>`）。
7. 推送提交/标签（Push）或执行包发布（Publish）。
