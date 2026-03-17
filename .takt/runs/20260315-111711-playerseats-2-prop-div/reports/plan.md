# タスク計画

## 元の要求
PlayerSeats コンポーネントのレビュー指摘事項2件を修正する（冗長なprop削除、不要なラッパーdiv除去）

## 分析結果

### 目的
1. `humanPlayerId` propを削除し、既に `Player` 型に存在する `player.isHuman` を直接利用することで冗長なpropの受け渡しを排除する
2. PlayerSeats 内の不要なラッパー `<div>` を除去し、`data-testid` を PlayerSeat コンポーネントのルート要素に移動してDOM階層を削減する

### スコープ

| ファイル | 変更内容 |
|---------|---------|
| `src/ui/PlayerSeats.tsx` | `humanPlayerId` prop削除、`player.isHuman` 使用、ラッパーdiv除去 |
| `src/ui/PlayerSeat.tsx` | `data-testid` propを受け取りルートdivに付与 |
| `src/ui/PlayerSeats.test.tsx` | 全テストから `humanPlayerId` propを削除 |

### 実装アプローチ

#### 変更1: humanPlayerId prop の削除

**PlayerSeats.tsx:**
- `PlayerSeatsProps` から `humanPlayerId: string` を削除（現在: 6行目）
- 関数デストラクチャリングから `humanPlayerId` を削除（現在: 14行目）
- `const isHuman = player.id === humanPlayerId`（現在: 24行目）を削除し、PlayerSeatへの渡し方を `isHuman={player.isHuman}` に変更（現在: 31行目）

**PlayerSeats.test.tsx:**
- 全6箇所の `humanPlayerId="player-0"` propを削除
- `createFivePlayers()` は既に `isHuman: i === 0` を設定しているため（11行目）、テストロジックの変更は不要

#### 変更2: ラッパー div の除去

**PlayerSeat.tsx:**
- `PlayerSeatProps` に `"data-testid"?: string` を追加（4-10行目）
- 関数デストラクチャリングに `"data-testid"` を追加（12-18行目）
- ルートの `<div className={seatClasses}>`（24行目）に `data-testid` 属性を付与

**PlayerSeats.tsx:**
- `<div key={player.id} data-testid={...}>` ラッパーを除去（28行目）
- `<PlayerSeat>` に `key={player.id}` と `` data-testid={`player-seat-${index}`} `` を直接渡す
- 対応する `</div>` も除去（36行目）

## 実装ガイドライン

- **参照パターン:** `PlayerSeatProps`（`PlayerSeat.tsx:4-10`）の既存props定義に倣って `"data-testid"` を追加する
- **配線の全箇所:**
  - `PlayerSeatsProps` 型定義（`PlayerSeats.tsx:4-10`）— `humanPlayerId` 行を削除
  - `PlayerSeats` 関数デストラクチャリング（`PlayerSeats.tsx:12-18`）— `humanPlayerId` を削除
  - `PlayerSeatProps` 型定義（`PlayerSeat.tsx:4-10`）— `"data-testid"?: string` を追加
  - `PlayerSeat` 関数デストラクチャリング（`PlayerSeat.tsx:12-18`）— `"data-testid"` を追加
  - `PlayerSeat` ルートdiv（`PlayerSeat.tsx:24`）— `data-testid` 属性を付与
  - `PlayerSeats.test.tsx` — 全6箇所の `humanPlayerId="player-0"` を削除
- **PlayerSeat.test.tsx は変更不要:** `data-testid` を使用していないため影響なし
- **`isHuman` propは維持する:** PlayerSeat は引き続き `isHuman` propを受け取るが、値の算出元が変わる（`player.id === humanPlayerId` → `player.isHuman`）

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| `GameState.humanPlayerId`（`types.ts:55`）の削除 | PlayerSeats以外のゲーム状態管理で使用されている。タスク指示書の「未使用になった場合に削除」の条件を満たさない |
| `testHelpers.ts` の `createTestState` 内の `humanPlayerId`（32行目）の削除 | `GameState` 型の一部であり、PlayerSeatsとは独立した用途 |