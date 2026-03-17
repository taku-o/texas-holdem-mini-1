## 作業結果
- 計画に従い、4つのUIコンポーネント（CardView, TableView, PlayerSeat, PlayerSeats）を `src/ui/` 配下に作成した
- vitest config に `globals: true` を追加してテスト間の自動クリーンアップを有効にした
- PlayerSeats テストの `getByText` を `getAllByText` に修正（複数要素マッチの問題を解決）

## 変更内容

| 種別 | ファイル | 行数 | 内容 |
|------|---------|------|------|
| 作成 | `src/ui/CardView.tsx` | 37行 | 1枚のカード表示（表面: ランク+スート+色分け、裏面: 青背景） |
| 作成 | `src/ui/TableView.tsx` | 21行 | コミュニティカード0〜5枚表示 + ポット額表示 |
| 作成 | `src/ui/PlayerSeat.tsx` | 59行 | 1席のプレイヤー情報（手札、チップ、ディーラーマーカー、ターン/フォールド/人間の視覚表示） |
| 作成 | `src/ui/PlayerSeats.tsx` | 35行 | 全5席配置 + phase→showCards変換ロジック |
| 変更 | `vite.config.ts` | 1行 | `globals: true` 追加（テスト自動クリーンアップ有効化） |
| 変更 | `src/ui/PlayerSeats.test.tsx` | 3行 | `getByText` → `getAllByText` + `toHaveLength(5)` に修正 |

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし

## テスト結果
- `npx vitest run` — 全19ファイル、288テストがパス