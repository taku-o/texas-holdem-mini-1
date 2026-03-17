## 作業結果
- 計画に従い、`handlePlayerAction` と `advanceUntilHumanTurn` を async 化し、CPUターン処理中に `setTimeout(0)` でメインスレッドに yield する仕組みを実装した
- `onProgress` コールバックを追加し、CPUアクション適用後に中間状態を通知できるようにした
- `useGameController` を async 対応に更新（`useRef` による最新 state 追跡、`processingRef` による二重実行防止）
- 既存テスト（`gameFlow.test.ts`）の全呼び出しに `await` を追加
- `useGameController.test.ts` を async パターンに全面修正（`waitFor` + `waitForSettled` ヘルパーで非同期完了を待つ）

## 変更内容
- 変更: `src/application/gameFlow.ts` — `processCpuTurnsAndPhases`, `handlePlayerAction`, `advanceUntilHumanTurn` を async 化。`yieldToMainThread` ヘルパー追加。`onProgress` コールバック追加
- 変更: `src/application/useGameController.ts` — `startGame`, `handleAction` を async 即時関数で包む。`gameStateRef`, `processingRef` 追加
- 変更: `src/application/gameFlow.test.ts` — 全テストに `async/await` 追加
- 変更: `src/application/useGameController.test.ts` — async パターンに全面修正

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし（成功）

## テスト結果
- `npx vitest run` — 25 test files, 451 tests passed, 0 failed