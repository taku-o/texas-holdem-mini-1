# 変更スコープ宣言

## タスク
PlayerSeats テストから humanPlayerId prop を全箇所削除

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/ui/PlayerSeats.test.tsx` |

## 推定規模
Small

## 影響範囲
- PlayerSeats コンポーネントのテスト（全6箇所の `humanPlayerId` prop 削除）
- data-testid クエリは変更不要（PlayerSeat ルート div への移動後も同じセレクタで取得可能）