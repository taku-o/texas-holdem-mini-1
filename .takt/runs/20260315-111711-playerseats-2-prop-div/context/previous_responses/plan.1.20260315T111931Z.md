PlayerSeats はテストからのみ参照されており、まだプロダクションコードの呼び出し元はない。これで必要な情報が揃った。

---

## 計画レポート

### タスク概要
PlayerSeats コンポーネントに対する2件のリファクタリング：
1. `humanPlayerId` prop の削除 → `player.isHuman` 利用に変更
2. 不要なラッパー `<div>` の除去 → `data-testid` を PlayerSeat に移動

### 要件ごとの変更要/不要判定

#### 要件1: humanPlayerId prop の削除と player.isHuman への置き換え

**変更要。**

- `PlayerSeats.tsx:6` — `PlayerSeatsProps` に `humanPlayerId: string` が定義されている
- `PlayerSeats.tsx:24` — `const isHuman = player.id === humanPlayerId` で判定している
- `Player` 型（`types.ts:24`）は既に `isHuman: boolean` を持っているため、`player.isHuman` に置き換え可能
- `PlayerSeats.test.tsx` — 全テストで `humanPlayerId="player-0"` を渡しており、修正が必要
- `GameState.humanPlayerId`（`types.ts:55`）— PlayerSeats のスコープ外。タスク指示書は「PlayerSeats の呼び出し元から humanPlayerId の受け渡しを削除する」とあるが、現在テスト以外の呼び出し元がない。`GameState` 型の `humanPlayerId` は PlayerSeats とは独立した用途（ゲーム状態管理）であり、今回のスコープでは削除しない

#### 要件2: 不要なラッパー div の除去

**変更要。**

- `PlayerSeats.tsx:28` — `<div key={player.id} data-testid={`player-seat-${index}`}>` でラッパーdivが存在
- `PlayerSeat.tsx:4-10` — `PlayerSeatProps` に `data-testid` が存在しない
- `PlayerSeat.tsx:24` — ルート `<div>` に `data-testid` がない
- `PlayerSeats.test.tsx:37,176` — `container.querySelectorAll('[data-testid^="player-seat-"]')` でラッパーdiv経由のテストがある

### 影響範囲

| ファイル | 変更内容 |
|---------|---------|
| `src/ui/PlayerSeats.tsx` | `humanPlayerId` prop削除、`player.isHuman` 使用、ラッパーdiv除去 |
| `src/ui/PlayerSeat.tsx` | `data-testid` prop追加、ルートdivに付与 |
| `src/ui/PlayerSeats.test.tsx` | `humanPlayerId` propの削除、data-testid のクエリ方法は変わらない（PlayerSeatのルートdivに移動するため引き続き取得可能） |

### 実装アプローチ

#### 変更1: humanPlayerId prop の削除

**PlayerSeats.tsx:**
- `PlayerSeatsProps` から `humanPlayerId: string` を削除
- 関数パラメータから `humanPlayerId` を削除
- `const isHuman = player.id === humanPlayerId` → `player.isHuman` に直接置き換え（`PlayerSeat` に `isHuman={player.isHuman}` を渡す）

**PlayerSeats.test.tsx:**
- 全テストの `<PlayerSeats>` から `humanPlayerId="player-0"` propを削除
- `createFivePlayers()` は既に `isHuman: i === 0` を設定しているため（`PlayerSeats.test.tsx:11`）、テストのロジックは変更不要

#### 変更2: ラッパー div の除去

**PlayerSeat.tsx:**
- `PlayerSeatProps` に `"data-testid"?: string` を追加
- ルートの `<div className={seatClasses}>` に `data-testid` を付与

**PlayerSeats.tsx:**
- ラッパー `<div key={player.id} data-testid={...}>` を除去
- `<PlayerSeat>` に `key={player.id}` と `data-testid={`player-seat-${index}`}` を直接渡す

### Coder向け実装ガイドライン

#### 参照すべき既存パターン
- `PlayerSeat.tsx:4-10` — 既存の `PlayerSeatProps` 型定義。ここに `"data-testid"` を追加
- `PlayerSeats.tsx:22-38` — 現在のmapループ。ラッパーdiv除去後は `<PlayerSeat key={player.id} data-testid={...} .../>` に変更

#### 配線の全箇所
- `PlayerSeatsProps`（`PlayerSeats.tsx:4-10`）— `humanPlayerId` 行を削除
- `PlayerSeats` 関数のデストラクチャリング（`PlayerSeats.tsx:12-18`）— `humanPlayerId` を削除
- `PlayerSeatProps`（`PlayerSeat.tsx:4-10`）— `"data-testid"?: string` を追加
- `PlayerSeat` 関数のデストラクチャリング（`PlayerSeat.tsx:12-18`）— `"data-testid"` を追加
- `PlayerSeat` のルートdiv（`PlayerSeat.tsx:24`）— `data-testid` 属性を付与
- `PlayerSeats.test.tsx` — 全6箇所の `humanPlayerId="player-0"` を削除

#### 注意事項
- `PlayerSeat` に `"data-testid"` を追加する際、React の `HTMLAttributes` を extends する方法もあるが、このコンポーネントは小さく、必要なのは `data-testid` のみなので、明示的にpropsに追加する方がシンプル
- `PlayerSeat.test.tsx` は `data-testid` を使用していないため変更不要
- `GameState.humanPlayerId`（`types.ts:55`）は削除しない。PlayerSeats 以外の箇所で使用される可能性がある。タスク指示書の「`humanPlayerId` が未使用になった場合、関連する型定義・インターフェースからも削除する」の条件を満たさない