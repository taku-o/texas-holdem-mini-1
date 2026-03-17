# 変更スコープ宣言

## タスク
レビュー指摘5件のコード重複を共通関数・ヘルパーの抽出により解消する

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `debug_common.ts` |
| 変更 | `debug_game.ts` |
| 変更 | `debug_game2.ts` |
| 変更 | `debug_game3.ts` |
| 変更 | `src/domain/testHelpers.ts` |
| 変更 | `src/domain/gameEngine.integration.test.ts` |
| 変更 | `src/application/useGameController.test.ts` |
| 変更 | `src/application/gameFlow.test.ts` |
| 変更 | `src/domain/gameSetup.test.ts` |
| 変更 | `src/domain/showdown.test.ts` |

## 推定規模
Large

## 影響範囲
- デバッグスクリプト（debug_game.ts, debug_game2.ts, debug_game3.ts）— 共通モジュール debug_common.ts への依存追加
- テストユーティリティ（src/domain/testHelpers.ts）— calcTotalChips 関数追加
- gameEngine.integration.test.ts — EXPECTED_EXPORTS 定数化、advanceAndCheckAll ヘルパー抽出、calcTotalChips 適用
- useGameController.test.ts — waitForGameEnd ヘルパー抽出、calcTotalChips 適用
- gameFlow.test.ts — calcTotalChips 適用（12箇所）
- gameSetup.test.ts — calcTotalChips 適用（1箇所）
- showdown.test.ts — calcTotalChips 適用（3箇所）