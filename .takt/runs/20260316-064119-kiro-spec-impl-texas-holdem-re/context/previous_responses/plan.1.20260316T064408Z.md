すべての関連ファイルを確認しました。計画をまとめます。

---

## 計画レポート: タスク8 - CPU連続処理の非同期化

### タスク概要

**要件10**: CPU の連続ターン処理を、メインスレッドを長時間ブロックしない形に変更する。

### 現状分析

**`gameFlow.ts` (行51-101)**: `processCpuTurnsAndPhases` は同期的な while ループ（最大500回）で CPU ターン・フェーズ遷移・ショーダウンをすべて処理する。この間、メインスレッドがブロックされ、UIの再描画が行われない。

**`useGameController.ts`**:
- `handleAction` (行24-31): `setGameState(prev => handlePlayerAction(prev, action, randomFn))` — 同期的な関数アップデータで呼び出し
- `startGame` (行18-22): `advanceUntilHumanTurn` を同期的に呼び出し、結果を `setGameState(advanced)` で設定

**公開インターフェース**:
- `handlePlayerAction(state, action, randomFn): GameState` — 同期
- `advanceUntilHumanTurn(state, randomFn): GameState` — 同期

### 設計方針

**アプローチ**: `processCpuTurnsAndPhases` を async にし、一定回数ごとに `setTimeout(0)` で yield してメインスレッドに制御を返す。中間状態は `onProgress` コールバックで呼び出し側に通知する。

**yield 戦略**: CPUアクション実行ごと（1ターンごと）に yield する。現在のプレイヤー数（5人）では1ハンドで最大20回程度のCPUアクションなので、パフォーマンスに問題はない。

#### インターフェース変更

```typescript
// gameFlow.ts

// 非同期 yield ヘルパー
function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// 非同期版に変更
async function processCpuTurnsAndPhases(
  state: GameState,
  randomFn: () => number,
  onProgress?: (state: GameState) => void,
): Promise<GameState>

export async function handlePlayerAction(
  state: GameState,
  action: PlayerAction,
  randomFn: () => number,
  onProgress?: (state: GameState) => void,
): Promise<GameState>

export async function advanceUntilHumanTurn(
  state: GameState,
  randomFn: () => number,
  onProgress?: (state: GameState) => void,
): Promise<GameState>
```

```typescript
// useGameController.ts

// handleAction: async化し、setGameStateを直接呼ぶ（関数アップデータではなくなる）
const handleAction = useCallback(
  async (action: PlayerAction) => {
    setGameState((prev) => {
      if (!prev) return prev
      // 即座にprocessing中を示すため、現在のstateをそのまま返す（変更なし）
      // 実際の処理はasyncで行う
      return prev
    })
    // 現在のstateを取得して非同期処理
    // useRefで最新stateを参照する
    const current = gameStateRef.current
    if (!current) return
    const afterAction = applyAction(current, current.currentPlayerIndex, action)
    setGameState(afterAction)
    const result = await processCpuTurnsAndPhases(afterAction, randomFn, setGameState)
    setGameState(result)
  },
  [randomFn],
)
```

実は上記は複雑すぎる。もっとシンプルなアプローチを取る：

```typescript
// useGameController.ts - シンプルなアプローチ

// useRefで最新のgameStateを追跡
const gameStateRef = useRef<GameState | null>(null)
gameStateRef.current = gameState

// 処理中フラグで二重実行を防止
const processingRef = useRef(false)

const handleAction = useCallback(
  async (action: PlayerAction) => {
    if (processingRef.current || !gameStateRef.current) return
    processingRef.current = true
    try {
      const result = await handlePlayerAction(
        gameStateRef.current, action, randomFn, setGameState
      )
      setGameState(result)
    } finally {
      processingRef.current = false
    }
  },
  [randomFn],
)
```

### 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/application/gameFlow.ts` | `processCpuTurnsAndPhases`, `handlePlayerAction`, `advanceUntilHumanTurn` を async 化。yield ヘルパー追加。`onProgress` コールバック追加 |
| `src/application/useGameController.ts` | `handleAction`, `startGame` を async 化。`useRef` で最新 state 追跡と二重実行防止。`GameController.handleAction` の型を `(action: PlayerAction) => Promise<void>` に変更 |

