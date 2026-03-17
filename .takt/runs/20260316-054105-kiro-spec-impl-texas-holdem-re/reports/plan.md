# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 5` — タスク5「CPU のレイズ額がルール上有効になるようにする」の実装

## 分析結果

### 目的
CPU がレイズを選択した場合に、返す `amount` が `getValidActions` の返す有効範囲（`min`〜`max`）内に収まるようにし、`applyAction` のバリデーションを通過することを保証する。

### スコープ
- **変更ファイル**: `src/domain/cpuStrategy.ts`（1ファイルのみ）
- **テストファイル**: `src/domain/cpuStrategy.test.ts`（テストケース追加）
- 他ファイルへの影響なし（シグネチャ変更なし）

### バグの原因

`calculateBetAmount`（`cpuStrategy.ts:67-76`）が `getValidActions` の `min`/`max` を参照せずに金額を算出している。

**不整合1: 上限の誤り**
- `calculateBetAmount` は `Math.min(..., playerChips)` でキャップする（L75）
- しかし raise の `amount` は `raiseTotal`（= `currentBetInRound + 支払額`）として `applyAction` に解釈される（`betting.ts:90-91`）
- 正しい上限は `currentBetInRound + chips`（= `getValidActions` の `maxRaiseTotal`、`betting.ts:24`）

**不整合2: 下限の未保証**
- `getValidActions` は raise に `min: currentBet + BIG_BLIND` を返す（`betting.ts:21`）
- `calculateBetAmount` はこの `min` を参照しておらず、BIG_BLIND 倍数アライメントで `min` を下回りうる

**再現シナリオ**:
- `player.currentBetInRound = 10`, `player.chips = 30`, `currentBet = 25`, `BIG_BLIND = 10`
- `getValidActions`: raise `min = 35`, `max = 40`
- `calculateBetAmount('strong', 30, 25)` → `rawAmount = max(30, 50) = 50` → `aligned = 50` → `min(50, 30) = 30`
- CPU が `{ type: 'raise', amount: 30 }` を返す → `30 < minRaise(35)` → **バリデーションエラー**

### 検討したアプローチ
| アプローチ | 採否 | 理由 |
|-----------|------|------|
| A. `calculateBetAmount` に min/max 引数を追加して内部でクランプ | 不採用 | 関数の責務（「希望額の算出」）と「有効範囲のクランプ」が混在する |
| B. `decideAction` 内で `ValidAction` の min/max を使い呼び出し後にクランプ | **採用** | 責務分離が明確。`calculateBetAmount` は変更不要。影響最小 |

### 実装アプローチ

`decideAction` 関数内で bet/raise アクションを返す全4箇所で、`calculateBetAmount` の結果を該当 `ValidAction` の `min`/`max` でクランプする。

**変更箇所**（`cpuStrategy.ts`）:

| 箇所 | 行 | 内容 |
|------|-----|------|
| strong → bet | L100-101 | `validActions` から bet の min/max を取得してクランプ |
| strong → raise | L102 | `validActions` から raise の min/max を取得してクランプ |
| medium → raise/bet | L110-111 | 同上 |
| weak → bet | L121 | 同上 |

**実装パターン**:
```typescript
// raise の場合
const raiseAction = validActions.find(a => a.type === 'raise')
if (canRaise && raiseAction) {
  const desired = calculateBetAmount(strength, player.chips, state.currentBet)
  const amount = Math.max(raiseAction.min!, Math.min(desired, raiseAction.max!))
  return { type: 'raise', amount }
}

// bet の場合も同様に betAction の min/max でクランプ
```

## 実装ガイドライン

- **参照すべき既存パターン**: `getValidActions` が返す `ValidAction` の `min`/`max`（`betting.ts:13-14` bet、`betting.ts:21-25` raise）
- **全4箇所を漏れなく修正すること**: L100-101（strong/bet）、L102（strong/raise）、L110-111（medium/raise,bet）、L121（weak/bet）
- **`calculateBetAmount` は変更しない**: 希望額算出の責務はそのまま維持し、クランプは `decideAction` 内で行う
- **`validActions` の `find` は `canBet`/`canRaise` ガード内で行う**: `min`/`max` は bet/raise 以外では `undefined` のため、ガード外でアクセスしない
- **注意: 重複コードの扱い**: 4箇所で同じクランプパターンが繰り返されるため、ヘルパー関数（例: `clampAmount(desired, validAction)`）の抽出を検討してよい。ただし `cpuStrategy.ts` 内のプライベート関数とする

### 追加すべきテストケース
1. **`currentBetInRound > 0` でのレイズ額クランプ**: raise の `amount` が `getValidActions` の `[min, max]` 範囲内に収まること
2. **raise 額が minRaise を下回らないこと**: `calculateBetAmount` の結果が `minRaiseTotal` 未満になるケースで、クランプにより切り上げられること
3. **`applyAction` を通過すること**: CPU の返すアクションを `applyAction` に渡してエラーにならないことの結合的検証