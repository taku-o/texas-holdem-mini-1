# タスク計画

## 元の要求
レビューで指摘された5件のコード重複を、共通関数・ヘルパーの抽出により解消する。

## 分析結果

### 目的
テストコード・デバッグスクリプトに散在するコード重複を共通関数に抽出し、保守性・可読性を向上させる。

### 参照資料の調査結果

6ファイルを全文読み込み、重複パターンを特定した。

**debug_game.ts / debug_game2.ts / debug_game3.ts の差分:**

| 要素 | debug_game.ts | debug_game2.ts | debug_game3.ts |
|------|-------------|---------------|---------------|
| 乱数関数 | seededRandom (seed=1) | `() => 0.5` | `() => 0.5` |
| チップ設定 | cpuChips=30, 残りを人間に | cpuChips=30, 残りを人間に | 固有（人間=全体-5, CPU4=5, 他=0） |
| ハンド数 | 20ハンドループ | 30ハンドループ | 1ハンド（ループなし） |
| アクション選択 | call/check優先 | CPU: fold優先, Human: call/check | CPU: fold優先, Human: call/check（+詳細ログ） |
| フェーズ進行 | advancePhase + checkループ | なし（uncontested pot のみ） | なし（uncontested pot のみ） |
| import差異 | evaluateShowdown | evaluateShowdown, resolveUncontestedPot | resolveUncontestedPot |

**チップ保存則パターンの全使用箇所（grep結果）:**

| ファイル | `+ pot` 付き | `pot` なし | 合計 |
|---------|-------------|-----------|------|
| gameEngine.integration.test.ts | 10箇所 | 1箇所 (L344) | 11 |
| gameFlow.test.ts | 12箇所 | 0 | 12 |
| useGameController.test.ts | 4箇所 | 0 | 4 |
| gameSetup.test.ts | 1箇所 | 0 | 1 |
| showdown.test.ts | 0 | 3箇所 (L166,240,301) | 3 |

**useGameController.test.ts のゲーム終了待ちループ:**
- fold ループ: 5箇所（L279, L306, L330, L407, L440）
- call ループ: 1箇所（L531）
- 合計6箇所が同一パターン

**facadeエクスポートテスト:**
- L357-369（配列）とL383-395（Set）で同一11要素を2回定義

### スコープ

| ファイル | 変更内容 |
|---------|---------|
| `debug_common.ts`（新規） | 共通ヘルパー（executeBettingRound, setupCpuChips, アクション選択戦略） |
| `debug_game.ts` | debug_common.ts を使用するリファクタリング |
| `debug_game2.ts` | debug_common.ts を使用するリファクタリング |
| `debug_game3.ts` | debug_common.ts を使用するリファクタリング |
| `src/domain/testHelpers.ts` | `calcTotalChips` 関数追加 |
| `src/domain/gameEngine.integration.test.ts` | expectedExports定数化、ベッティングラウンドヘルパー抽出、calcTotalChips適用（11箇所） |
| `src/application/useGameController.test.ts` | waitForGameEnd抽出（6箇所）、calcTotalChips適用（4箇所） |
| `src/application/gameFlow.test.ts` | calcTotalChips適用（12箇所） |
| `src/domain/gameSetup.test.ts` | calcTotalChips適用（1箇所） |
| `src/domain/showdown.test.ts` | calcTotalChips適用（3箇所） |

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| debug スクリプトを1つの汎用スクリプトに統合 | 不採用 | debug_game3.ts は単一ハンド・詳細ログという根本的に異なる目的。統合すると設定が複雑化し、デバッグ用途に反する |
| calcTotalChips をドメインロジック（非テスト）に配置 | 不採用 | プロダクションコードで使用されていないため、testHelpers.ts が適切 |
| calcTotalChips をファイルローカルに定義（各テストファイルごと） | 不採用 | 5ファイルで同一関数を重複定義することになり、重複解消の目的に反する |
| waitForGameEnd をテスト共有ユーティリティに配置 | 不採用 | useGameController.test.ts でのみ使用。renderHook の result への依存があり汎用性が低い |
| debug_common.ts にログ出力コールバックを含める | 不採用 | debug_game3.ts のログは各ステップで異なる詳細ログ。コールバック化すると本末転倒 |

