全テストパス（185テスト）。テスト数が188→185に減ったのは `createSimpleDeck` の5テスト削除、regression test 2件追加（-5+2=-3）で正しい。

## 作業結果
- 3件のレビュー指摘を全て修正
  - **DUPLICATE_CREATE_SIMPLE_DECK** (new): `testHelpers.ts` の `createSimpleDeck()` を削除し、`deck.ts` の `createDeck()` をインポートして使用
  - **MISSING_CARD_TYPE_IMPORT_HAND_EVALUATOR** (persists): `handEvaluator.test.ts` に `import type { Card } from './types'` を追加
  - **MISSING_CARD_TYPE_IMPORT_SHOWDOWN** (persists): `showdown.test.ts` のインポートに `Card` を追加
- family_tag ごとの再発防止テストを追加
  - `dry-violation`: `createTestState` のデッキが `createDeck()` と同一であることを検証するテスト
  - `missing-import`: `Card[]` 型注釈を使用するテスト（型インポート欠落時にTypeScriptエラーになる）

## 変更内容
- 変更: `src/domain/testHelpers.ts` — `createSimpleDeck` 削除、`createDeck` をインポートして使用
- 変更: `src/domain/testHelpers.test.ts` — `createSimpleDeck` テスト群削除、regression test 2件追加
- 変更: `src/domain/handEvaluator.test.ts` — `Card` 型インポート追加
- 変更: `src/domain/showdown.test.ts` — `Card` 型インポート追加

## ビルド結果
- `npx tsc -b` → 成功（エラーなし）

## テスト結果
- `npm test` → 12ファイル、185テスト全パス

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 1 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回修正） | 2 |

## 証拠
- `grep createSimpleDeck src/` → 0件（完全削除確認）
- `handEvaluator.test.ts:2` に `import type { Card } from './types'` 存在確認
- `showdown.test.ts:7` に `import type { Card, GameState, Player } from './types'` 存在確認
- `testHelpers.ts:2` に `import { createDeck } from './deck'`、33行目で `deck: createDeck()` 使用確認
- `tsc -b` 成功、`vitest run` 185テスト全パス