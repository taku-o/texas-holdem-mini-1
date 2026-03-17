## 作業結果
- `src/domain/testHelpers.ts` を作成し、4つの共通テストヘルパー関数（`card`, `createSimpleDeck`, `createTestPlayer`, `createTestState`）を集約
- 5つの既存テストファイルから重複ヘルパー定義を削除し、共通モジュールからのインポートに置き換え
  - `handEvaluator.test.ts`: `card` のみインポート（ローカル定義を削除）
  - `betting.test.ts`: `card`, `createTestPlayer` をインポート、`createTestState` はローカルラッパー（pot/currentBet/currentPlayerIndex の差分）
  - `handProgression.test.ts`: `card`, `createTestPlayer` をインポート、`createTestState` はローカルラッパー
  - `dealing.test.ts`: `card` をインポート、`createTestPlayer`（holeCards=[]）と `createTestState` はローカルラッパー
  - `showdown.test.ts`: `card` をインポート、`createTestPlayer`（holeCards差分）と `createTestState`（phase/communityCards/pot差分）はローカルラッパー

## 変更内容
- 作成: `src/domain/testHelpers.ts`
- 変更: `src/domain/handEvaluator.test.ts`, `src/domain/betting.test.ts`, `src/domain/handProgression.test.ts`, `src/domain/dealing.test.ts`, `src/domain/showdown.test.ts`

## ビルド結果
- `npx tsc -b` → 成功（エラーなし）

## テスト結果
- `npm test` → 全12ファイル、188テスト全てパス