### 実装アプローチ

**実装順序:**

1. **タスク5: calcTotalChips**（基盤）→ `src/domain/testHelpers.ts` に追加し、全テストファイルで置換
2. **タスク2: expectedExports 定数化**（単純）→ gameEngine.integration.test.ts 内で1箇所に集約
3. **タスク3: ベッティングラウンドヘルパー**（中）→ gameEngine.integration.test.ts 内にローカルヘルパー `advanceAndCheckAll` 抽出
4. **タスク4: waitForGameEnd**（中）→ useGameController.test.ts 内にローカルヘルパー抽出
5. **タスク1: debug_common.ts**（大）→ 共有モジュール新規作成、3スクリプトのリファクタリング

## 実装ガイドライン

### タスク1: debug_common.ts の設計

**新規ファイル `debug_common.ts`（プロジェクトルート）:**

```typescript
// 公開API:
type ActionSelector = (state: GameState, playerIdx: number, actions: PlayerAction[]) => PlayerAction | null

function executeBettingRound(state: GameState, selector: ActionSelector, maxActions?: number): GameState
function setupCpuChips(state: GameState, cpuChips: number): GameState

// プリセット戦略:
const callCheckSelector: ActionSelector   // call → check の優先順で選択
const cpuFoldHumanCallSelector: ActionSelector  // CPU: fold優先, Human: call/check
```

- `executeBettingRound`: `while (!isBettingRoundComplete && guard < maxActions)` ループを実行。内部で `getValidActions` を呼び、`selector` で選択されたアクションを `applyAction` で適用
- `setupCpuChips`: `PLAYER_COUNT`, `INITIAL_CHIPS` を使い、CPU に `cpuChips` を配分、残りを人間に割り当て。debug_game.ts:14-24 と debug_game2.ts:9-19 の共通パターン
- `callCheckSelector`: debug_game.ts:31-33 のロジック
- `cpuFoldHumanCallSelector`: debug_game2.ts:27-42 のロジック（ログなし版）

**各スクリプトの変更方針:**

- `debug_game.ts`: `setupCpuChips` + `executeBettingRound(state, callCheckSelector)` を使用。フェーズ進行ループ（L38-46）内のチェックループも `executeBettingRound` で置換可能（`checkOnlySelector` を追加: `{ type: 'check' }` を常に返す）
- `debug_game2.ts`: `setupCpuChips` + `executeBettingRound(state, cpuFoldHumanCallSelector)` を使用
- `debug_game3.ts`: `executeBettingRound(state, cpuFoldHumanCallSelector)` のみ使用。チップ設定は固有ロジック（L12-19）なので共通化しない。ただし debug_game3.ts はステップごとにログを出力するため（L33,39,43,45,53）、`executeBettingRound` を使うとログが出なくなる。**executeBettingRound にオプショナルな onAction コールバックを追加するか、ログ付き版は手動ループを残すかを判断すること。** シンプルさを優先するなら、debug_game3.ts は `executeBettingRound` を使わず共有インポートのみ（型と戦略関数）にとどめてもよい

**参照パターン:**
- `debug_game.ts:28-37` — ベッティングラウンドループの基本形
- `debug_game.ts:14-24` — CPUチップ配分ロジック
- `debug_game2.ts:27-43` — CPU fold/human call 選択ロジック

### タスク2: expectedExports 定数化

`gameEngine.integration.test.ts` の `describe('facade エクスポート検証')` ブロック直下に定数を定義:

```typescript
const EXPECTED_EXPORTS = [
  'setupNewGame', 'getValidActions', 'applyAction', 'isBettingRoundComplete',
  'evaluateShowdown', 'determineWinners', 'resolveUncontestedPot',
  'advancePhase', 'startNextHand', 'isGameOver', 'getActivePlayerCount',
]
```

