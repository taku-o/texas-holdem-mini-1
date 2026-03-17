# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 4` — チップが 0 のプレイヤーを次ハンドから除外する（タスク 4.1, 4.2）

## 分析結果

### 目的
1ハンド終了後にチップが0のプレイヤーを次のハンドに参加させない。次ハンドのディーラー・席順・ブラインドの計算でチップ0のプレイヤーをスキップする。

### スコープ

| サブタスク | 内容 | 要件 |
|-----------|------|------|
| 4.1 | チップ0プレイヤーを次ハンドに参加させない | Req 5 |
| 4.2 | ディーラー・席順・ブラインドでチップ0をスキップ | Req 5 |

#### 要件ごとの変更要/不要

| 要件 | 判定 | 根拠 |
|------|------|------|
| 4.1: チップ0を次ハンドに参加させない | **変更要** | `src/domain/handProgression.ts:83` で全プレイヤーの `folded` を `false` にリセットしており、チップ0プレイヤーも次ハンドに参加する状態になる |
| 4.1 補足: ホールカード配布 | **変更要** | `src/domain/dealing.ts:41-44` で全プレイヤーにカードを配っており、チップ0プレイヤーにもカードが配られる |
| 4.2: ディーラーのスキップ | **変更不要** | `src/domain/handProgression.ts:68-71` の `getNextDealerIndex` → `findNextEligibleIndex`（`src/domain/dealing.ts:12`）が `chips > 0` で判定済み |
| 4.2: ブラインドのスキップ | **変更不要** | `src/domain/dealing.ts:20-21` の `postBlinds` が `findNextEligibleIndex` で SB/BB を決定し、`chips > 0` のプレイヤーのみ対象 |
| 4.2: アクション順のスキップ | **変更不要** | `src/domain/betting.ts:145` の `getNextActivePlayerIndex` が `!player.folded && player.chips > 0` でフィルタ済み |

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| A: 型変更なし・`folded` フラグ活用 | **採用** | 下流の全フィルタリングが既に `chips > 0` または `!player.folded` で動作しており、`Player` 型変更不要で影響範囲最小 |
| B: `isEligibleForNextHand` / `isSittingOut` フラグ追加 | 不採用 | 型変更が必要で、全フィルタリング箇所を書き換える必要があり過剰 |

### 実装アプローチ

**変更ファイル1: `src/domain/handProgression.ts` — `startNextHand()` (行80-85)**

現在のコード:
```typescript
const players = state.players.map((p) => ({
  ...p,
  holeCards: [] as Card[],
  folded: false,
  currentBetInRound: 0,
}))
```

変更内容: `folded` を `p.chips === 0` に変更する。チップ0のプレイヤーは `folded: true` を維持し、次ハンドに参加しない。

```typescript
const players = state.players.map((p) => ({
  ...p,
  holeCards: [] as Card[],
  folded: p.chips === 0,
  currentBetInRound: 0,
}))
```

**変更ファイル2: `src/domain/dealing.ts` — `dealHoleCards()` (行40-47)**

現在のコード:
```typescript
export function dealHoleCards(state: GameState): GameState {
  const players = state.players.map((p, i) => ({
    ...p,
    holeCards: [state.deck[i * 2], state.deck[i * 2 + 1]],
  }))
  const deck = state.deck.slice(state.players.length * 2)
  return { ...state, players, deck }
}
```

問題: `i * 2` で全プレイヤーに2枚ずつ配るため、チップ0（folded）プレイヤーにもカードが配られ、デッキカードが無駄に消費される。

変更内容: フォールド済みプレイヤーにはカードを配らず、デッキ消費量をアクティブプレイヤー数に基づかせる。

```typescript
export function dealHoleCards(state: GameState): GameState {
  let cardIndex = 0
  const players = state.players.map((p) => {
    if (p.folded) return { ...p, holeCards: [] }
    const holeCards = [state.deck[cardIndex * 2], state.deck[cardIndex * 2 + 1]]
    cardIndex++
    return { ...p, holeCards }
  })
  const deck = state.deck.slice(cardIndex * 2)
  return { ...state, players, deck }
}
```

#### 変更不要の下流確認

| モジュール:行 | 関数 | フィルタ条件 | 状況 |
|-------------|------|------------|------|
| `gameFlow.ts:14` | `getNonFoldedCount` | `!p.folded` | chip-0は folded=true なのでカウントされない ✓ |
| `gameFlow.ts:18-19` | `canAnyoneStillBet` | `!p.folded && p.chips > 0` | 二重にフィルタ ✓ |
| `betting.ts:121` | `isBettingRoundComplete` | `!p.folded` | chip-0は除外される ✓ |
| `betting.ts:145` | `getNextActivePlayerIndex` | `!player.folded && player.chips > 0` | 二重にフィルタ ✓ |
| `showdown.ts:12` | `determineWinners` | `players[i].folded` | foldedをスキップ ✓ |
| `showdown.ts:49` | `resolveUncontestedPot` | `!p.folded` | foldedをスキップ ✓ |
| `ui/PlayerSeats.tsx:22` | 表示制御 | `!player.folded` | foldedは非表示 ✓ |

## 実装ガイドライン

- **参照すべき既存パターン:**
  - `src/domain/dealing.ts:4-16` の `findNextEligibleIndex` — `chips > 0` によるプレイヤーフィルタリングのパターン
  - `src/domain/betting.ts:145` の `getNextActivePlayerIndex` — `!player.folded && player.chips > 0` の二重条件フィルタパターン
  - `src/domain/handProgression.test.ts:257-273` — チップ0プレイヤーのスキップテストの既存パターン
  - `src/domain/handProgression.test.ts:292-298` — `player.chips > 0` の場合のみアサートする既存テストパターン
- **変更の影響チェーン:** `startNextHand` → `preparePreflopRound` → `postBlinds` / `dealHoleCards` / `getNextActivePlayerIndex`。`dealHoleCards` のデッキ消費量が変わるため、テストで固定デッキを使用している場合はデッキサイズの整合を確認すること
- **注意すべきアンチパターン:** `dealHoleCards` の修正で `i * 2` のインデックス計算をそのまま使うと、folded プレイヤー分のカードが飛ぶ。**カウンタ変数で非folded プレイヤーのみインクリメントすること**