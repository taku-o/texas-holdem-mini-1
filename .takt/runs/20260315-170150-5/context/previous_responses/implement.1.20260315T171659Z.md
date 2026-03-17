## 作業結果
- 5件のコード重複をすべて解消した
  - **タスク1**: `debug_common.ts` を新規作成し、`executeBettingRound`、`setupCpuChips`、`callCheckSelector`、`cpuFoldHumanCallSelector` を共通モジュールとして抽出。3つのデバッグスクリプト（`debug_game.ts`、`debug_game2.ts`、`debug_game3.ts`）をリファクタリング
  - **タスク2**: `gameEngine.integration.test.ts` の重複していた `expectedExports` 配列をファイルトップレベルの `EXPECTED_EXPORTS` 定数に集約
  - **タスク3**: `gameEngine.integration.test.ts` にベッティングラウンドヘルパー `advanceAndCheckAll` を抽出し、フロップ/ターン/リバーの3箇所×複数テストの重複ループを置換
  - **タスク4**: `useGameController.test.ts` にゲーム終了待ちヘルパー `waitForGameEnd` を抽出し、6箇所の重複ループを置換
  - **タスク5**: `src/domain/testHelpers.ts` に `calcTotalChips` 関数を追加し、5つのテストファイル合計31箇所のチップ保存則チェックパターンを置換

## 変更内容
- 作成: `debug_common.ts`（デバッグスクリプト共通モジュール）
- 変更: `debug_game.ts`（debug_common.ts を使用するリファクタリング）
- 変更: `debug_game2.ts`（debug_common.ts を使用するリファクタリング）
- 変更: `debug_game3.ts`（cpuFoldHumanCallSelector のみ共有）
- 変更: `src/domain/testHelpers.ts`（`calcTotalChips` 関数追加）
- 変更: `src/domain/gameEngine.integration.test.ts`（EXPECTED_EXPORTS定数化、advanceAndCheckAllヘルパー、calcTotalChips適用）
- 変更: `src/application/useGameController.test.ts`（waitForGameEndヘルパー、calcTotalChips適用）
- 変更: `src/application/gameFlow.test.ts`（calcTotalChips適用）
- 変更: `src/domain/gameSetup.test.ts`（calcTotalChips適用）
- 変更: `src/domain/showdown.test.ts`（calcTotalChips適用）

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし（成功）

## テスト結果
- `npx vitest run` — 23ファイル、381テスト全パス（3.63s）
- デバッグスクリプト3本 (`npx tsx debug_game.ts`, `debug_game2.ts`, `debug_game3.ts`) — すべて正常動作確認済み