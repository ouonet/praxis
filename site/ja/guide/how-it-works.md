# 仕組み

セッション開始時、フックが `praxis:using-praxis` スキルを注入する。メッセージのたびに、エージェントは：

1. **スコープを分類** — トリアージテーブルを使ってインラインで分類。追加のスキル呼び出しは不要。
2. **宣言** — スコープを提示し、必要なスキルを並行して読み込む。
3. **遵守** — 読み込まれたスキルをそのまま従い、`<gate>` マーカーを尊重する。

## トリアージ

| スコープ | シグナル | 読み込むスキル |
|---|---|---|
| vague | 問題空間が未定義 | `design` |
| trivial | タイポ、リネーム、ドキュメントのみ、≤1行 | なし |
| small | 一つの関数、単一ファイル、≤50 LOC | `tdd` |
| standard | 機能またはソースコードの変更 | `design`, `plan`, `tdd`, `review` |
| complex | 新システム、≥5タスク、並行編集 | `design`, `plan`, `worktree`, `subagents`, `review`, `ship` |
| debug | 壊れている、リグレッション、テスト失敗 | `debug` |
| onboard | 既存プロジェクト、技術仕様なし | `onboard` |

## フロー例

### 小さな修正
```
あなた：   fix the typo "teh" in README
エージェント：scope=trivial → edit → done
```

### 標準機能
```
あなた：   add OAuth login with GitHub
エージェント：scope=standard → design → plan → tdd → review → ship
```

### 曖昧なゴール
```
あなた：   I want to build something that helps developers manage their workflow
エージェント：scope=vague → design（まず一問ずつ明確化）
                        → 方向が確定 → 仕様 → plan → ...
```

### 大規模プロジェクト（ローリングウェーブ）
```
あなた：   build a new auth system from scratch
エージェント：scope=complex → design (仕様 + ロードマップ M1/M2/M3)
                           → plan M1 → tdd → ship M1
                           → plan M2 → tdd → ship M2 → ...
```
