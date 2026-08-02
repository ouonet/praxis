# archive

`archive` スキルは、ship（シップ）時にアクティブなステージング仕様書をリビングドキュメントに統合し、プロジェクト記録を整理・保管するために実行されます。

## 主な役割

1. **リビングドキュメントの同期**: `docs/staging/specs/YYYY-MM-DD-<topic>.md` を `docs/tech-spec.md`（または `docs/specs/` 配下のサブ仕様書）に統合します。
2. **ステージングのクリーンアップ**: 変更が検証されマージされた後、ステージング仕様書と計画ファイルを削除します。
3. **意思決定記録の保存**: 調査過程で生成された知識アーティファクトやアーキテクチャの意思決定を `docs/decisions/` に保存します。
4. **ロードマップと変更履歴**: `docs/ROADMAP.md` のマイルストーン状態（`[x]`）を更新し、`CHANGELOG.md` にバージョン履歴を記録します。

## ワークフローゲート

`<gate>`
アーカイブを行う前に、ステージング仕様書が実際のコードの挙動を正確に反映している必要があります。リビングドキュメントの更新は、標準フィールド形式（`purpose`, `user`, `use-case`, `architecture`, `stack`, `entry`, `contract`, `flow`, `invariant`, `constraint`, `convention`）に従う必要があります。
`</gate>`
