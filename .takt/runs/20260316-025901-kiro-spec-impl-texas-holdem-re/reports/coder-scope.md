# 変更スコープ宣言

## タスク
ベッティングのバリデーション・チップフィルタリング・min/max範囲返却・オールインaggressorラウンド終了判定の実装

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/domain/types.ts` |
| 変更 | `src/domain/betting.ts` |
| 変更 | `src/domain/gameEngine.ts` |
| 変更 | `src/application/useGameController.ts` |
| 変更 | `src/ui/ActionBar.tsx` |
| 変更 | `src/ui/ActionBar.test.tsx` |
| 変更 | `src/ui/GameScreen.tsx` |
| 変更 | `src/ui/GameScreen.test.tsx` |

## 推定規模
Medium

## 影響範囲
- ベッティングドメイン（getValidActions, applyAction, isBettingRoundComplete）
- 型定義（ValidAction 型の追加と配線）
- UIレイヤーの型互換性（ActionBar, GameScreen, useGameController）