# 変更スコープ宣言

## タスク
CPU連続処理の非同期化に対するテスト作成（タスク8）

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/application/gameFlow.async.test.ts` |

## 推定規模
Small

## 影響範囲
- `src/application/gameFlow.ts` — handlePlayerAction, advanceUntilHumanTurn の async 化と onProgress コールバック
- `src/application/useGameController.ts` — async 対応と二重実行防止