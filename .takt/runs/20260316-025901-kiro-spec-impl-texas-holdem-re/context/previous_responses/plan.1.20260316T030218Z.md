十分な調査ができました。計画をまとめます。

---

## 計画レポート: タスク1「ベッティングのバリデーションとラウンド終了・有効アクション返却の修正」

### タスク概要

タスク1（サブタスク1.1〜1.4）は、`betting.ts` のベッティングバリデーション強化・ラウンド終了判定の修正・有効アクション返却形式の改善を行う。要件 1, 2, 8 に対応する。

---

### 要件と変更要否の判定

#### 1.1 ベット・レイズ時の amount バリデーション（要件 1）
- **変更要**
- 現行コード（`betting.ts:60-85`）: `applyAction` の `bet` / `raise` 処理で `action.amount` をそのまま使用。`player.chips` を超える額のチェックがない。`bet` では `player.chips -= betAmount` が負になりうる（60-70行）。`raise` では `player.chips -= raiseAmount` が負になりうる（73-85行）。
- 必要な変更: `bet` 時に `amount <= player.chips` を検証、`raise` 時に `raiseAmount <= player.chips`（= `amount - player.currentBetInRound <= player.chips`）を検証。最低レイズ額（`currentBet + BIG_BLIND` 以上、またはオールイン）も検証する。違反時は throw でエラーを返し状態を更新しない。

#### 1.2 レイズ可否判定に「コール額+最低レイズ額」のチェック追加（要件 1）
- **変更要**
- 現行コード（`betting.ts:3-23`）: `getValidActions` でレイズ可否を判定する際、チップ残高のチェックがない。`currentBet` を超えるベットが出ている場合でも無条件に `raise` を返す（18-19行）。`currentBet === 0` で `bet` を出す場合もチップ残高を見ていない（12-13行）。
- 必要な変更: `raise` を返す条件に「`player.chips > callAmount`（コール額を支払った上でさらに追加できる）」を追加。最低レイズ額（`currentBet + BIG_BLIND - player.currentBetInRound`）を支払えない場合は `raise` を返さない。`bet` も同様に `player.chips >= BIG_BLIND`（最小ベット）を満たす場合のみ返す。

#### 1.3 ベッティングラウンド終了判定の修正（要件 2）
- **変更要**
- 現行コード（`betting.ts:100-111`）: `isBettingRoundComplete` は `lastAggressorIndex !== null` の場合、`currentPlayerIndex === lastAggressorIndex` で終了判定する（104-105行）。一方、`getNextActivePlayerIndex`（113-127行）は `!p.folded && p.chips > 0` をアクティブ条件とする（121行）。lastAggressor がオールイン（chips=0）の場合、`getNextActivePlayerIndex` がその席をスキップするため、`currentPlayerIndex` が `lastAggressorIndex` に一致することがなく無限ループになる。
- 必要な変更: 終了条件を「lastAggressor がアクティブでない場合は、全アクティブプレイヤーが currentBet に揃った時点で終了」とする。具体的には、`lastAggressorIndex` のプレイヤーが `chips === 0` の場合、lastAggressor に依存せず「全非フォールドプレイヤーが `currentBetInRound >= currentBet` または `chips === 0`」で終了判定する。

#### 1.4 有効アクション取得時にベット/レイズの額の範囲を返す（要件 8）
- **変更要**
- 現行コード（`betting.ts:3-23`）: `getValidActions` は `PlayerAction[]` を返すが、`bet` / `raise` に `amount` や `min/max` を含めていない。UI 側（`ActionBar.tsx:29-35`）が独自に `getMinBet()` / `getMinRaise()` を計算しており、ドメインロジックの重複がある。
- 必要な変更: `getValidActions` が `bet` / `raise` を返す際に `min` / `max` を付与する。新しい返却型として `ValidAction` 型を導入する。

---

### 設計

#### 型の変更

**新規型: `ValidAction`**（`types.ts` に追加）

```typescript
export type ValidAction = {
  type: ActionType
  min?: number  // bet/raise の場合のみ
  max?: number  // bet/raise の場合のみ
}
```

`getValidActions` の返却型を `PlayerAction[]` → `ValidAction[]` に変更する。

**影響範囲:**
- `getValidActions` の呼び出し元:
  - `betting.ts:30` — `applyAction` 内でアクションタイプの検証に使用（`.type` のみ参照 → 影響なし）
  - `cpuStrategy.ts:84` — `decideAction` 内で validTypes を取得（`.type` のみ参照 → 影響なし）
  - `useGameController.ts:41` — `validActions` として UI に渡す → 型を `ValidAction[]` に変更
  - `testHelpers.ts:31` — `executeAllCallCheck` で `.type` のみ参照 → 影響なし
  - `src/domain/gameEngine.ts:3` — re-export → 型を更新
- `ActionBar.tsx:5` の `ActionBarProps.validActions` — `PlayerAction[]` → `ValidAction[]` に変更。`getMinBet()` / `getMinRaise()` の独自計算を、`ValidAction` の `min/max` に置き換える。
- `cpuStrategy.ts` — `calculateBetAmount` が返す額が `ValidAction.min` 以上になるよう整合させる（タスク5.1で対応予定だが、タスク1で `getValidActions` の返却にmin/maxが入ることで影響しうる点をコメントとして記載）

#### `betting.ts` の変更

