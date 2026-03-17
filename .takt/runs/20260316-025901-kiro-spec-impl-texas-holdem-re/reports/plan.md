# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 1` — ベッティングのバリデーションとラウンド終了・有効アクション返却の修正（サブタスク1.1〜1.4）

## 分析結果

### 目的
`betting.ts` のベッティング処理を堅牢化する。具体的には：
- ベット/レイズ額が不正な場合に状態を更新せずエラーを返す（要件1）
- レイズ可否判定にチップ残高チェックを追加する（要件1）
- lastAggressor がオールインした場合にベッティングラウンドが終了しない無限ループを修正する（要件2）
- `getValidActions` がベット/レイズの選択可能な額範囲（min/max）を返すようにする（要件8）

### スコープ

| ファイル | 変更内容 |
|---------|---------|
| `src/domain/types.ts` | `ValidAction` 型の追加 |
| `src/domain/betting.ts` | `getValidActions`, `applyAction`, `isBettingRoundComplete` の修正 |
| `src/domain/gameEngine.ts` | `ValidAction` の re-export 追加 |
| `src/application/useGameController.ts` | `validActions` の型を `ValidAction[]` に変更 |
| `src/ui/ActionBar.tsx` | `validActions` の型変更、`getMinBet`/`getMinRaise` のドメインロジック削除 |
| `src/domain/betting.test.ts` | バリデーション・ラウンド終了・min/max のテスト追加 |
| `src/ui/ActionBar.test.tsx` | props の型変更に伴う更新 |

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| `getValidActions` の返却型を `PlayerAction[]` のまま `amount` にmin値を入れる | 不採用 | `amount` は「選択した額」であり、min/max の両方を表現できない。型の意味が曖昧になる |
| 新型 `ValidAction` を導入し `min/max` を持たせる | **採用** | bet/raise の選択可能範囲を型安全に表現でき、UI側のドメインロジック重複も解消できる |
| `isBettingRoundComplete` で lastAggressor を常に無視する | 不採用 | lastAggressor がアクティブな場合は既存の判定が正しい。アクティブかどうかで分岐する |
| `isBettingRoundComplete` で lastAggressor がオールインの場合のみフォールバックする | **採用** | 既存の正常ケースを壊さず、オールイン時の無限ループのみ修正できる |

### 実装アプローチ

#### 1. 型の追加（`types.ts`）

`ValidAction` 型を追加する：
```typescript
export type ValidAction = {
  type: ActionType
  min?: number  // bet/raise の場合のみ
  max?: number  // bet/raise の場合のみ
}
```

#### 2. `getValidActions` の修正（`betting.ts:3-23`）

返却型を `ValidAction[]` に変更し、bet/raise に min/max を付与する。

- **fold**: 常に含める（変更なし）
- **check**: `player.currentBetInRound >= currentBet` の場合（変更なし）
- **call**: `player.currentBetInRound < currentBet` の場合（変更なし）
- **bet**（`currentBet === 0` かつ `player.currentBetInRound >= currentBet`）:
  - 条件追加: `player.chips >= BIG_BLIND`（最小ベット以上のチップがある場合のみ）
  - `min = BIG_BLIND`, `max = player.chips`
- **raise**:
  - `callAmount = currentBet - player.currentBetInRound`
  - `minRaiseTotal = currentBet + BIG_BLIND`（最小レイズ総額）
  - `maxRaiseTotal = player.currentBetInRound + player.chips`（オールイン時の総額）
  - 条件追加: `player.chips > callAmount`（コール額を超えるチップがある場合のみ）
  - `min = minRaiseTotal`, `max = maxRaiseTotal`

**注意**: チップがコール額ちょうどの場合は call（オールインコール）のみ可能とし、raise は不可とする。

#### 3. `applyAction` のバリデーション追加（`betting.ts:25-98`）

`bet` / `raise` ケースの先頭にバリデーションを追加する：

- **bet 時**:
  - `amount > player.chips` → throw（チップ超過）
  - `amount < BIG_BLIND && amount < player.chips` → throw（オールイン以外で最小ベット未満）
