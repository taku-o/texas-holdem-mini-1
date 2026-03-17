Now I have all the information needed. Let me compile my review findings.

---

## AI Antipattern Review — 判定: **REJECT**

### 概要

タスク 1.1〜1.4 に対応する実装をレビューしました。AI特有のパターンとして、**配線忘れ（ValidAction.min/max がUIに渡されているのに使われていない）**、**ロジックの重複**、**説明コメント**、および**バリデーションギャップ**を検出しました。

---

### ブロッキング問題

#### `finding_id: AI-WIRING-01` [new] — ActionBar が ValidAction.min/max を使用していない（配線忘れ + DRY違反 + 正確性の問題）

**ファイル:** `src/ui/ActionBar.tsx:29-35`

**問題:** タスク 1.4 の目的は「有効アクション取得時に、ベット/レイズの選択可能な額の範囲（min/max 等）を返すようにし、**UI がチップ入力の範囲として利用できるようにする**」だが、ActionBar は `validActions` に含まれる `min`/`max` を無視し、独自に `getMinBet()` / `getMinRaise()` を計算している。

さらに、**最低レイズ額の計算式が乖離**している:
- ドメイン（betting.ts:18）: `minRaiseTotal = state.currentBet + BIG_BLIND`
- UI（ActionBar.tsx:34）: `getMinRaise = currentBet * 2`

`currentBet = 30, BIG_BLIND = 10` の場合:
- ドメイン: min = 40
- UI: min = 60（**20 のズレ**）

**修正案:** `ActionBar` の `getMinBet()` / `getMinRaise()` / `getSliderProps()` を削除し、`validActions` から該当アクションの `min`/`max` を取得するように変更する:
```typescript
const betAction = validActions.find((a) => a.type === 'bet')
const raiseAction = validActions.find((a) => a.type === 'raise')
// slider の min/max は betAction.min/max または raiseAction.min/max から取得
```

---

#### `finding_id: AI-COMMENT-01` [new] — 説明コメント（What/How）

**ファイル:** `src/domain/betting.ts:43`

```typescript
// bet/raise は個別のバリデーションで検証するため、ここでは fold/check/call のみチェック
```

**問題:** 実装の「どうやっているか」を説明するコメント。ポリシーの REJECT 基準「説明コメント（What/How のコメント）」に該当。

**修正案:** このコメントを削除する。条件式 `action.type !== 'bet' && action.type !== 'raise'` とその後の個別バリデーションから意図は読み取れる。

---

#### `finding_id: AI-COMMENT-02` [new] — 説明コメント（What/How）

**ファイル:** `src/domain/betting.ts:138`

```typescript
// lastAggressor がオールイン → 全アクティブプレイヤーが currentBet に揃ったか
```

**問題:** 同上。実装の動作を日本語で繰り返しているだけの What コメント。

**修正案:** このコメントを削除する。直後の `return nonFolded.every(...)` から意図は明確。

---

#### `finding_id: AI-DRY-01` [new] — isBettingRoundComplete 内のコード重複

**ファイル:** `src/domain/betting.ts:139-141` と `src/domain/betting.ts:144-146`

```typescript
// 139-141行目（lastAggressor がオールインの場合）
return nonFolded.every(
  (p) => p.chips === 0 || p.currentBetInRound >= state.currentBet,
)

// 144-146行目（lastAggressorIndex === null の場合）
return nonFolded.every(
  (p) => p.chips === 0 || p.currentBetInRound >= state.currentBet,
)
```

**問題:** 完全に同一の式が 2 箇所に存在する DRY 違反。

**修正案:** 条件分岐を整理し、`lastAggressor` がアクティブ（folded でなく chips > 0）かつ `currentPlayerIndex === lastAggressorIndex` の場合のみ `true` を返し、それ以外は共通の `nonFolded.every(...)` に統一する:

```typescript
export function isBettingRoundComplete(state: GameState): boolean {
  const nonFolded = state.players.filter((p) => !p.folded)
  if (nonFolded.length <= 1) return true

  if (state.lastAggressorIndex !== null) {
    const aggressor = state.players[state.lastAggressorIndex]
    if (!aggressor.folded && aggressor.chips > 0) {
      return state.currentPlayerIndex === state.lastAggressorIndex
    }
  }

  return nonFolded.every(
    (p) => p.chips === 0 || p.currentBetInRound >= state.currentBet,
  )
}
```

---

#### `finding_id: AI-VALIDATION-GAP-01` [new] — applyAction が bet/raise のアクション種別の妥当性を検証しない

**ファイル:** `src/domain/betting.ts:44`

```typescript
if (action.type !== 'bet' && action.type !== 'raise') {
  const validActions = getValidActions(state, playerIndex)
  if (!validActions.some((a) => a.type === action.type)) {
    throw new Error(`Invalid action: ${action.type}`)
  }
}
```

**問題:** bet/raise は `getValidActions` によるアクション種別の妥当性チェックをバイパスしている。amount のバリデーションのみ行われ、アクション種別自体の妥当性は検証されない。例えば `currentBet > 0` のときに `bet`（本来は `raise` であるべき）を送信しても、amount が有効なら通ってしまう。

**修正案:** 全アクション種別で `getValidActions` チェックを通し、bet/raise については追加で amount バリデーションを行う:

```typescript
const validActions = getValidActions(state, playerIndex)
if (!validActions.some((a) => a.type === action.type)) {
  throw new Error(`Invalid action: ${action.type}`)
}
// bet/raise の追加バリデーション（amount 範囲チェック）は現状のまま switch 内で実施
```

---

### 非ブロッキング（参考情報）

#### `finding_id: AI-INFO-01` [new] — cpuStrategy の calculateBetAmount が raiseTotal として不正な値を返しうる

**ファイル:** `src/domain/cpuStrategy.ts:67-76`（変更対象外ファイル）

`calculateBetAmount` は `playerChips` を上限とした値を返すが、`currentBetInRound` を考慮していない。チップが少なく `currentBetInRound > 0` のとき、返却値が `currentBetInRound` 未満になり `raiseAmount` が負になりうる。タスク 5.1 で対応予定と理解しているため、記録のみ。

---

### 判定根拠

| finding_id | 状態 | 分類 |
|---|---|---|
| AI-WIRING-01 | new | ブロッキング（配線忘れ + DRY違反 + 正確性の問題） |
| AI-COMMENT-01 | new | ブロッキング（説明コメント） |
| AI-COMMENT-02 | new | ブロッキング（説明コメント） |
| AI-DRY-01 | new | ブロッキング（DRY違反） |
| AI-VALIDATION-GAP-01 | new | ブロッキング（今回の変更で導入されたバリデーションギャップ） |
| AI-INFO-01 | new | 非ブロッキング（変更対象外ファイル） |

ブロッキング問題が 5 件あるため、**REJECT** とします。