# onboard

`onboard` スキルは、技術仕様書のない既存リポジトリを引き継ぐ際、コード変更や計画策定、主観的なギャップ分析を行わずに、事実に基づくリビングドキュメント（`docs/tech-spec.md` および必要に応じた `docs/specs/*.md`）を作成します。

## 手順

1. **調査**：コードや設定からエントリーポイント、公開インターフェース、依存関係、テストパターン、ファイル構成を直接読み取る（推測しない）。
2. **確認**：コードから意図が読み取れない構成についてはユーザーに質問する。
3. **`docs/tech-spec.md` の作成**：標準の宣言フィールド（`purpose`、`user`、`use-case`、`architecture`、`stack`、`entry`、`contract`、`flow`、`invariant`、`constraint`、`convention`）のみを用い、非時系列の現在事実を記録する（`milestone` は省略）。15行を超えるサブシステム詳細は `docs/specs/<topic>.md` に切り出し、簡潔に記述する。
4. **最終確認**：作成したドキュメントが実態と一致することをユーザーと確認する。

## 完了ゲート

`<gate>`
`onboard` 完了前に、`docs/tech-spec.md` に `stack`、1件以上の `contract`、およびコードから確認した品質ベースライン `convention`（[品質標準](./quality)）が含まれている必要があります。
`</gate>`
