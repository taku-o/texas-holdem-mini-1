# 変更スコープ宣言

## タスク
CPU連続処理の非同期化（handlePlayerAction, advanceUntilHumanTurn を async 化し、yieldToMainThread と onProgress コールバックを追加）

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/application/gameFlow.ts` |
| 変更 | `src/application/useGameController.ts` |
| 変更 | `src/application/gameFlow.test.ts` |
| 変更 | `src/application/useGameController.test.ts` |

## 推定規模
Medium

## 影響範囲
- gameFlow モジュール（processCpuTurnsAndPhases, handlePlayerAction, advanceUntilHumanTurn の async 化、yieldToMainThread ヘルパー追加、onProgress コールバック追加）
- useGameController（startGame, handleAction の async 即時関数化、gameStateRef/processingRef による状態追跡と二重実行防止）
- gameFlow.test.ts（全テストに async/await 追加）
- useGameController.test.ts（async act + waitFor パターンへの全面修正、waitForSettled/startAndWait ヘルパー導入）