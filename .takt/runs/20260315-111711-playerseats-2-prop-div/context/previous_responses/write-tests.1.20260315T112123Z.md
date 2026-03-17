## 作業結果
- 既存テストファイル `src/ui/PlayerSeats.test.tsx` から `humanPlayerId="player-0"` prop を全6箇所削除した
- `data-testid` のクエリ方法は変更不要（PlayerSeat のルート div に移動するため、同じセレクタで取得可能）
- 新規テストの追加は不要と判断（振る舞いの変更はなく、既存テストが `player.isHuman` ベースの動作を十分カバー済み）
- `createFivePlayers()` は既に `isHuman: i === 0` を設定しているため、テストロジックの修正は不要

## 変更内容
- **変更**: `src/ui/PlayerSeats.test.tsx` — 全テストの `<PlayerSeats>` レンダリングから `humanPlayerId` prop を削除（6箇所）