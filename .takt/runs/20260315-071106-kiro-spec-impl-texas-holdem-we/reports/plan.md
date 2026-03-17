# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 6` — タスク6「ゲームコントローラーの実装」（6.1〜6.3）

## 分析結果

### 目的
Domain層（GameEngine, CPUStrategy）とUI層の間に位置するApplication層を実装する。ゲーム状態を単一で保持し、人間のアクション受付→検証→CPUの自動連続ターン→フェーズ遷移→次ハンド開始/ゲーム終了の一連のフローを制御する。

### スコープ

| サブタスク | 要件 | 内容 |
|-----------|------|------|
| 6.1 | 8.1 | ゲーム状態を1つ保持し、ゲーム開始操作で参加者・席順・初期チップを設定して最初のハンドを開始 |
| 6.2 | 6.1, 6.3, 1.4 | 人間プレイヤーのアクションを受け取り、GameEngineで検証・状態更新し、必要ならCPUターンを連続で進める |
| 6.3 | 7.1, 7.3 | CPUのターンでは自動で行動を決定し、結果を状態に反映してから次のプレイヤーまたはラウンドへ進める |

**影響ファイル:**

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `src/application/gameFlow.ts` | **新規** | ゲームフロー制御の純粋関数群 |
| `src/application/useGameController.ts` | **新規** | React hook（状態保持の薄いラッパー） |
| `src/domain/types.ts` | **修正** | `GameState` に `gameOverReason?: string` を追加 |
| `src/domain/gameEngine.ts` | **修正** | `decideAction` の re-export を追加 |

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| 全ロジックをReact hookに直接実装 | ❌ | テスト困難。Domain層と同様に純粋関数でフロー制御すべき |
| 純粋関数 + 薄いhookに分離 | ✅ | フロー制御ロジックがReactに依存せずテスト可能。tech.mdの「useEffectはどうしても必要な場合以外使用しない」にも適合 |
| useReducerでstate管理 | ❌ | design.mdに「useReducer または 1 つの state + setState」とあるが、dispatchパターンはオーバーエンジニアリング。useState + 純粋関数で十分 |

### 実装アプローチ

#### ファイル1: `src/application/gameFlow.ts`（純粋関数、推定80〜120行）

**公開関数:**

- `handlePlayerAction(state: GameState, action: PlayerAction, randomFn: () => number): GameState`
  — 人間のアクションを適用し、その後CPUターン・フェーズ遷移を人間の次のターンまたはゲーム終了まで自動進行
- `advanceUntilHumanTurn(state: GameState, randomFn: () => number): GameState`
  — ゲーム開始直後やハンド開始後、最初のプレイヤーがCPUなら人間の番まで自動進行

**`handlePlayerAction` の内部フロー:**

1. `applyAction(state, humanIndex, action)` で人間アクションを適用
2. 非フォールドプレイヤーが1人以下 → `resolveUncontestedPot` → ハンド終了処理
3. `isBettingRoundComplete` が true → `advancePhase`
4. `advanceUntilHumanTurn` を呼んでCPUターンを消化

**`advanceUntilHumanTurn` の内部フロー:**

```
while (true):
  非フォールド1人以下 → resolveUncontestedPot → ハンド終了処理
  showdownフェーズ → evaluateShowdown → ハンド終了処理
  全非フォールドが all-in（chips=0）→ showdownまでフェーズを自動進行
  現在のプレイヤーが人間（非フォールド・chips>0）→ return（入力待ち）
  CPUの行動を decideAction で決定 → applyAction で適用
  ベッティングラウンド完了 → advancePhase
```

**ハンド終了処理（内部関数 `resolveHandEnd`）:**

1. `isGameOver` で終了判定
2. 終了 → `{ ...state, phase: 'idle', gameOverReason: reason }` に遷移
3. 継続 → `startNextHand` → `advanceUntilHumanTurn`（新ハンドでCPUが先なら消化）

#### ファイル2: `src/application/useGameController.ts`（React hook、推定30〜50行）

```typescript
function useGameController(): {
  gameState: GameState | null
  startGame: () => void
  handleAction: (action: PlayerAction) => void
}
```

- `gameState`: `null`（未開始）または `GameState`
- `startGame`: `setupNewGame(Math.random)` → `advanceUntilHumanTurn` → `setGameState`
- `handleAction`: `handlePlayerAction(state, action, Math.random)` → `setGameState`

#### 型の追加: `src/domain/types.ts`

`GameState` に `gameOverReason?: string` を追加。ゲーム終了時の理由（`'Human player has no chips remaining'` / `'All CPU players eliminated'`）をUIに伝える。

#### エクスポート追加: `src/domain/gameEngine.ts`

`export { decideAction } from './cpuStrategy'` を追加。現在 `decideAction` はバレルからエクスポートされていない。

## 実装ガイドライン

### 参照すべき既存実装パターン

- **`randomFn` 引数パターン**: `src/domain/handProgression.ts:73`（`startNextHand`）— 乱数を引数で受け取りテスト可能にする。`gameFlow.ts` の全公開関数もこれに従う
- **イミュータブル更新**: `src/domain/betting.ts:25`（`applyAction`）— `players.map` + スプレッドで新 state を返す
- **テストヘルパー**: `src/domain/testHelpers.ts` — `createTestState` / `createTestPlayer` を gameFlow のテストでも活用する
- **バレルエクスポート**: `src/domain/gameEngine.ts` — Domain層の公開APIはここに集約

### 配線が必要な全箇所

1. `src/domain/types.ts` — `GameState` に `gameOverReason?: string` 追加
2. `src/domain/gameEngine.ts` — `export { decideAction } from './cpuStrategy'` 追加
3. `src/application/gameFlow.ts` — 新規作成、Domain関数を `../domain/gameEngine` から import
4. `src/application/useGameController.ts` — 新規作成、`gameFlow.ts` の関数と `setupNewGame` を import

### 注意すべきアンチパターン

1. **`isBettingRoundComplete` の呼び出しタイミング**: `advancePhase` 直後に呼ぶと false positive になる（全員 `currentBetInRound=0`, `currentBet=0`, `lastAggressorIndex=null` で true が返る）。必ずアクション適用**後**にのみチェックすること
2. **無限ループ防止**: `advanceUntilHumanTurn` はCPUターンを繰り返すループ。人間がフォールド済み or チップ0 のケースではハンド終了→`isGameOver`→idle のパスを必ず通ること。安全弁としてイテレーション上限（例: 100）を設けること
3. **useEffect 不使用**: `tech.md` に「useEffectはどうしても必要な場合以外使用しない」と明記。CPU ターンの自動進行も `handleAction` の同期呼び出しチェーン内で完結させる
4. **`decideAction` の第3引数**: `cpuStrategy.ts:78` — `randomFn: () => number` を取る。`gameFlow.ts` でも `randomFn` を引数として受け取り、`Math.random` をハードコードしない

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| UI コンポーネント（GameScreen, TableView, PlayerSeats, ActionBar） | タスク7〜9で実装 |
| CPUの「考え中」演出（タイマー遅延） | design.mdで「実装に委ねる」とされているが、タスク6のスコープはロジックのみ。UIタスクで必要なら追加 |
| ユーザーによるゲーム終了操作（「終了」ボタン） | タスク9.2でUI実装時に `useGameController` に `endGame` を追加 |