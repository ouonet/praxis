# スキル

スキルはエージェントセッションに構造化された規律を注入する短いmarkdownファイルです。各スキルはそのスコープが必要な時だけ読み込まれます。

| スキル | タイミング | トークン |
|---|---|---|
| [discover](./discover) | 問題空間が未定義 | ~200 |
| [design](./design) | スコープ ≥ standard、新規のもの | ~200 |
| [plan](./plan) | 設計承認後 | ~200 |
| [tdd](./tdd) | 実装または修正中 | ~400 |
| [debug](./debug) | 何かが壊れている | ~150 |
| [review](./review) | マージ前 / subagentタスク後 | ~150 |
| [worktree](./worktree) | 非trivialまたは並行作業 | ~150 |
| [subagents](./subagents) | 独立タスク、ファンアウト | ~150 |
| [ship](./ship) | マージ / PR / クリーンアップ | ~100 |
| [release](./release) | バージョン / タグ / 公開 | ~150 |
| [onboard](./onboard) | 既存プロジェクト、技術仕様なし | ~200 |
