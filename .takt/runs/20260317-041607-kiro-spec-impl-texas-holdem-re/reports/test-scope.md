# 変更スコープ宣言

## タスク
リスト表示の key を安定した識別子（`${card.suit}-${card.rank}`）にする

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/ui/TableView.test.tsx`（再レンダリング時のカード表示テストを追加） |
| 変更 | `src/ui/PlayerSeat.test.tsx`（showCards切替時の再レンダリングテストを追加） |

## 推定規模
Small

## 影響範囲
- `src/ui/TableView.tsx` — コミュニティカードの key（実装で変更予定）
- `src/ui/PlayerSeat.tsx` — ホールカードの key（実装で変更予定）