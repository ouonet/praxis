# マルチモジュールプロトコル (Multi-Module Protocol)

マルチモジュールプロトコル (`skills/references/multi-module.md`) は、複数のモジュールやリポジトリにまたがる変更を調整します。

## 概要

機能変更が複数のリポジトリやワークスペースに影響を与える場合、Praxis は `multi-module` トポロジーに切り替わります。

```
praxis: scope=complex, topology=multi-module, loading=design,plan,worktree,subagents,review,ship
```

## プロトコルの基本要素

1. **Coordinator リポジトリ**: ユーザーが既存のリポジトリの1つを Coordinator として明示的に指定します。Coordinator がモジュール横断仕様、ワークスペース計画、変更マニフェスト（change-set）を所有します。
2. **ディスク上のモードマーカー**: 仕様書と計画ファイルの先頭に明示的な宣言ブロックを含めます：
   ```yaml
   topology: multi-module
   change-set: <topic-id>
   coordinator: <repo path>
   repos: <repo paths>
   ```
   後続のスキルはこの宣言を読み取ることで、セッションメモリに依存せずモードを認識します。
3. **共有仕様とローカル仕様**: 共有契約は Coordinator 仕様書にのみ記述します。各リポジトリはローカル仕様書を保持し、重複なしで共有契約を参照します。
4. **統合とコミット順序**: 各モジュールは独立してビルド・テストを行い、共有受入テストで検証します。コミットは依存関係の順序に従い、Coordinator リポジトリが最後にコミットし、コミットメッセージで change-set ID を共有します。
