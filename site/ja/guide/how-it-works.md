# 仕組み

セッション開始時、フック（Hook）が `praxis:using-praxis` スキルを注入します。ユーザーメッセージごとに、エージェントは：

1. **スコープとトポロジーの分類**: 診断表を使ってインラインで分類します（追加のスキル呼び出しは不要）。
2. **宣言**: スコープ（複数リポジトリの場合は `topology=multi-module` も含む）を宣言し、必要なスキルを並列でロードします。
3. **実行**: ロードされたスキルの指示に厳密に従い、`<gate>` マーカーを尊重します。

## 診断宣言フォーマット

毎回の応答はスコープ分類行で始まります：

```
praxis: scope=<x>, loading=<skills>                         # 単一モジュール (デフォルト)
praxis: scope=<x>, topology=multi-module, loading=<skills>  # マルチモジュール
```

| スコープ (Scope) | 信号 | ロードされるスキル |
|---|---|---|
| vague | 問題空間が未定義 — 何を作るか未定 | `design` |
| trivial | 誤字修正、改名、ドキュメントのみ、≤1 行、質問 | none |
| small | 単一関数、単一ファイル、≤50 LOC | `tdd` |
| standard | 機能追加またはソースコード変更 | `design`, `plan`, `tdd`, `review` |
| complex | 新システム、≥5 タスク、並行編集 | `design`, `plan`, `worktree`, `subagents`, `review`, `ship` |
| debug | バグ、デグレ、失敗テスト | `debug` |
| onboard | 既存プロジェクト、tech-spec.md なし | `onboard` |

## ライフサイクルの主要ゲート

1. **仕様レビュアーゲート (`design`)**: 仕様ドラフト後、トリガー条件に基づいて並列レビュアー（`spec-compliance`, `state-machine`, `cross-rule`, `cross-module`, `safety`, `implementability`）を起動。Coordinator が計画引き渡し前に批判的統合を実施。
2. **3次元品質ゲート (`tdd` / `review`)**: 実装サイクルをメカニカルチェック、規約遵守、設計の結合度/凝集度、ドキュメントカバレッジの4観点から検証。
3. **モデル階層別起動 (`subagents`)**: ファンアウトタスクに ROLE 契約（`implementer`, `spec-reviewer`, `quality-reviewer`）と能力階層（`fast`, `balanced`, `strongest`）を指定。
4. **リビングドキュメント同期 (`ship` / `archive`)**: ステージング仕様をリビングドキュメント（`docs/tech-spec.md` または `docs/specs/*.md`）に統合し、CHANGELOG を更新してクリーンアップ。

## フローの例

### 軽微な修正
```
You:   fix the typo "teh" in README
Agent: scope=trivial → 編集 → 完了
```

### 標準機能
```
You:   add OAuth login with GitHub
Agent: scope=standard → design (仕様 + 仕様レビュアーゲート) → plan → tdd (品質検証) → review → ship
```

### マルチモジュール変更
```
You:   add a shared checkout flow across api and web repos
Agent: scope=complex, topology=multi-module → design (Coordinator 仕様) → plan → リポジトリごとの subagents → ship
```