- 1つ目のテスト（L357-373）: `EXPECTED_EXPORTS` で `for...of` ループ
- 2つ目のテスト（L383-400）: `new Set(EXPECTED_EXPORTS)` で比較

### タスク3: advanceAndCheckAll ヘルパー

`gameEngine.integration.test.ts` のファイルトップレベル（describe外）にヘルパー関数を配置:

```typescript
function advanceAndCheckAll(state: GameState): GameState {
  let current = advancePhase(state)
  while (!isBettingRoundComplete(current)) {
    const playerIdx = current.currentPlayerIndex
    current = applyAction(current, playerIdx, { type: 'check' })
  }
  return current
}
```

**置換対象:**
- `preserve chip conservation across each phase` テスト（L276-280, L284-288, L292-296）— 3箇所
- `should handle multiple hands with dealer rotation` テスト（L122-125, L127-130, L131-135）— 3箇所（同一パターン）
- `should distribute pot to winner` テスト（L325-333）— phases ループ内（既にループ化済みだが `advanceAndCheckAll` に置換可）

### タスク4: waitForGameEnd ヘルパー

`useGameController.test.ts` のファイルトップレベル（describe外）にヘルパー関数を配置:

```typescript
function waitForGameEnd(
  result: { current: ReturnType<typeof useGameController> },
  action: { type: 'fold' } | { type: 'call' },
  maxIterations = 500,
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

**置換対象（6箇所）:**
- L279-289, L306-316, L330-340, L407-417, L440-451 → `waitForGameEnd(result, { type: 'fold' })`
- L531-541 → `waitForGameEnd(result, { type: 'call' })`

### タスク5: calcTotalChips ヘルパー

`src/domain/testHelpers.ts` に追加:

```typescript
export function calcTotalChips(state: GameState): number {
  return state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot
}
```

**置換ルール:**
- `state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot` → `calcTotalChips(state)`
- `result.players.reduce((sum, p) => sum + p.chips, 0) + result.pot` → `calcTotalChips(result)`
- `state.players.reduce((sum, p) => sum + p.chips, 0)`（pot なし、showdown.test.ts）→ `calcTotalChips(state)` で置換可（pot=0 のため結果同一）
- `gameEngine.integration.test.ts:344` の `current.players.reduce((sum, p) => sum + p.chips, 0)` → `calcTotalChips(current)` で置換可（ショーダウン後 pot=0 を expect 済み）

**import 追加が必要なファイル:**
- `gameEngine.integration.test.ts` — `import { calcTotalChips } from './testHelpers'` を追加
- `useGameController.test.ts` — `import { calcTotalChips } from '../domain/testHelpers'` を追加
- `gameSetup.test.ts` — `import { calcTotalChips } from './testHelpers'` を追加（既存 import なし）
- `showdown.test.ts` — `import { calcTotalChips } from './testHelpers'` を追加（既存 import に `createTestPlayer, createTestState` あり。`testHelpers` からの import 行に追加）
- `gameFlow.test.ts` — 既存の `import { card, createTestPlayer, createTestState as createBaseTestState } from '../domain/testHelpers'` に `calcTotalChips` を追加

### 全体の注意事項

- **動作の同一性**: デバッグスクリプトは出力が変更前と完全同一であること。テストは assert の意味・検証範囲が変わらないこと
- **未使用 import の削除**: ヘルパー導入で直接 import が不要になった場合は削除する
- **ファイルサイズ**: 既存テストファイルのサイズ超過（gameFlow.test.ts: 881行等）は今回のスコープ外。重複解消で若干削減されるが、ファイル分割は含めない

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| テストファイルの分割（gameFlow.test.ts 881行等） | タスク指示書に記載なし。既存の問題であり今回のスコープ外 |
| debug スクリプトの統合（3ファイル→1ファイル） | 各スクリプトの目的が異なるため統合は不適切 |
| プロダクションコードへの calcTotalChips 配置 | プロダクションで使用されていないテスト専用ユーティリティ |