- **raise 時**:
  - `raiseAmount = amount - player.currentBetInRound`
  - `raiseAmount > player.chips` → throw（チップ超過）
  - `amount < currentBet + BIG_BLIND && amount < player.currentBetInRound + player.chips` → throw（オールイン以外で最小レイズ未満）

**オールインの扱い**: `amount === player.chips`（bet）または `amount === player.currentBetInRound + player.chips`（raise）の場合は、最小額未満でも許可する。これによりショートスタックのオールインが可能になる。

#### 4. `isBettingRoundComplete` の修正（`betting.ts:100-111`）

```
if (lastAggressorIndex !== null) {
  const aggressor = players[lastAggressorIndex]
  if (!aggressor.folded && aggressor.chips > 0) {
    // lastAggressor がアクティブ → 既存ロジック
    return currentPlayerIndex === lastAggressorIndex
  }
  // lastAggressor がオールイン → 全アクティブプレイヤーが currentBet に揃ったか
  return nonFolded.every(
    p => p.chips === 0 || p.currentBetInRound >= currentBet
  )
}
```

これにより、lastAggressor がオールインでスキップされる場合でも有限回で true になる。

#### 5. 配線の変更

- `gameEngine.ts`: `ValidAction` を re-export に追加
- `useGameController.ts:9`: `validActions` の型を `ValidAction[]` に
- `ActionBar.tsx`: 
  - `ActionBarProps.validActions` を `ValidAction[]` に変更
  - `getMinBet()` / `getMinRaise()` を削除し、`validActions` から該当アクションの `min/max` を取得して `getSliderProps` に使用
  - `BIG_BLIND` の import を削除（ドメイン定数への直接依存を排除）

## 実装ガイドライン

### 参照すべき既存実装パターン

| パターン | ファイル:行 | 説明 |
|---------|-----------|------|
| テストの構造 | `betting.test.ts` 全体 | Given/When/Then コメント、`createTestState`/`createTestPlayer` の使い方 |
| コール時のオールイン | `betting.ts:50-57` | `Math.min(callAmount, player.chips)` パターン。ベット/レイズでも同様にオールインを考慮 |
| ActionBar の現在のmin/max | `ActionBar.tsx:29-35, 73-78` | `getMinBet`/`getMinRaise`/`getSliderProps` のロジックが `getValidActions` の min/max に移動する |

### 配線が必要な全箇所

`ValidAction` 型の導入に伴う変更箇所：
1. `src/domain/types.ts` — 型定義追加
2. `src/domain/betting.ts` — `getValidActions` の返却型変更、import追加
3. `src/domain/gameEngine.ts:3` — re-export に `ValidAction` 追加
4. `src/application/useGameController.ts:2,9,41` — import と型の更新
5. `src/ui/ActionBar.tsx:2,5` — import と props 型の更新、ドメインロジック削除
6. `src/ui/ActionBar.test.tsx` — テストで渡す `validActions` の型更新

**変更不要な呼び出し元**:
- `cpuStrategy.ts:84` — `.map(a => a.type)` のみ参照。`ValidAction` は `type` を持つため互換
- `testHelpers.ts:31` — `.find(a => a.type === 'call')` のみ参照。互換

### 注意すべきアンチパターン

1. **オールインの例外処理を忘れない**: バリデーションで「最小額未満」を一律拒否するとオールインが不可能になる。`amount === player.chips`（bet）/ `amount === player.currentBetInRound + player.chips`（raise）は常に許可する
2. **`isBettingRoundComplete` で新たな無限ループを作らない**: 修正後に `testHelpers.ts` の `executeAllCallCheck` / `executeAllCheck` が正常終了するか確認すること
3. **既存テストとの整合**: `betting.test.ts:189` の `amount: 20`（bet、`BIG_BLIND=10` なので有効）、`214` の `amount: 30`（raise、`currentBet=10` で `minRaise=20` なので有効）→ バリデーション通過を確認
4. **ActionBar のドメインロジック重複を排除する**: `getMinBet`/`getMinRaise` のロジックを `getValidActions` に集約し、ActionBar は渡された min/max をそのまま使う