1. **`getValidActions` の修正:**
   - 返却型: `ValidAction[]`
   - `bet` を返す条件: `player.chips >= BIG_BLIND`（最小ベット以上のチップがある場合）。`min = BIG_BLIND`, `max = player.chips`
   - `raise` を返す条件: 
     - コール額: `callAmount = currentBet - player.currentBetInRound`
     - 最小レイズ総額: `minRaise = currentBet + BIG_BLIND`
     - 実際に必要なチップ: `minRaise - player.currentBetInRound`
     - 条件: `player.chips > callAmount`（コールして余りがある場合のみ）
     - `min = Math.max(currentBet + BIG_BLIND, player.currentBetInRound + 1)` → 正確には `min = currentBet + BIG_BLIND`、`max = player.currentBetInRound + player.chips`
   - チップが `callAmount` ちょうどしかない場合は `call` のみ（オールインコール）で `raise` は不可

2. **`applyAction` のバリデーション追加:**
   - `bet` 時:
     - `amount` が未定義なら throw（既存）
     - `amount < BIG_BLIND` かつ `amount < player.chips`（オールイン以外で最小ベット未満）なら throw
     - `amount > player.chips` なら throw
   - `raise` 時:
     - `amount` が未定義なら throw（既存）
     - `raiseAmount = amount - player.currentBetInRound`
     - `raiseAmount > player.chips` なら throw
     - `amount < currentBet + BIG_BLIND` かつ `amount < player.currentBetInRound + player.chips`（オールイン以外で最小レイズ未満）なら throw
   - **注意**: オールインの場合は最小ベット/レイズ未満でも許可する（チップ全額を出す場合）

3. **`isBettingRoundComplete` の修正:**
   - `lastAggressorIndex !== null` の場合:
     - lastAggressor が「アクティブ」（`!folded && chips > 0`）なら、既存どおり `currentPlayerIndex === lastAggressorIndex` で終了
     - lastAggressor がアクティブでない（`chips === 0` = オールイン）なら、「全非フォールドかつ chips > 0 のプレイヤーが `currentBetInRound >= currentBet`」で終了判定
   - `lastAggressorIndex === null` の場合: 既存どおり

#### ファイル構成

変更対象ファイル:
1. `src/domain/types.ts` — `ValidAction` 型の追加
2. `src/domain/betting.ts` — `getValidActions`, `applyAction`, `isBettingRoundComplete` の修正
3. `src/domain/gameEngine.ts` — re-export の型更新（`ValidAction` のエクスポート追加）
4. `src/application/useGameController.ts` — `validActions` の型を `ValidAction[]` に変更
5. `src/ui/ActionBar.tsx` — `validActions` の型変更、`getMinBet`/`getMinRaise` のドメインロジック削除

全ファイル200行以下を維持する見込み。

---

### Coder向け実装ガイドライン

#### 参照すべき既存実装パターン

- **テスト**: `src/domain/betting.test.ts` — 既存テストの構造（Given/When/Then コメント、`createTestState` / `createTestPlayer` の使い方）に合わせてテストを追加する
- **アクション検証**: `betting.ts:30-33` — 既存の `validActions.some(a => a.type === action.type)` の型チェックパターン
- **コール時のオールイン**: `betting.ts:50-57` — `Math.min(callAmount, player.chips)` でオールインを処理するパターン。ベット/レイズでも同様にオールインを考慮する
- **ActionBar の min/max**: `ActionBar.tsx:29-35`, `73-78` — 現在の `getMinBet`/`getMinRaise`/`getSliderProps` のロジックが、`getValidActions` の `min/max` に移動する

#### 変更の影響範囲と配線箇所

`ValidAction` 型の導入により以下の配線が必要:
1. `types.ts` — 型定義追加
2. `betting.ts` — 返却型変更
3. `gameEngine.ts:3` — re-export に `ValidAction` 追加
4. `useGameController.ts:9,41` — `validActions` の型を `ValidAction[]` に
5. `ActionBar.tsx:5-6` — props の型変更、`getMinBet`/`getMinRaise` を `validActions` の `min/max` から取得に変更
6. `cpuStrategy.ts:84` — 現時点では `.type` のみ参照しているため変更不要だが、`ValidAction` 型の import が必要になる可能性がある（`.map(a => a.type)` は `ValidAction` でも動作するため、import 変更は不要）
7. `ActionBar.test.tsx` — テストで渡す `validActions` の型を `ValidAction[]` に更新
8. テストファイル全般 — `getValidActions` の返却値の型が変わるため、`.type` 以外を参照しているテストがあれば更新

#### 注意すべきアンチパターン

1. **オールイン時の例外処理を忘れない**: ベット/レイズのバリデーションで「最小額未満」を一律拒否すると、オールイン（チップ全額だが最小額に満たない）が不可能になる。「チップ全額 = オールイン」は常に許可する設計にする
2. **`isBettingRoundComplete` の修正で新たな無限ループを作らない**: 修正後もテストヘルパー `executeAllCallCheck` / `executeAllCheck`（`testHelpers.ts`）が正常終了することを確認する
3. **UI のドメインロジック重複**: `ActionBar.tsx` の `getMinBet`/`getMinRaise` は `getValidActions` の `min/max` で置き換え、重複を排除する。ただし `getSliderProps` のような UI 表示用の変換は ActionBar に残してよい
4. **`applyAction` のバリデーション追加時に既存テストを壊さない**: 既存テスト（`betting.test.ts:189`, `214`）で `amount: 20` や `amount: 30` を渡しているが、これらが新しいバリデーション（最小額チェック等）を通過するか確認する。`BIG_BLIND = 10` なので `amount: 20`（ベット）は `>= BIG_BLIND` で通過、`amount: 30`（レイズ、`currentBet=10`）は `>= currentBet + BIG_BLIND = 20` で通過する → OK