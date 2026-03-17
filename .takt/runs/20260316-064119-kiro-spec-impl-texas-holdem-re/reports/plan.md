# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 8` — タスク8「CPU連続処理の非同期化」の実装。

## 分析結果

### 目的
CPU の連続ターン処理（`processCpuTurnsAndPhases` の同期 while ループ、最大500回）がメインスレッドを長時間ブロックしている問題を解消し、状態更新・再描画のサイクルが進むようにする。

### スコープ

| ファイル | 変更内容 |
|---------|---------|
| `src/application/gameFlow.ts` | `processCpuTurnsAndPhases`, `handlePlayerAction`, `advanceUntilHumanTurn` を async 化。yield ヘルパー追加。`onProgress` コールバック追加 |
| `src/application/useGameController.ts` | `handleAction`, `startGame` を async 化。`useRef` で最新 state 追跡と二重実行防止 |

UI側のコンポーネントは `GameController` 型の外部シグネチャを維持するため変更不要。

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| A: async + `setTimeout(0)` yield + `onProgress` コールバック | **採用** | シンプル。CPUアクション実行ごとに yield して再描画を許可。`onProgress` で中間状態をUIに反映。外部インターフェース（`handleAction: (action) => void`）を維持でき、UI変更不要 |
| B: Web Worker でCPU処理をオフロード | 不採用 | 過度な複雑化。現在のプレイヤー数（5人）では不要。state のシリアライズコストも発生する |
| C: Generator（`function*`）+ 呼び出し側でスケジューリング | 不採用 | Generator は async との組み合わせが複雑になる。async/await の方がイディオマティック |

### 実装アプローチ

#### 1. `gameFlow.ts` の変更

**yield ヘルパー追加:**
```typescript
function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}
```

**`processCpuTurnsAndPhases` を async 化:**
- 関数シグネチャ: `async function processCpuTurnsAndPhases(state, randomFn, onProgress?): Promise<GameState>`
- while ループの構造はそのまま維持
- CPUアクション適用後（現在の行97 `applyAction` の後）に `await yieldToMainThread()` と `onProgress?.(current)` を呼ぶ
- yield するのはCPUアクション実行時のみ。フェーズ遷移・ショーダウン評価・uncontested pot 解決は計算量が少ないので即座に実行

**`handlePlayerAction`, `advanceUntilHumanTurn` を async 化:**
- `async function handlePlayerAction(state, action, randomFn, onProgress?): Promise<GameState>`
- `async function advanceUntilHumanTurn(state, randomFn, onProgress?): Promise<GameState>`
- 内部で `await processCpuTurnsAndPhases(...)` を呼ぶだけ
- `handlePlayerAction` 内の `applyAction`（行108）は同期のまま

**変更不要な関数:**
- `getNonFoldedCount` (行13-15), `canAnyoneStillBet` (行17-22), `finishAsGameOver` (行24-26), `resolveAndCheckGameOver` (行28-37), `skipToShowdownAndResolve` (行39-49) — すべて同期のまま

#### 2. `useGameController.ts` の変更

**`useRef` を2つ追加:**
- `gameStateRef: useRef<GameState | null>(null)` — 最新の gameState を追跡（`setGameState` 後の state を async 処理中に参照するため）。`gameState` 変更時に `gameStateRef.current = gameState` で同期
- `processingRef: useRef(false)` — 二重実行防止フラグ

**`startGame` (行18-22):**
- 内部を async 即時関数で包む（外部シグネチャ `() => void` を維持）
- `const initialState = setupNewGame(randomFn)` は同期のまま
- `const advanced = await advanceUntilHumanTurn(initialState, randomFn, setGameState)`
- `setGameState(advanced)` で最終状態を設定

**`handleAction` (行24-31):**
- 内部を async 即時関数で包む（外部シグネチャ `(action: PlayerAction) => void` を維持）
- `processingRef.current` が true なら即 return（二重実行防止）
- `gameStateRef.current` から現在の state を取得
- `await handlePlayerAction(state, action, randomFn, setGameState)` を呼ぶ
- `setGameState(result)` で最終状態を設定
- `finally` ブロックで `processingRef.current = false`

**`GameController` 型（行7-13）:** 変更不要。`handleAction` と `startGame` は void を返すまま。

## 実装ガイドライン

- **yield のタイミング**: CPUアクション適用後のみ。フェーズ遷移やショーダウン評価では yield しない（計算量が少なく、中間状態をUIに見せる必要もない）
- **`onProgress` コールバック**: CPUアクション適用後、yield 前に呼ぶ。これにより React が中間状態で再描画できる
- **二重実行防止**: `processingRef` で CPU 処理中の追加アクションをガードすること。`isHumanTurn` が false になることでUIのボタンも自然に無効化されるが、race condition 対策として ref ガードも必須
- **async void のエラーハンドリング**: `startGame` と `handleAction` 内の async 即時関数には `.catch(console.error)` を付けて例外を握りつぶさない
- **テストの更新**: `gameFlow.test.ts` の全テストで `handlePlayerAction` と `advanceUntilHumanTurn` の呼び出しに `await` を追加する必要がある。テストロジック自体の変更は不要
- **参照パターン**: `gameFlow.ts` の `processCpuTurnsAndPhases`（行51-101）の while ループ構造をそのまま維持し、CPUアクション後に yield を挟む形で最小限の変更とする
- **アンチパターン注意**: `setGameState(prev => ...)` の関数アップデータパターンは async と相性が悪いため使わない。代わりに `useRef` で最新 state を追跡する