I now have a comprehensive understanding. Let me formalize the plan.

---

## 計画レポート

### タスク概要

**タスク 6: ゲームコントローラーの実装**

タスク 6.1〜6.3 は、Domain層（GameEngine, CPUStrategy）とUI層の間に位置する Application層の実装。ゲーム状態を保持し、人間のアクション受付→検証→CPU自動ターン→フェーズ遷移→次ハンド/ゲーム終了を一貫して制御する。

### 要件分析

| サブタスク | 要件 | 変更要否 | 根拠 |
|-----------|------|---------|------|
| 6.1 ゲーム状態保持・開始 | 8.1 | **要** | GameController は未実装。`src/App.tsx` はプレースホルダーのみ |
| 6.2 人間アクション受付→CPU連続ターン | 6.1, 6.3, 1.4 | **要** | 同上 |
| 6.3 CPUターン自動決定・状態反映 | 7.1, 7.3 | **要** | 同上 |

### 設計

#### アーキテクチャ方針

design.md の指示に従い、GameController を Application層として実装する。テスト可能性のため、**ゲームフロー制御の純粋関数**と**Reactフック（状態保持の薄いラッパー）**を分離する。

#### ファイル構成

| ファイル | 層 | 責務 | 推定行数 |
|---------|---|------|---------|
| `src/application/gameFlow.ts` | Application（純粋ロジック） | ゲームフロー制御：人間アクション適用後のCPU連続ターン・フェーズ遷移・ハンド終了・ゲーム終了判定 | 80〜120行 |
| `src/application/useGameController.ts` | Application（Reactフック） | `useState` による GameState 保持と、gameFlow の関数を呼んで state を更新するコールバック提供 | 30〜50行 |

#### `gameFlow.ts` の設計

**公開関数:**

```typescript
// 人間のアクションを適用し、その後CPUターン・フェーズ遷移を
// 人間の次のターンまたはゲーム終了まで自動進行する
function handlePlayerAction(
  state: GameState,
  action: PlayerAction,
  randomFn: () => number
): GameState

// ゲーム開始後（setupNewGame直後）、最初のプレイヤーがCPUなら
// 人間の番まで自動進行する
function advanceUntilHumanTurn(
  state: GameState,
  randomFn: () => number
): GameState
```

**内部ロジックの流れ（`handlePlayerAction`）:**

1. `applyAction(state, humanIndex, action)` で人間のアクションを適用
2. 非フォールドプレイヤーが1人以下 → `resolveUncontestedPot` → ハンド終了処理
3. `isBettingRoundComplete` → `advancePhase`
4. `advanceUntilHumanTurn` を呼んでCPUターンを消化

**内部ロジックの流れ（`advanceUntilHumanTurn`）:**

```
while (true):
  非フォールド1人以下 → resolveUncontestedPot → ハンド終了
  showdownフェーズ → evaluateShowdown → ハンド終了
  全非フォールドが all-in → フェーズをshowdownまで自動進行
  現在のプレイヤーが人間 → return（人間の入力待ち）
  CPUの行動を決定・適用
  ベッティングラウンド完了 → advancePhase
```

**ハンド終了処理（内部関数 `resolveHandEnd`）:**

1. `isGameOver` で終了判定
2. 終了 → `phase: 'idle'` に遷移、reason を保持
3. 継続 → `startNextHand` → `advanceUntilHumanTurn`（新ハンドでCPUが先なら消化）

**エッジケースの対処:**

- **全員 all-in**: `advancePhase` 後にアクティブプレイヤー（非フォールド・チップ>0）が1人以下なら、ベッティングラウンドをスキップしてフェーズを直接進める
- **`isBettingRoundComplete` の false positive 問題**: `advancePhase` でリセットされた直後は `lastAggressorIndex=null`, `currentBet=0`, `currentBetInRound=0` のため `isBettingRoundComplete` が true を返す。この問題を回避するため、`isBettingRoundComplete` はCPUのアクション適用**後**にのみチェックする（ループの最上部では呼ばない）

#### `useGameController.ts` の設計

```typescript
function useGameController(): {
  gameState: GameState | null
  startGame: () => void
  handleAction: (action: PlayerAction) => void
}
```

