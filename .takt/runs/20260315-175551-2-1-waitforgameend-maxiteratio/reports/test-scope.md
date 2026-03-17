# 変更スコープ宣言

## タスク
waitForGameEnd の maxIterations エラースローと ActionLogger の actions パラメータ追加に対するテスト作成

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/application/useGameController.test.ts` |
| 変更 | `debug_common.test.ts` |

## 推定規模
Small

## 影響範囲
- `src/application/useGameController.test.ts` の `waitForGameEnd` ヘルパー関数（maxIterations 到達時にエラーをスローするよう変更）
- `debug_common.test.ts` の `executeBettingRound` ロガーテスト（`ActionLogger` 型の 4 引数シグネチャ対応 + `actions` パラメータ検証テスト追加）