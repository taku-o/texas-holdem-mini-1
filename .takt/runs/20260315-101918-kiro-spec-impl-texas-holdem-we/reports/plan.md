# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 6` — タスク6「ゲームコントローラーの実装」（サブタスク 6.1, 6.2, 6.3）

## 分析結果

### 目的
React の Application 層として、ゲーム状態を保持し、ゲーム開始・人間アクション受付・CPUターン自動進行を管理するカスタムフック `useGameController` を実装する。

### スコープ

**サブタスク:**

| サブタスク | 要件 | 内容 |
|-----------|------|------|
| 6.1 | 8.1 | ゲーム状態を1つ保持し、ゲーム開始操作で参加者・席順・初期チップを設定して最初のハンドを開始する |
| 6.2 | 6.1, 6.3, 1.4 | 人間プレイヤーのアクションを受け取り、検証・状態更新し、必要ならCPUターンを連続で進める |
| 6.3 | 7.1, 7.3 | CPUのターンでは自動で行動決定し、結果を状態に反映してから次のプレイヤーまたはラウンドへ進める |

**既に実装済みの下位レイヤー:**

| 関数 | ファイル:行 | 役割 |
|------|-----------|------|
| `setupNewGame(randomFn)` | `src/domain/gameSetup.ts:6` | ゲーム初期化（人間席ランダム・初期チップ・デッキ・ブラインド投入） |
| `handlePlayerAction(state, action, randomFn)` | `src/application/gameFlow.ts:105` | 人間アクション適用 → CPUターン連続実行まで自動進行 |
| `advanceUntilHumanTurn(state, randomFn)` | `src/application/gameFlow.ts:114` | CPUターンを人間のターンまで自動進行 |
| `getValidActions(state, playerIndex)` | `src/domain/betting.ts:3` | 指定プレイヤーの有効アクション一覧 |
| `isGameOver(state)` | `src/domain/handProgression.ts:103` | ゲーム終了条件判定 |

**結論:** Domain層とApplication層のゲームフロー制御は完成済み。タスク6で実装するのは、これらを React のステート管理に橋渡しするカスタムフックのみ。

**影響範囲:**
- 既存ファイルの変更: なし（新規ファイルのみ）
- 後続タスク（7-9）のUIコンポーネントはこのフックの返却値を使う

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| `useState` でGameStateを保持するカスタムフック | **採用** | 状態更新ロジックは既に `gameFlow.ts` にあり、フックは薄いラッパーで十分。design.md:290でも `useState` が選択肢として挙がっている |
| `useReducer` でアクションをdispatchする方式 | 不採用 | reducer内に委譲コードを書くだけで冗長。`gameFlow.ts` が既に「アクション → 新State」の変換を担っている |
| Context Provider + グローバルストア | 不採用 | 現時点では過度な抽象化。コンポーネント階層が浅い段階では不要。必要になった時に追加すればよい |
| `useEffect` でCPUターン進行 | 不採用 | tech.md:29「useEffectはどうしても必要な場合以外使用しない」。ゲーム開始・アクション適用はユーザーイベント駆動であり、イベントハンドラ内で同期的に完結する |

### 実装アプローチ

**新規ファイル: `src/application/useGameController.ts`（約50-70行）**

カスタムフック `useGameController` を実装する。

**返却インターフェース:**

```typescript
type UseGameControllerReturn = {
  gameState: GameState | null    // null = ゲーム未開始
  startGame: () => void          // 6.1: ゲーム開始
  handleAction: (action: PlayerAction) => void  // 6.2: 人間アクション受付
  validActions: PlayerAction[]   // 6.2/6.3: 現在有効なアクション
  isHumanTurn: boolean           // 現在が人間のターンか
}
```

**引数:**

```typescript
function useGameController(randomFn: () => number = Math.random): UseGameControllerReturn
```

`randomFn` をオプション引数にすることで、テスト時にシード付き乱数を注入可能にする。

**内部ロジック:**

1. `useState<GameState | null>(null)` でゲーム状態を保持
2. `startGame()`:
   - `setupNewGame(randomFn)` で初期状態を生成
   - `advanceUntilHumanTurn(state, randomFn)` で人間のターンまで進行（プリフロップでCPUが先に行動する場合に対応）
   - 結果を `setState` にセット
3. `handleAction(action)`:
   - `handlePlayerAction(state, action, randomFn)` を呼び出し（内部でアクション検証・適用・CPUターン自動進行が全て行われる）
   - 結果を `setState` にセット
4. `validActions`: `gameState` が存在し、現在のプレイヤーが人間なら `getValidActions(gameState, gameState.currentPlayerIndex)` を返す。それ以外は空配列
5. `isHumanTurn`: `gameState` が存在し、`gameState.phase !== 'idle'` かつ現在のプレイヤーが人間の場合に `true`

## 実装ガイドライン

### ファイル構成

| ファイル | 操作 | 行数見積 |
|---------|------|---------|
| `src/application/useGameController.ts` | 新規作成 | 約50-70行 |
| `src/application/useGameController.test.ts` | 新規作成 | 約100-150行 |

### 参照すべき既存実装パターン

| パターン | ファイル:行 |
|---------|-----------|
| ゲームフロー関数の使い方 | `src/application/gameFlow.ts:105-119` — `handlePlayerAction` と `advanceUntilHumanTurn` の引数・返却値 |
| ゲーム初期化の呼び出し方 | `src/domain/gameSetup.ts:6` — `setupNewGame(randomFn)` は `() => number` を受け取る |
| 有効アクション取得 | `src/domain/betting.ts:3-23` — `getValidActions(state, playerIndex)` は `PlayerAction[]` を返す |
| 型定義 | `src/domain/types.ts` — `GameState`, `PlayerAction`, `GamePhase` |
| テストヘルパー | `src/domain/testHelpers.ts` — `createTestState`, `createTestPlayer` |
| 既存テストの書き方 | `src/application/gameFlow.test.ts` — シード付き乱数の使い方、state の検証方法 |

### Coder向けの重要な指針

1. **ビジネスロジックをフック内に書かない**: アクション検証・状態遷移・CPUターン進行は全て `gameFlow.ts` と `betting.ts` に委譲する。フック内にゲームルールのコードを書いてはならない
2. **`useEffect` を使わない**: `startGame` と `handleAction` はイベントハンドラ内で呼ばれる前提。副作用フックでフロー制御しない（tech.md:29 制約）
3. **State の直接変更をしない**: `gameFlow.ts` がイミュータブルな新 state を返すので、そのまま `setState` にセットする
4. **ゲーム未開始状態は `null`**: `phase: 'idle'` の `GameState` を作るよりシンプル。UI側で `gameState === null` と `gameState.phase === 'idle'`（ゲーム終了）を区別できる
5. **テストでは `renderHook` を使う**: `@testing-library/react` の `renderHook` でフックをテストする。固定シードの `randomFn` を注入してテストの再現性を確保する

### 注意すべきアンチパターン

| アンチパターン | 対策 |
|--------------|------|
| ビジネスロジックのコントローラー漏れ | フック内にゲームルール（ベット最小額計算等）を書かない。全て下位層に委譲 |
| `useEffect` でのゲーム進行 | イベントハンドラ内で同期的に `setState` する |
| State の直接変更 | spread演算子やイミュータブル更新は `gameFlow.ts` 側が担保済み |
| 過度な抽象化 | Context Provider やストアは不要。単純な `useState` + 関数で十分 |
| God Component | フックは状態保持と委譲のみ。ロジックは持たない |

## 確認事項

なし（全ての判断材料はコードと仕様から得られた）