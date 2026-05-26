# Ship（出荷）

すべての計画タスクが完了しグリーンになったら。

## Gate — いずれか一つが失敗したら止まる：

- テストが通過している。
- `docs/staging/plans/YYYY-MM-DD-<topic>.md` に `- [ ]` がない。
- Staging仕様が実際のコードの動作を反映している。
- 未完了のTodoWriteタスクがない。

## 手順

1. 全体のdiffを `review` する。
2. `archive` — 仕様をliving docにマージし、staging仕様と計画を削除する。
3. ユーザーに見える場合、CHANGELOGの `Unreleased` に追加する。
4. 確認：**merge / PR / keep / discard.**
5. mergeまたはPR時：worktreeをクリーンアップし、ローカルブランチを削除する。
6. ロードマップに未チェックのマイルストーンがある？ → 次を `plan` する。

ユーザーの明示的な承認なしにpushまたはPRしない。
