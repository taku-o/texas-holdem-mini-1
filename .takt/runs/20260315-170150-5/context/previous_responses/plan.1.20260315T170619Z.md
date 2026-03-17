全ての参照資料を読み込みました。各タスクの詳細分析に基づいて計画を立てます。

---

## 計画レポート

### タスク概要
レビュー指摘の5件のコード重複を共通関数・ヘルパーの抽出で解消する。

---

### 1. debug_game.ts / debug_game2.ts / debug_game3.ts — 共通構造の抽出

#### 差分分析

| 要素 | debug_game.ts | debug_game2.ts | debug_game3.ts |
|------|-------------|---------------|---------------|
| 乱数関数 | seededRandom (seed=1) | `() => 0.5` | `() => 0.5` |
| チップ設定 | cpuChips=30, 残りを人間に | cpuChips=30, 残りを人間に | 人間=全体-5, CPU4=5, 他=0 |
| ハンド数 | 20 | 30 | 1（ループなし） |
| アクション選択 | call/check優先 | CPU: fold優先, Human: call/check | CPU: fold優先, Human: call/check（+ログ出力） |
| フェーズ進行 | advancePhase + check ループ | なし（uncontested pot のみ） | なし（uncontested pot のみ） |
| インポート | evaluateShowdown | evaluateShowdown, resolveUncontestedPot | resolveUncontestedPot |
| ログ形式 | 基本 | dealer付き | 詳細ステップログ |

#### 共通部分
1. **ベッティングラウンド実行ループ**: `while (!isBettingRoundComplete && guard < N)` — 全3ファイル共通
2. **CPUチップ配分セットアップ**: debug_game.ts と debug_game2.ts で同一ロジック
3. **ゲームオーバー判定 + ログ**: debug_game.ts と debug_game2.ts で同一パターン

#### 設計方針

新規ファイル `debug_common.ts`（ルートレベル、debug スクリプトと同階層）に以下を配置:

```typescript
// debug_common.ts

// アクション選択戦略の型
type ActionSelector = (
  state: GameState, 
  playerIdx: number, 
  actions: PlayerAction[]
) => PlayerAction | null

// ガードカウンター付きベッティングラウンド実行
function executeBettingRound(
  state: GameState, 
  selector: ActionSelector, 
  maxActions?: number  // デフォルト 20
): GameState

// CPUチップ再配分（debug_game.ts, debug_game2.ts共通パターン）
function setupCpuChips(state: GameState, cpuChips: number): GameState
```

**アクション選択戦略（コールバック）:**
- `callCheckSelector`: debug_game.ts 用（call → check 優先）
- `cpuFoldHumanCallSelector`: debug_game2.ts / debug_game3.ts 用（CPU fold優先、Human call/check）

**各スクリプトの変更:**
- `debug_game.ts`: `executeBettingRound`, `setupCpuChips`, `callCheckSelector` を使用。フェーズ進行ループは debug_game.ts 固有なのでそのまま維持（ただし内部のcheck ループは `executeBettingRound` に置換可能）
- `debug_game2.ts`: `executeBettingRound`, `setupCpuChips`, `cpuFoldHumanCallSelector` を使用
- `debug_game3.ts`: `executeBettingRound`, `cpuFoldHumanCallSelector` を使用。チップ設定は固有ロジックのためそのまま維持

#### 参照すべき既存パターン
- `debug_game.ts:28-37` — ベッティングラウンドループ
- `debug_game.ts:14-24` — CPUチップ配分
- `debug_game2.ts:27-43` — CPU fold/human call アクション選択

#### 注意点
- debug_game3.ts はログ出力が多く構造が異なるため、`executeBettingRound` のみ使用。ログはコールバックではなく呼び出し側に残す方がシンプル
- 各スクリプトの動作（出力結果）が変更前と完全に同一であることを確認する必要がある

---

### 2. gameEngine.integration.test.ts — facadeエクスポートテストの重複解消

