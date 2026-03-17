# 変更スコープ宣言

## タスク
PlayerSeatsから冗長なhumanPlayerId propを削除し、不要なラッパーdivを除去する

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/ui/PlayerSeats.tsx` |
| 変更 | `src/ui/PlayerSeat.tsx` |

## 推定規模
Small

## 影響範囲
- PlayerSeats コンポーネント（humanPlayerId prop削除、player.isHumanへの置き換え、ラッパーdiv除去）
- PlayerSeat コンポーネント（data-testid prop受け取り対応）