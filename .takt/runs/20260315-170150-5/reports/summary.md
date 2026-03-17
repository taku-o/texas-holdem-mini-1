# タスク完了サマリー

## タスク
レビューで指摘された5件のコード重複（デバッグスクリプト共通構造、facadeエクスポートテスト、ベッティングラウンドループ、ゲーム終了待ちループ、チップ保存則チェック）を、共通関数・ヘルパーの抽出により解消する。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 作成 | `debug_common.ts` | デバッグスクリプト共通モジュール（executeBettingRound, setupCpuChips, callCheckSelector, cpuFoldHumanCallSelector, ActionLogger） |
| 作成 | `debug_common.test.ts` | debug_common.ts のテスト（ロガーコールバック検証含む） |
| 作成 | `src/domain/testHelpers.calcTotalChips.test.ts` | calcTotalChips のユニットテスト |
| 変更 | `debug_game.ts` | debug_common.ts の共有関数を利用する形にリファクタリング |
| 変更 | `debug_game2.ts` | debug_common.ts の共有関数を利用する形にリファクタリング |
| 変更 | `debug_game3.ts` | executeBettingRound + ActionLoggerコールバックで共通化 |
| 変更 | `src/domain/testHelpers.ts` | calcTotalChips 関数を追加 |
| 変更 | `src/domain/gameEngine.integration.test.ts` | EXPECTED_EXPORTS定数化、advanceAndCheckAllヘルパー抽出、calcTotalChips適用 |
| 変更 | `src/application/useGameController.test.ts` | waitForGameEndヘルパー抽出（6箇所）、calcTotalChips適用 |
| 変更 | `src/application/gameFlow.test.ts` | calcTotalChips適用 |
| 変更 | `src/domain/gameSetup.test.ts` | calcTotalChips適用 |
| 変更 | `src/domain/showdown.test.ts` | calcTotalChips適用 |

## 確認コマンド
```bash
npx vitest run
npx tsc --noEmit
npx tsx debug_game.ts
npx tsx debug_game2.ts
npx tsx debug_game3.ts
```