#### 重複箇所
- `gameEngine.integration.test.ts:357-369` — `expectedExports` 配列
- `gameEngine.integration.test.ts:383-395` — `expectedExports` Set（同一内容）

#### 設計方針
`describe('facade エクスポート検証')` スコープ内で共通定数を1箇所定義:

```typescript
const EXPECTED_EXPORTS = [
  'setupNewGame', 'getValidActions', 'applyAction', 'isBettingRoundComplete',
  'evaluateShowdown', 'determineWinners', 'resolveUncontestedPot',
  'advancePhase', 'startNextHand', 'isGameOver', 'getActivePlayerCount',
]
```

- 1つ目のテスト: `EXPECTED_EXPORTS` をそのまま使用
- 2つ目のテスト: `new Set(EXPECTED_EXPORTS)` で使用

---

### 3. gameEngine.integration.test.ts — ベッティングラウンドループのコピペ解消

#### 重複箇所
`should preserve chip conservation across each phase` テスト内（`gameEngine.integration.test.ts:275-297`）で、フロップ・ターン・リバーの3箇所:

```typescript
current = advancePhase(current)
while (!isBettingRoundComplete(current)) {
  const playerIdx = current.currentPlayerIndex
  current = applyAction(current, playerIdx, { type: 'check' })
}
expect(current.players.reduce((sum, p) => sum + p.chips, 0) + current.pot).toBe(expectedTotal)
```

#### 設計方針
テストファイルのローカルヘルパー関数として抽出:

```typescript
/** フェーズを進め、全員チェックでベッティングラウンドを完了する */
function advanceAndCheckAll(state: GameState): GameState {
  let current = advancePhase(state)
  while (!isBettingRoundComplete(current)) {
    const playerIdx = current.currentPlayerIndex
    current = applyAction(current, playerIdx, { type: 'check' })
  }
  return current
}
```

3箇所を以下に置換:
```typescript
current = advanceAndCheckAll(current)
expect(calcTotalChips(current)).toBe(expectedTotal)  // タスク5と組み合わせ
```

**注意**: このヘルパーは `should handle multiple hands with dealer rotation` テスト（:122-135）と `should distribute pot to winner` テスト（:325-333）でも同じパターンが使われているため、同様に置換可能。ただしタスク指示書のスコープは「preserve chip conservation across each phase テスト」に限定されているため、他テストへの適用は Coder の判断に委ねる（同じファイル内なので適用して問題ない）。

---

### 4. useGameController.test.ts — ゲーム終了待ちループの重複解消

#### 重複箇所（5箇所）
- `useGameController.test.ts:279-289` — fold ループ（`isHumanTurn false` テスト）
- `useGameController.test.ts:306-316` — fold ループ（`reach game over` テスト）
- `useGameController.test.ts:330-340` — fold ループ（`empty validActions` テスト）
- `useGameController.test.ts:407-417` — fold ループ（`start fresh game` テスト）
- `useGameController.test.ts:440-451` — fold ループ（`reset gameOverReason` テスト）

同様のパターンが call で1箇所:
- `useGameController.test.ts:531-541` — call ループ（`all CPU eliminated` テスト）

#### 設計方針
テストファイルのローカルヘルパー関数:

```typescript
/** ゲーム終了（phase='idle'）まで指定アクションを繰り返す */
function waitForGameEnd(
  result: RenderHookResult<...>,  // 適切な型
  action: { type: 'fold' } | { type: 'call' },
  maxIterations = 500
): void {
  let iterations = 0
  while (result.current.gameState?.phase !== 'idle' && iterations < maxIterations) {
    act(() => {
      result.current.handleAction(action)
    })
    iterations++
  }
}
```

6箇所すべてを `waitForGameEnd(result, { type: 'fold' })` または `waitForGameEnd(result, { type: 'call' })` に置換。

