# 変更スコープ宣言

## タスク
チップ0プレイヤーを次ハンドで除外（folded維持、カード配布スキップ）

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/domain/dealing.ts` |
| 変更 | `src/domain/handProgression.ts` |

## 推定規模
Small

## 影響範囲
- dealing モジュール（dealHoleCards: foldedプレイヤーへのカード配布スキップ）
- handProgression モジュール（startNextHand: チップ0プレイヤーのfolded状態維持）