### 実装ガイドライン

#### 1. `gameFlow.ts` の変更

**参照パターン**: 現在の `processCpuTurnsAndPhases`（行51-101）の while ループ構造はそのまま維持し、async/await を追加する。

**変更点**:
- `yieldToMainThread` ヘルパー関数を追加（`setTimeout(0)` の Promise ラッパー）
- `processCpuTurnsAndPhases` を `async` にする
- CPUアクション適用後（行97の `applyAction` 後）に `await yieldToMainThread()` と `onProgress?.(current)` を呼ぶ
- `handlePlayerAction`, `advanceUntilHumanTurn` を `async` にし、`onProgress` パラメータを追加して `processCpuTurnsAndPhases` に転送する
- `handlePlayerAction` 内の `applyAction`（行108）は同期のまま。その後の `processCpuTurnsAndPhases` 呼び出しに `await` を追加

**注意点**:
- `skipToShowdownAndResolve`（行39-49）、`resolveAndCheckGameOver`（行28-37）、`getNonFoldedCount`（行13-15）、`canAnyoneStillBet`（行17-22）、`finishAsGameOver`（行24-26）は同期のまま変更不要
- yield するのはCPUアクション実行時のみ。フェーズ遷移やショーダウン評価は即座に行う（これらは計算量が少ない）

#### 2. `useGameController.ts` の変更

**参照パターン**: 現在の `useGameController`（行15-45）

**変更点**:
- `GameController.handleAction` の型: `(action: PlayerAction) => void` → `(action: PlayerAction) => void`（外部インターフェースは void のまま。内部で async を fire-and-forget する）
  - 理由: UI 側の呼び出しコードを変更しなくて済む
- `useRef` を2つ追加:
  - `gameStateRef`: 最新の gameState を追跡（async 処理中に最新 state を参照するため）
  - `processingRef`: 二重実行防止フラグ
- `startGame`（行18-22）: async 化し、`advanceUntilHumanTurn` を await。中間状態を `setGameState` で更新
- `handleAction`（行24-31）: 
  - `setGameState(prev => ...)` の関数アップデータパターンをやめる（async と相性が悪い）
  - `gameStateRef.current` から現在の state を取得し、`handlePlayerAction` を await
  - `onProgress` として `setGameState` を渡し、CPUターンごとにUIが更新される

**影響範囲の確認**: `GameController` 型の `handleAction` を呼び出している箇所:

```typescript
// useGameController.ts 行7-13 の型定義
type GameController = {
  gameState: GameState | null
  validActions: ValidAction[]
  isHumanTurn: boolean
  startGame: () => void
  handleAction: (action: PlayerAction) => void
}
```

UI側で `handleAction` を呼ぶ箇所を確認する必要がある。`startGame` も同様。

#### 3. UI側への影響

`handleAction` と `startGame` の外部シグネチャは `void` を返すまま（内部で async を fire-and-forget）にするため、UI側の変更は不要。ただし、**二重実行防止**が重要：CPU処理中に人間がアクションボタンを押しても無視する必要がある。`processingRef` でガードし、`isHumanTurn` が false になることでUI側でもボタンが無効化される。

#### 4. アンチパターン注意

- **`async void` の例外握りつぶし**: fire-and-forget する箇所では `.catch(console.error)` 等でエラーハンドリングすること
- **State の stale reference**: `setGameState(prev => ...)` が使えないため、`useRef` で最新 state を追跡する必要がある。`onProgress` コールバックで `setGameState` を呼ぶと、React の state と ref の両方を更新する仕組みが必要
- **Race condition**: `processingRef` による二重実行ガードが必須

#### 5. テストへの影響

既存の `gameFlow.test.ts` では `handlePlayerAction` と `advanceUntilHumanTurn` を同期的に呼んでいる（全70箇所以上）。async 化により全テストに `await` の追加が必要。テスト自体のロジック変更は不要。

### 確認事項

なし（コード調査で全て解決済み）。