#### 参照すべき型
- `renderHook` の戻り値型は `@testing-library/react` の `RenderHookResult`。引数の型は `useGameController` の戻り値型から推論させる（`ReturnType<typeof renderHook<ReturnType<typeof useGameController>>>` など）。実装時は明示的な型注釈なしで `result` パラメータの型推論に任せてよい。

---

### 5. チップ保存則チェックの繰り返し解消

#### 全使用箇所

**`+ current.pot` 付きパターン（calcTotalChips で置換対象）:**

| ファイル | 行 | 個数 |
|---------|-----|------|
| `gameEngine.integration.test.ts` | 69, 100, 200, 243, 273, 281, 289, 297, 304, 411 | 10 |
| `gameFlow.test.ts` | 100, 102, 139, 141, 226, 237, 444, 445, 456, 599, 606, 847 | 12 |
| `useGameController.test.ts` | 97, 167, 430, 509-510 | 4 |
| `gameSetup.test.ts` | 51 | 1 |

**`+ pot` なしパターン（ショーダウン後 pot=0）:**

| ファイル | 行 | 個数 |
|---------|-----|------|
| `showdown.test.ts` | 166, 240, 301 | 3 |
| `gameEngine.integration.test.ts` | 344 | 1 |

#### 設計方針

`src/domain/testHelpers.ts` に追加:

```typescript
/** ゲーム状態の全チップ合計を計算する（プレイヤーチップ + ポット） */
export function calcTotalChips(state: GameState): number {
  return state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot
}
```

**配置理由**: `testHelpers.ts` は既に `gameFlow.test.ts` からインポートされており（`:10`）、`gameEngine.integration.test.ts` は同ディレクトリ内なので自然にインポート可能。`useGameController.test.ts` と `gameSetup.test.ts` からも `../domain/testHelpers` でインポート可能。

**pot=0 のケース（showdown.test.ts:166,240,301 と gameEngine.integration.test.ts:344）**: `calcTotalChips` は pot を含む計算なので、pot=0 のケースでも結果は同じ。これらも `calcTotalChips` に置換してよい。

**debug スクリプトの `reduce` パターン（debug_game.ts:15, debug_game2.ts:10）**: これらはチップ保存則チェックではなくチップ合計の取得用途。debug_common.ts の `setupCpuChips` 内部で吸収されるため、別途対応不要。

#### 影響範囲
- `src/domain/testHelpers.ts` — `calcTotalChips` 関数追加
- `src/domain/gameEngine.integration.test.ts` — 11箇所置換 + import 追加
- `src/application/gameFlow.test.ts` — 12箇所置換（import は既存）
- `src/application/useGameController.test.ts` — 4箇所置換 + import 追加
- `src/domain/gameSetup.test.ts` — 1箇所置換 + import 追加
- `src/domain/showdown.test.ts` — 3箇所置換 + import 追加

---

### 実装順序

1. **タスク5（calcTotalChips）を最初に実装** — 他のタスクのヘルパーからも使える基盤
2. **タスク2（expectedExports）** — 単純な定数抽出
3. **タスク3（ベッティングラウンドヘルパー）** — タスク5の calcTotalChips を活用
4. **タスク4（waitForGameEnd）** — 独立した変更
5. **タスク1（debug_common.ts）** — 最も大きな変更、最後に実施

### Coder向け注意事項

- **動作の同一性**: 特にデバッグスクリプト（タスク1）はリファクタリング前後で出力が完全に同一であること。副作用の順序が変わらないよう注意
- **テストの意味を変えない**: ヘルパー関数抽出時、テストの assert の意味や検証範囲が変わらないこと
- **import の整理**: 新しいヘルパーを追加する際、未使用になった直接 import は削除する
- **アンチパターン**: `utils/` 的な汎用ファイル名を避ける。`debug_common.ts` は目的が明確なので OK。テストヘルパーは既存の `testHelpers.ts` に追加