# タスク完了サマリー

## タスク
PlayerSeats コンポーネントから冗長な `humanPlayerId` prop を削除し `player.isHuman` に置き換える。また不要なラッパー div を除去し `data-testid` を PlayerSeat コンポーネントに直接渡す形に変更する。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 変更 | `src/ui/PlayerSeat.tsx` | `isHuman` prop削除、`player.isHuman` 直接参照、`data-testid` prop追加 |
| 変更 | `src/ui/PlayerSeats.tsx` | `humanPlayerId` prop削除、ラッパーdiv除去、`data-testid` を PlayerSeat に直接渡し |
| 変更 | `src/ui/PlayerSeat.test.tsx` | 全テストから `isHuman` prop削除 |
| 変更 | `src/ui/PlayerSeats.test.tsx` | 全テストから `humanPlayerId` prop削除 |

## 確認コマンド
```bash
npx vitest run
npx tsc --noEmit
```