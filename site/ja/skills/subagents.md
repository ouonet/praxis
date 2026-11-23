# subagents

`subagents` スキルは、計画内の `[parallel]` タスクを独立コンテキストを持つサブエージェントへ派遣し、明確な役割契約（ROLE）と能力階層別モデル選択（MODEL）で並列実行と二段階レビューを行います。

## 派遣と書き込み隔離

タスクの原子的展開は派遣時のみに行い、仕様や計画本文を貼り付けずファイルパスのみを渡します：

```text
TASK: <1行タスク>
ROLE: <implementer | spec-reviewer | quality-reviewer>
MODEL: <fast | balanced | strongest>
REPOSITORY / MODULE / FILES / SPEC / ACCEPTANCE / EXTRA
```

1タスクにつき1リポジトリ／1モジュールの書き込み範囲のみ許可され、重複するモジュールルートへ同時に書き込みエージェントを派遣しません。必要モジュールのローカル受入がすべて通過してから統合タスクを派遣し、`- [x]` の更新は Coordinator のみが行います。

## ロール循環とステータス対応

タスクごとの実行サイクル：`implementer`（デフォルト `balanced`） → `spec-reviewer`（デフォルト `fast`） → `quality-reviewer`（デフォルト `strongest`） → Coordinator が完了記録。返却ステータスを明示的に処理します：

- `DONE_WITH_CONCERNS`: 正確性に関する懸念は修正し、参考所見は記録。
- `NEEDS_CONTEXT`: 不足事実を補って再派遣。
- `BLOCKED`: 根本要因を診断（文脈不足 / モデル能力不足 / 粒度過大 / 計画誤り）。無策で再試行しない。

## モデル階層

`MODEL`（`fast | balanced | strongest`）は未指定時にハーネスのデフォルトを使用します。`.praxis/model-tiers.yaml` で変更可能（解決順序: プロジェクト `.praxis/model-tiers.yaml` → ユーザー `~/.praxis/model-tiers.yaml` → ハーネスデフォルト。テンプレートは `model-tiers.example.yaml` の `tiers.<tier>.{provider, model}`）。
