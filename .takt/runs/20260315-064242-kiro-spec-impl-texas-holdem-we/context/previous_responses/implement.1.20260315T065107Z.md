## 作業結果
- タスク5.1（CPU行動決定ロジック）を実装し、既存の24テスト全てがパスすることを確認
- プリフロップではホールカードのランク・ペア・スーテッドでハンド強度を分類
- ポストフロップでは `handEvaluator.evaluate` を使って役カテゴリでハンド強度を分類
- ハンド強度（strong/medium/weak）と randomFn の値に基づいてアクションを決定

## 変更内容
- **作成**: `src/domain/cpuStrategy.ts` — `decideAction(state, playerIndex, randomFn)` を実装
  - `evaluatePreflopStrength`: ホールカード2枚からプリフロップの強度を判定
  - `evaluatePostflopStrength`: ホールカード+コミュニティカードから役を評価して強度を判定
  - `calculateBetAmount`: BIG_BLIND の倍数でベット額を計算（チップ上限を遵守）
  - `decideAction`: 強度とランダム値に基づいてアクションを選択（fold/check/call は amount なし、bet/raise は amount 付き）

## ビルド結果
- `npx tsc -b --noEmit` — 型エラーなし（正常完了）

## テスト結果
- `npx vitest run src/domain/cpuStrategy.test.ts` — 24 tests passed
- `npx vitest run` — 全213 tests passed（13ファイル、既存テストへの影響なし）