- `gameState`: `null`（idle状態）またはゲーム進行中の `GameState`
- `startGame`: `setupNewGame(Math.random)` → `advanceUntilHumanTurn` → `setGameState`
- `handleAction`: `handlePlayerAction(state, action, Math.random)` → `setGameState`。ゲーム終了時（`phase === 'idle'`）は結果表示用に state を保持

#### GameState の拡張

ゲーム終了理由をUIに伝えるため、`GameState` に `gameOverReason` フィールドを追加する必要がある。

```typescript
// types.ts に追加
export type GameState = {
  // ...既存フィールド
  gameOverReason?: string  // ゲーム終了時の理由
}
```

### 依存関係

**gameFlow.ts が使用する既存関数（すべて `src/domain/gameEngine.ts` 経由）:**

| 関数 | ファイル | 用途 |
|------|---------|------|
| `setupNewGame` | gameSetup.ts | ゲーム初期化 |
| `applyAction` | betting.ts:25 | アクション適用 |
| `getValidActions` | betting.ts:3 | 有効アクション取得 |
| `isBettingRoundComplete` | betting.ts:100 | ラウンド完了判定 |
| `advancePhase` | handProgression.ts:28 | フェーズ遷移 |
| `startNextHand` | handProgression.ts:73 | 次ハンド準備 |
| `isGameOver` | handProgression.ts:103 | ゲーム終了判定 |
| `evaluateShowdown` | showdown.ts:28 | ショーダウン処理 |
| `resolveUncontestedPot` | showdown.ts:42 | 全員フォールド時のポット処理 |
| `decideAction` | cpuStrategy.ts:78 | CPU行動決定 |

### 影響範囲

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `src/application/gameFlow.ts` | **新規** | ゲームフロー制御の純粋関数 |
| `src/application/useGameController.ts` | **新規** | React hook（状態保持ラッパー） |
| `src/domain/types.ts` | **修正** | `GameState` に `gameOverReason?: string` を追加 |
| `src/domain/gameEngine.ts` | **修正** | `decideAction` の re-export を追加（現在未エクスポート） |

### Coder向け実装ガイドライン

#### 参照すべき既存実装パターン

- **純粋関数パターン**: `src/domain/handProgression.ts:73` (`startNextHand`) — `randomFn` を引数で受け取り、テスト可能にするパターン。`gameFlow.ts` の全関数もこれに従う
- **イミュータブル更新**: `src/domain/betting.ts:25` (`applyAction`) — `players.map` で新配列を作り、スプレッドで新 state を返すパターン
- **テストヘルパー**: `src/domain/testHelpers.ts` — `createTestState` / `createTestPlayer` を gameFlow のテストでも活用する
- **バレルエクスポート**: `src/domain/gameEngine.ts` — Domain層の公開APIはここに集約。`decideAction` を追加する

#### 配線が必要な箇所

1. `src/domain/types.ts` — `GameState` に `gameOverReason?: string` 追加
2. `src/domain/gameEngine.ts` — `export { decideAction } from './cpuStrategy'` 追加
3. `src/application/gameFlow.ts` — 新規作成、上記の Domain 関数を import
4. `src/application/useGameController.ts` — 新規作成、`gameFlow.ts` と `setupNewGame` を import

#### 注意すべきアンチパターン

1. **`isBettingRoundComplete` の呼び出しタイミング**: `advancePhase` 直後に呼ぶと false positive（全員 `currentBetInRound=0`, `currentBet=0` で true）になる。必ずアクション適用**後**にのみチェックすること
2. **無限ループ防止**: `advanceUntilHumanTurn` はCPUターンを繰り返すループ。人間がフォールド済み or チップ0 のケースではハンド終了 → `isGameOver` → idle のパスを必ず通ること。安全弁としてイテレーション上限を設けることも検討
3. **useEffect 不使用**: `tech.md` に「useEffectはどうしても必要な場合以外使用しない」と明記。CPU ターンの自動進行も `handleAction` の同期呼び出しチェーン内で完結させ、useEffect は使わない
4. **`decideAction` の `randomFn`**: CPUStrategy は第3引数に `randomFn` を取る（`cpuStrategy.ts:82`）。テスト時に固定値を渡せるよう、`gameFlow.ts` でも `randomFn` を引数として受け取り、内部で `Math.random` をハードコードしない