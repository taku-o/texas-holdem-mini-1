# 変更スコープ宣言

## タスク
テーブル・カード・席の表示UIコンポーネント4ファイルの実装

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/ui/CardView.tsx` |
| 作成 | `src/ui/TableView.tsx` |
| 作成 | `src/ui/PlayerSeat.tsx` |
| 作成 | `src/ui/PlayerSeats.tsx` |
| 変更 | `vite.config.ts` |
| 変更 | `src/ui/PlayerSeats.test.tsx` |

## 推定規模
Medium

## 影響範囲
- `src/ui/` ディレクトリ配下のUIコンポーネント群（新規作成4ファイル）
- vitest設定（`globals: true` 追加によるテスト自動クリーンアップ有効化）
- PlayerSeatsテスト（`getByText` → `getAllByText` 修正）