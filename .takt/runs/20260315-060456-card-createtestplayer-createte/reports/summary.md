# タスク完了サマリー

## タスク
テストファイル間で重複定義されていた `card`, `createTestPlayer`, `createTestState`, `createSimpleDeck` を共通テストヘルパーファイルに集約し、DRY違反を解消する。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 作成 | `src/domain/testHelpers.ts` | 共通テストヘルパー関数（`card`, `createTestPlayer`, `createTestState`）を集約。デッキ生成は `deck.ts` の `createDeck()` を使用 |
| 作成 | `src/domain/testHelpers.test.ts` | テストヘルパー関数のユニットテスト（再発防止テスト含む） |
| 変更 | `src/domain/handEvaluator.test.ts` | ローカル `card` 定義を削除し `testHelpers` からインポート。`Card` 型インポート追加 |
| 変更 | `src/domain/betting.test.ts` | ローカル `card`, `createTestPlayer` 定義を削除し `testHelpers` からインポート |
| 変更 | `src/domain/dealing.test.ts` | ローカル `card` 定義を削除し `testHelpers` からインポート。ローカルラッパーは共通関数へ委譲 |
| 変更 | `src/domain/handProgression.test.ts` | ローカル `card`, `createTestPlayer` 定義を削除し `testHelpers` からインポート |
| 変更 | `src/domain/showdown.test.ts` | ローカル `card` 定義を削除し `testHelpers` からインポート。`Card` 型インポート追加 |

## 確認コマンド
```bash
npx vitest run
npx tsc -b
```