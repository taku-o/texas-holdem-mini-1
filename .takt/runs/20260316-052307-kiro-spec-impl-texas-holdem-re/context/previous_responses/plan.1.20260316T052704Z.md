全ての情報が揃いました。以下に計画をまとめます。

---

## 計画レポート: タスク4 - チップ0プレイヤーの次ハンド除外

### タスク概要

| サブタスク | 内容 | 要件 |
|-----------|------|------|
| 4.1 | 1ハンド終了後にチップが0のプレイヤーを次ハンドに参加させない | Req 5 |
| 4.2 | 次ハンドのディーラー・席順・ブラインドの計算でチップ0プレイヤーをスキップ | Req 5 |

### 要件ごとの変更要/不要の判定

| 要件 | 判定 | 根拠 |
|------|------|------|
| 4.1: チップ0を次ハンドに参加させない | **変更要** | `handProgression.ts:83` で全プレイヤーの `folded` を `false` にリセットしており、チップ0プレイヤーも次ハンドに参加する状態になる |
| 4.1 補足: ホールカード配布 | **変更要** | `dealing.ts:41-44` で全プレイヤーにカードを配っており、チップ0プレイヤーにもカードが配られる |
| 4.2: ディーラーのスキップ | **変更不要** | `handProgression.ts:68-71` の `getNextDealerIndex` → `findNextEligibleIndex`（`dealing.ts:12`）が `chips > 0` で判定済み |
| 4.2: ブラインドのスキップ | **変更不要** | `dealing.ts:20-21` の `postBlinds` が `findNextEligibleIndex` で SB/BB を決定し、`chips > 0` のプレイヤーのみ対象 |
| 4.2: アクション順のスキップ | **変更不要** | `betting.ts:145` の `getNextActivePlayerIndex` が `!player.folded && player.chips > 0` でフィルタ済み |

### 実装アプローチ

**方針: Approach A（型変更なし・`folded` フラグの活用）**

設計ドキュメント（design.md:130）の方針Aを採用する。`Player` 型に新しいフィールドを追加せず、チップ0プレイヤーを `folded: true` のまま維持することで既存のフィルタリングロジック（`!player.folded && player.chips > 0`）がそのまま機能する。

**理由:**
- 下流の全フィルタリングが既に `chips > 0` または `!player.folded` で正しく動作している
- 型変更なしで影響範囲が最小
- 既存テストの期待値（`handProgression.test.ts:293-294`）も `player.chips > 0` の場合のみチェックしており、整合する

### 変更対象ファイルと具体的な変更内容

#### 1. `src/domain/handProgression.ts` — `startNextHand()` (行80-85)

**現在のコード:**
```typescript
const players = state.players.map((p) => ({
  ...p,
  holeCards: [] as Card[],
  folded: false,
  currentBetInRound: 0,
}))
```

**変更内容:**
- `folded` を `p.chips === 0` に変更する（チップ0のプレイヤーは `folded: true` を維持）
- チップ0プレイヤーの `holeCards` は空配列のまま

```typescript
const players = state.players.map((p) => ({
  ...p,
  holeCards: [] as Card[],
  folded: p.chips === 0,
  currentBetInRound: 0,
}))
```

#### 2. `src/domain/dealing.ts` — `dealHoleCards()` (行40-47)

**現在のコード:**
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

**問題:** `i * 2` で全プレイヤーに2枚ずつ配るため、チップ0（folded）プレイヤーにもカードが配られ、デッキカードが無駄に消費される。

**変更内容:**
- フォールド済み（チップ0）プレイヤーにはカードを配らない
- デッキの消費量をアクティブプレイヤー数に基づく

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

### 影響範囲の確認（変更不要の箇所）

以下は既存コードで正しく動作しており、変更不要であることを確認済み:

| モジュール | 関数 | フィルタ条件 | 状況 |
|-----------|------|------------|------|
| `gameFlow.ts:14` | `getNonFoldedCount` | `!p.folded` | chip-0は folded=true なのでカウントされない ✓ |
| `gameFlow.ts:18-19` | `canAnyoneStillBet` | `!p.folded && p.chips > 0` | 二重にフィルタ ✓ |
| `betting.ts:121` | `isBettingRoundComplete` | `!p.folded` | chip-0は除外される ✓ |
| `betting.ts:145` | `getNextActivePlayerIndex` | `!player.folded && player.chips > 0` | 二重にフィルタ ✓ |
| `showdown.ts:12` | `determineWinners` | `players[i].folded` | foldedをスキップ ✓ |
| `showdown.ts:49` | `resolveUncontestedPot` | `!p.folded` | foldedをスキップ ✓ |
| `ui/PlayerSeats.tsx:22` | 表示制御 | `!player.folded` | foldedは非表示 ✓ |

### Coder向け実装ガイドライン

1. **参照すべき既存パターン:**
   - `dealing.ts:4-16` の `findNextEligibleIndex` — `chips > 0` によるプレイヤーフィルタリングのパターン
   - `betting.ts:145` の `getNextActivePlayerIndex` — `!player.folded && player.chips > 0` の二重条件フィルタパターン
   - `handProgression.test.ts:257-273` — チップ0プレイヤーのスキップテストの既存パターン
   - `handProgression.test.ts:292-298` — `player.chips > 0` の場合のみアサートする既存テストパターン

2. **変更の影響範囲:**
   - `handProgression.ts` の `startNextHand` → `preparePreflopRound` → `postBlinds`/`dealHoleCards`/`getNextActivePlayerIndex` の呼び出しチェーン
   - `dealHoleCards` のデッキ消費量変更により、テストで固定デッキを使用している場合はデッキサイズが足りなくなる可能性がある。テストヘルパーを確認すること

3. **注意すべきアンチパターン:**
   - `dealHoleCards` の修正で `i * 2` のインデックス計算をそのまま使うと、folded プレイヤー分のカードが飛ぶ。**カウンタ変数で非folded プレイヤーのみインクリメントすること**
   - `getNonFoldedCount`（`gameFlow.ts:14`）は `!p.folded` のみでフィルタしている。chip-0プレイヤーを `folded: true` にすることで「ハンド開始時点で非フォールド人数 = アクティブプレイヤー数」となる。これは正しい動作だが、もし将来 `folded` の意味が「自分でフォールドした」と「チップ0で参加不可」を区別する必要が出れば、その時に `isSittingOut` フラグの導入を検討する