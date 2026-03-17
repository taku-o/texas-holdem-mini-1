指示通り、`+ state.pot` を含まない3箇所の `reduce` パターンは置換せず残しています。

決定ログは特に記録すべき設計判断がないため、作成しません。

## 作業結果
- `debug_common.test.ts` の2箇所のインライン `state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot` パターンを `calcTotalChips()` ヘルパー呼び出しに置き換えた
- `calcTotalChips` の import を `./src/domain/testHelpers` から追加した
- 置換対象外の3箇所（125行目・135行目・141行目）の `reduce` パターンは `+ state.pot` を含まないため変更なし
- 全19テストがパス

## 変更内容
- `debug_common.test.ts` — import追加 + 2箇所のインラインコード置換