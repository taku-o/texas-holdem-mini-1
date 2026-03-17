Good. Now I have confirmed the logical relationship. Let me compile the review.

---

## AI Antipattern Review — `src/domain/cpuStrategy.ts`

### 判定: **REJECT**

ブロッキング問題が3件あります。

---

### ブロッキング問題

#### `AI-COMMENT-001` [new] — 説明コメント（What/How コメント）

**ファイル**: `src/domain/cpuStrategy.ts`
**該当行**: 50-52, 77, 119, 135

コードの動作をそのまま言い換えているだけのコメントが複数存在します。switch 文のケースや変数名から読み取れる内容であり、不要です。

| 行 | コメント | 問題 |
|---|---|---|
| 50-52 | `// three-of-a-kind 以上 → strong` / `// one-pair, two-pair → medium` / `// high-card → weak` | switch の case ラベルがそのまま同じ情報を持っている（What） |
| 77 | `// BIG_BLIND の倍数に切り下げ` | 次の行 `Math.floor(rawAmount / BIG_BLIND) * BIG_BLIND` が同じことを表現している（How） |
| 119 | `// 積極的` | 分岐の内容を一言でラベリングしているだけ（What） |
| 135 | `// weak` | `if (strength === 'medium')` の else 分岐であることから自明（What） |

**修正案**: 上記コメントを全て削除してください。行137 の `// タダで見られるならチェック` は「なぜチェックを優先するか」の理由を示しており、Why コメントとして適切なので残して問題ありません。

---

#### `AI-DRY-001` [new] — `calculateBetAmount` の重複呼び出し（DRY 違反）

**ファイル**: `src/domain/cpuStrategy.ts`
**該当行**: 106+110, 122+126

同一ブロック内で、全く同じ引数の `calculateBetAmount(strength, player.chips, state.currentBet)` が `canBet` / `canRaise` の分岐それぞれで呼ばれています。`amount` を一度だけ計算してから分岐すれば重複が解消します。

```typescript
// 現在（strong ブロック 104-116）
if (strength === 'strong') {
    if (canBet) {
      const amount = calculateBetAmount(strength, player.chips, state.currentBet) // ← 1回目
      return { type: 'bet', amount }
    }
    if (canRaise) {
      const amount = calculateBetAmount(strength, player.chips, state.currentBet) // ← 2回目（同一引数）
      return { type: 'raise', amount }
    }
    ...
}

// 修正案
if (strength === 'strong') {
    const amount = calculateBetAmount(strength, player.chips, state.currentBet)
    if (canBet) return { type: 'bet', amount }
    if (canRaise) return { type: 'raise', amount }
    ...
}
```

medium ブロック（行 118-133）の行 122+126 も同様に修正してください。

---

#### `AI-DEAD-001` [new] — 冗長な条件 `costToCall > 0` と未使用変数 `costToCall`

**ファイル**: `src/domain/cpuStrategy.ts`
**該当行**: 96, 145

行 145 の `costToCall > 0` は論理的に常に真です。

**根拠**: `betting.ts:10` で `player.currentBetInRound >= state.currentBet` の場合のみ `check` が有効アクションに含まれます。`cpuStrategy.ts:136` で `canCheck` が `false` の場合にのみ行 145 に到達するため、この時点で必ず `player.currentBetInRound < state.currentBet`、すなわち `costToCall > 0` が成立します。

これは AI が「念のため」追加する典型的な防御コードです。

**修正案**:
1. 行 145 の条件を `if (roll < 0.3)` に簡略化する
2. 行 96 の `costToCall` 変数宣言を削除する（他に使用箇所がないため未使用変数になる）

```typescript
// 現在
const costToCall = state.currentBet - player.currentBetInRound  // 行 96
...
if (costToCall > 0 && roll < 0.3) {  // 行 145

// 修正案
// 行 96 を削除
...
if (roll < 0.3) {  // 行 145（簡略化）
```

---

### 非ブロッキング（参考情報）

#### 設計仕様との署名差異

設計書 (`design.md:367`) では `decideAction(state: GameState, playerId: string): PlayerAction` と定義されていますが、実装は `decideAction(state: GameState, playerIndex: number, randomFn: () => number)` です。`playerIndex` への変更はコードベースの他の関数（`getValidActions` 等）と整合しており合理的です。`randomFn` の追加もテスタビリティのための妥当な判断です。設計書側を更新すべきですが、タスク5.1のスコープ外として記録のみとします。