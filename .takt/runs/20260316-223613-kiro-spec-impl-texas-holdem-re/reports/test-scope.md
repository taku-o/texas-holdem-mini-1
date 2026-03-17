# 変更スコープ宣言

## タスク
startGame 内の setState 呼び出しを関数形式に統一するテストを作成

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/application/__tests__/useGameController.setStateForm.test.ts` |

## 推定規模
Small

## 影響範囲
- `src/application/useGameController.ts` の `startGame` 関数内における `setGameState` の呼び出し形式