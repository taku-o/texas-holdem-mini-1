全テストパス、ビルド成功。`isHuman` が他のファイルから参照されていないことも確認済みです。

## 作業結果
- AIR-001（redundant-prop）の指摘を修正：`PlayerSeatProps` から `isHuman: boolean` を削除し、コンポーネント内部で `player.isHuman` を直接参照するように変更
- `PlayerSeats.tsx` から `isHuman={player.isHuman}` の受け渡しを削除
- `PlayerSeat.test.tsx` の全11テストから `isHuman={...}` prop を削除

## 変更内容
- **変更**: `src/ui/PlayerSeat.tsx` — `PlayerSeatProps` から `isHuman` を削除、内部で `player.isHuman` を直接使用（19行目、21行目）
- **変更**: `src/ui/PlayerSeats.tsx` — `isHuman={player.isHuman}` 行を削除
- **変更**: `src/ui/PlayerSeat.test.tsx` — 全テストから `isHuman={...}` prop を削除（11箇所）

## ビルド結果
- `npm run build` 成功（型エラーなし）

## テスト結果
- `npx vitest run` — 19ファイル 289テスト 全パス

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 0 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回修正） | 1 |

## 証拠
- `src/ui/PlayerSeat.tsx:4-9` — `PlayerSeatProps` に `isHuman` なし
- `src/ui/PlayerSeat.tsx:19` — `player.isHuman || showCards` で直接参照
- `src/ui/PlayerSeat.tsx:21` — `buildSeatClasses({ isHuman: player.isHuman, ... })` で直接参照
- `src/ui/PlayerSeats.tsx:25-32` — `isHuman` prop の受け渡しなし
- `grep isHuman src/ui/PlayerSeat.test.tsx` — コンポーネント prop としての `isHuman` 使用箇所なし（`createTestPlayer` の引数とコメント内のみ）
- ビルド成功、289テスト全パス