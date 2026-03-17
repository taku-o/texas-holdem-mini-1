# 決定ログ

## 1. debug_game3.ts での executeBettingRound 不使用
- **背景**: debug_game3.ts はステップごとに詳細ログを出力しており、executeBettingRound を使うとログが出なくなる
- **検討した選択肢**: (A) onAction コールバックを追加して executeBettingRound を使用 (B) executeBettingRound を使わず、cpuFoldHumanCallSelector のみ共有
- **理由**: 計画でも「シンプルさを優先するなら手動ループを残してもよい」と記載。onAction コールバック追加は executeBettingRound の設計を複雑化させ、テストケースとの不整合も生じるため、cpuFoldHumanCallSelector のみ共有する方針とした

## 2. debug_game.ts の checkOnlySelector をローカル定義
- **背景**: debug_game.ts のフェーズ進行ループでは `{ type: 'check' }` を常に返すセレクターが必要
- **検討した選択肢**: (A) debug_common.ts にエクスポート (B) debug_game.ts 内にローカル定義
- **理由**: checkOnlySelector は debug_game.ts でのみ使用されるため、debug_common.ts に追加するとテストの追加も必要になり過剰。ローカル定義で十分