# 決定ログ

## 1. vitest config に globals: true を追加
- **背景**: `@testing-library/react` の自動クリーンアップが vitest の `afterEach` をグローバルに検出できず、テスト間で DOM がクリーンアップされなかった。これにより CardView テスト等で前のテストの DOM 要素が残り、`getByText` が複数要素を検出してエラーになった
- **検討した選択肢**: (a) 各テストファイルに `import { cleanup } from '@testing-library/react'` と `afterEach(cleanup)` を手動追加、(b) vitest config に `globals: true` を追加
- **理由**: (b) を選択。プロジェクト全体で一度の設定変更で解決でき、テストファイル側に余計なボイラープレートが不要。既存の全19ファイル・288テストにも影響なくパスすることを確認済み

## 2. PlayerSeats テストの getByText を getAllByText に修正
- **背景**: テストが `screen.getByText(/1000/)` で5席のチップ表示を検証しようとしたが、全5プレイヤーのチップが同額(1000)のため5つの一致要素が見つかり、単一要素を期待する `getByText` がエラーになった
- **検討した選択肢**: (a) テストのプレイヤーのチップ額をユニークな値に変更する、(b) `getAllByText` に変更して件数を `toHaveLength(5)` で検証
- **理由**: (b) を選択。テストの意図は「5席分が表示されること」の確認であり、`getAllByText` + `toHaveLength(5)` がより正確にその意図を表現する。チップ額をユニークにすると `createFivePlayers` ヘルパーの変更が必要になり、同ファイル内の他テストにも影響する