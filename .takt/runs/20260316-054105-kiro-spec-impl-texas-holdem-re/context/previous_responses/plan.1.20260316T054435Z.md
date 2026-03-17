分析が完了しました。以下が計画レポートです。

---

## 計画レポート: タスク 5 — CPU のレイズ額がルール上有効になるようにする

### タスク概要

**対象タスク**: 5.1 — CPU がレイズを選んだ場合、レイズ額が `currentBet`（またはコールに必要な額）以上となるようにする  
**要件**: 6（CPU のレイズ額）

### 問題分析

**バグの原因**: `calculateBetAmount` 関数が `getValidActions` の返す `min`/`max` 範囲を考慮せずに金額を算出している。

具体的な不整合:

1. **`playerChips` でキャップしているが、raise の `amount` は `raiseTotal`（= `currentBetInRound + 支払額`）として解釈される**  
   - `calculateBetAmount` は `Math.min(..., playerChips)` で上限を設ける（`cpuStrategy.ts:75`）
   - しかし `applyAction` では `raiseTotal = action.amount`、`raiseAmount = raiseTotal - player.currentBetInRound` と解釈される（`betting.ts:90-91`）
   - 正しい上限は `player.currentBetInRound + player.chips`（= `getValidActions` の `maxRaiseTotal`、`betting.ts:24`）

2. **最低レイズ額を保証していない**  
   - `getValidActions` は `min: currentBet + BIG_BLIND` を返す（`betting.ts:21-25`）
   - `calculateBetAmount` はこの `min` を参照せず、BIG_BLIND 倍数へのアライメントで `minRaiseTotal` を下回る可能性がある

**再現シナリオ例**:
- `player.currentBetInRound = 10`, `player.chips = 30`, `currentBet = 25`, `BIG_BLIND = 10`
- `getValidActions`: raise の `min = 35`, `max = 40`
- `calculateBetAmount('strong', 30, 25)`: `rawAmount = max(30, 50) = 50` → `aligned = 50` → `min(50, 30) = 30`
- CPU が `{ type: 'raise', amount: 30 }` を返す → `applyAction` で `30 < minRaise(35)` → **エラー**

### 変更方針

**変更ファイル**: `src/domain/cpuStrategy.ts`（1ファイルのみ）

**アプローチ**: `decideAction` 内で `calculateBetAmount` の結果を `ValidAction` の `min`/`max` でクランプする

#### 変更内容

`decideAction` 関数内で、bet/raise アクションを返す全箇所（計4箇所）で、`calculateBetAmount` の結果を該当する `ValidAction` の `min`/`max` でクランプする。

**変更箇所一覧**（`cpuStrategy.ts`）:

| 行 | 現状 | 修正内容 |
|----|------|----------|
| 100-101 | strong: `calculateBetAmount` → そのまま bet に使用 | bet の `ValidAction` から min/max を取得してクランプ |
| 102 | strong: `calculateBetAmount` → そのまま raise に使用 | raise の `ValidAction` から min/max を取得してクランプ |
| 110-111 | medium: `calculateBetAmount` → raise/bet に使用 | 同上 |
| 121 | weak: `calculateBetAmount` → bet に使用 | 同上 |

**具体的な実装パターン**:

```typescript
// 例: raise の場合
const raiseAction = validActions.find(a => a.type === 'raise')
if (canRaise && raiseAction) {
  const desired = calculateBetAmount(strength, player.chips, state.currentBet)
  const amount = Math.max(raiseAction.min!, Math.min(desired, raiseAction.max!))
  return { type: 'raise', amount }
}
```

bet も同様に:
```typescript
const betAction = validActions.find(a => a.type === 'bet')
if (canBet && betAction) {
  const desired = calculateBetAmount(strength, player.chips, state.currentBet)
  const amount = Math.max(betAction.min!, Math.min(desired, betAction.max!))
  return { type: 'bet', amount }
}
```

**`calculateBetAmount` 関数自体は変更しない**。この関数は「希望額」を算出する役割として残し、実際の有効範囲へのクランプは呼び出し側で行う。

### 実装ガイドライン（Coder向け）

#### 参照すべき既存実装パターン
- `getValidActions` の返却型 `ValidAction` の `min`/`max` フィールド: `betting.ts:21-25`（raise）, `betting.ts:13-14`（bet）
- `calculateBetAmount` の現在の実装: `cpuStrategy.ts:67-76`
- `decideAction` 内の bet/raise を返す全箇所: `cpuStrategy.ts:100-102`, `110-111`, `121`

#### 変更の影響範囲
- **変更ファイル**: `src/domain/cpuStrategy.ts` のみ
- **テストファイル**: `src/domain/cpuStrategy.test.ts` にテストケース追加
- `calculateBetAmount` のシグネチャは変更しないため、他への影響なし
- `decideAction` のシグネチャも変更なし（`PlayerAction` を返す）

#### 追加すべきテストケース
- **ショートスタックでの raise クランプ**: `currentBetInRound > 0` かつ `chips` が少ない状態で、raise の `amount` が `getValidActions` の `min` 以上 `max` 以下に収まること
- **raise 額が minRaise 未満にならないこと**: `calculateBetAmount` の結果が `minRaiseTotal` 未満になるケースで、クランプにより `minRaiseTotal` に切り上げられること
- **bet 額のクランプ**: bet でも `ValidAction` の `min`/`max` 範囲内であること

#### 注意すべきアンチパターン
- `validActions` から `find` で取得した `ValidAction` の `min`/`max` は bet/raise 以外では `undefined`。`canBet`/`canRaise` のガードの内側でのみアクセスすること
- `calculateBetAmount` に min/max を引数として追加する案は、関数の責務（「希望額の算出」）と「有効範囲へのクランプ」が混在するため避ける