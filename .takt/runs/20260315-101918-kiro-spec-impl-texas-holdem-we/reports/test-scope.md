# 変更スコープ宣言

## タスク
タスク6: ゲームコントローラー（useGameController カスタムフック）のテスト作成

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/application/useGameController.test.ts` |

## 推定規模
Medium

## 影響範囲
- `src/application/useGameController.ts`（テスト対象・未実装）
- `src/application/gameFlow.ts`（依存先: handlePlayerAction, advanceUntilHumanTurn）
- `src/domain/gameSetup.ts`（依存先: setupNewGame）
- `src/domain/betting.ts`（依存先: getValidActions）