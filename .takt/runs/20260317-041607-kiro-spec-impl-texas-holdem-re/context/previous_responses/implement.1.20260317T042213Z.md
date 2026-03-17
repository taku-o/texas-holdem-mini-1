## 作業結果
- タスク10（リスト表示の key を安定した識別子にする）を実装完了
- `TableView.tsx` と `PlayerSeat.tsx` の両方で、`key={index}` を `key={`${card.suit}-${card.rank}`}` に変更し、カードの安定した一意識別子を使用するようにした

## 変更内容
- `src/ui/TableView.tsx` — コミュニティカードの `key` を配列インデックスから `${card.suit}-${card.rank}` に変更
- `src/ui/PlayerSeat.tsx` — ホールカードの `key` を配列インデックスから `${card.suit}-${card.rank}` に変更

## ビルド結果
- TypeScript 型チェック: タスク対象ファイルにエラーなし（既存の `ActionBar.tsx` の型エラーは今回のタスクとは無関係）

## テスト結果
- `npx vitest run src/ui/TableView.test.tsx src/ui/PlayerSeat.test.tsx` — 全20テストパス（2ファイル）