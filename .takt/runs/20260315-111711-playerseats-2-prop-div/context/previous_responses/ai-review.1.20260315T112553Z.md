レビューに必要な情報が揃いました。以下がレビュー結果です。

---

## AI Antipattern Review — 判定: **REJECT**

### 検出された問題

#### [REJECT] finding_id: `AIR-001` (new) — `PlayerSeat` の `isHuman` propが `player.isHuman` と冗長

**ファイル:** `src/ui/PlayerSeat.tsx:6`, `src/ui/PlayerSeats.tsx:29`

**問題:**
タスクの目的は「`humanPlayerId` propの冗長性を `player.isHuman` で解消する」ことだった。`PlayerSeats` からは `humanPlayerId` を正しく除去したが、`PlayerSeat` コンポーネントに `isHuman: boolean` という冗長なpropが残っている。

`PlayerSeat` は既に `player: Player` propを受け取っており、`player.isHuman` でアクセス可能。にもかかわらず `isHuman` を別propとして受け取り、`PlayerSeats.tsx:29` で `isHuman={player.isHuman}` と同値を渡している。これはAIが冗長性を1レベル下に移動しただけで、根本的に解消していないパターン。

**該当コード:**
```tsx
// src/ui/PlayerSeat.tsx:4-11 — isHuman propが冗長
export type PlayerSeatProps = {
  player: Player       // player.isHuman が既にある
  isHuman: boolean     // ← 冗長
  ...
}

// src/ui/PlayerSeats.tsx:29 — 同値を渡している
isHuman={player.isHuman}  // ← player 経由で取れる値をわざわざpropで渡す
```

**修正方法:**
1. `PlayerSeatProps` から `isHuman` propを削除する
2. `PlayerSeat` 内部で `player.isHuman` を直接使う（`shouldShowFaceUp`, `buildSeatClasses` の引数）
3. `PlayerSeats.tsx` から `isHuman={player.isHuman}` の行を削除する
4. `PlayerSeat.test.tsx` の全テストから `isHuman={...}` propを削除する

```tsx
// 修正後の PlayerSeatProps
export type PlayerSeatProps = {
  player: Player
  isDealer: boolean
  isCurrentTurn: boolean
  showCards: boolean
  'data-testid'?: string
}

// 修正後の PlayerSeat 内部
const shouldShowFaceUp = player.isHuman || showCards
const seatClasses = buildSeatClasses({ isHuman: player.isHuman, isCurrentTurn, folded: player.folded })
```

**判定根拠:** 今回の変更で導入された冗長性（新規ファイル）。ボーイスカウトルール「冗長な式（同値の短い書き方がある）→ REJECT」に該当。

---

### 問題なし確認済み項目

| 確認項目 | 結果 |
|---------|------|
| `humanPlayerId` が PlayerSeats から除去 | ✅ 正常に除去済み |
| `humanPlayerId` のドメイン層残存 | ✅ `GameState.humanPlayerId` は別用途で使用中（UI propとは無関係） |
| ラッパー div の除去 | ✅ `data-testid` を PlayerSeat に直接渡す形に変更済み |
| `data-testid` propの実装 | ✅ オプショナルpropとしてルート div に付与 |
| 幻覚API・存在しないメソッド | ✅ 検出なし |
| 未使用import | ✅ 検出なし |
| スコープクリープ | ✅ タスク範囲内の変更のみ |
| フォールバック値の濫用 | ✅ 検出なし |

---

### 総合判定

**REJECT** — ブロッキング問題 1件（`AIR-001`）

`isHuman` propの冗長性を除去し、`PlayerSeat` が `player.isHuman` を直接参照する形に修正してください。