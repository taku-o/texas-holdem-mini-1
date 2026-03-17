## 作業結果
- PlayerSeats コンポーネントから `humanPlayerId` prop を削除し、`player.isHuman` に置き換えた
- PlayerSeats 内の各 PlayerSeat を囲んでいたラッパー `<div data-testid={...}>` を除去した
- PlayerSeat コンポーネントに `data-testid` prop（オプショナル）を追加し、ルート `<div>` に付与するようにした

## 変更内容
- **変更**: `src/ui/PlayerSeats.tsx` — `humanPlayerId` prop・型定義を削除、`player.isHuman` を使用、ラッパーdiv除去して `data-testid` と `key` を PlayerSeat に直接渡す
- **変更**: `src/ui/PlayerSeat.tsx` — `PlayerSeatProps` に `'data-testid'?: string` を追加、ルート div に `data-testid` 属性を付与

## ビルド結果
- `npm run build` 成功（型エラーなし）

## テスト結果
- `npx vitest run` — 19ファイル 289テスト 全パス