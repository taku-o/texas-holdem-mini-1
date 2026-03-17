調査が完了しました。全体像を把握したので、タスク6の計画をまとめます。

---

## 計画レポート

### タスク概要

**タスク6: ゲームコントローラーの実装** — React の Application 層として、ゲーム状態を保持し、ゲーム開始・人間アクション受付・CPUターン自動進行を管理するカスタムフックを実装する。

### サブタスク分析

| サブタスク | 要件 | 内容 |
|-----------|------|------|
| 6.1 | 8.1 | ゲーム状態を1つ保持し、ゲーム開始操作で参加者・席順・初期チップを設定して最初のハンドを開始する |
| 6.2 | 6.1, 6.3, 1.4 | 人間プレイヤーのアクションを受け取り、検証・状態更新し、必要ならCPUターンを連続で進める |
| 6.3 | 7.1, 7.3 | CPUのターンでは自動で行動決定し、結果を状態に反映してから次のプレイヤーまたはラウンドへ進める |

### 既存コードとの関係

**既に実装済みのもの（Domain層・Application層）:**

- `setupNewGame()` (`domain/gameSetup.ts:6`) — ゲーム初期化。人間席ランダム決定・初期チップ・デッキ・ブラインド投入済み
- `handlePlayerAction(state, action, randomFn)` (`application/gameFlow.ts:105`) — 人間アクション適用 → CPUターン連続実行
- `advanceUntilHumanTurn(state, randomFn)` (`application/gameFlow.ts:114`) — CPUターンを人間のターンまで自動進行
- `getValidActions(state, playerIndex)` (`domain/betting.ts:3`) — 指定プレイヤーの有効なアクション一覧を返す

**結論: Domain層とApplication層のゲームフロー制御は完成している。** タスク6で実装するのは、これらを React のステート管理に橋渡しするカスタムフック。

### 実装アプローチ

#### 新規ファイル: `src/application/useGameController.ts`

React カスタムフック `useGameController` を1ファイルで実装する。

**責務:**
1. `GameState` を `useState` で保持する（初期値: `null` = ゲーム未開始状態）
2. `startGame()` — `setupNewGame()` を呼び、返却された状態から `advanceUntilHumanTurn()` で人間のターンまで進め、state にセット
3. `handleAction(action: PlayerAction)` — `handlePlayerAction()` を呼び、結果を state にセット
4. `validActions` — 現在の状態が人間のターンなら `getValidActions()` の結果、そうでなければ空配列
5. `isHumanTurn` — 現在のプレイヤーが人間かどうか

**インターフェース（返却値）:**

```typescript
type UseGameControllerReturn = {
  gameState: GameState | null
  startGame: () => void
  handleAction: (action: PlayerAction) => void
  validActions: PlayerAction[]
  isHumanTurn: boolean
}
```

**設計判断:**

| 判断 | 理由 |
|------|------|
| `useState` を使用（`useReducer` は不使用） | 状態更新ロジックは既に `gameFlow.ts` にあり、reducer にラップする必要なし。design.md:290 にも `useState` が選択肢として挙がっている |
| `useEffect` は不使用 | tech.md:29「useEffectはどうしても必要な場合以外使用しない」。ゲーム開始・アクション適用はユーザーイベント駆動であり、副作用フックは不要 |
| `randomFn` は `Math.random` をデフォルト使用 | テスト時に注入可能にするためオプション引数で受け取る |
| ゲーム未開始状態は `null` | `phase: 'idle'` の `GameState` を作るよりシンプル。UI側で `gameState === null` で「ゲーム開始」表示を分岐できる |

### ファイル構成

| ファイル | 操作 | 行数見積 | 備考 |
|---------|------|---------|------|
| `src/application/useGameController.ts` | **新規** | 約50-70行 | カスタムフック本体 |
| `src/application/useGameController.test.ts` | **新規** | 約100-150行 | テスト |

### 参照すべき既存実装パターン

| パターン | ファイル:行 |
|---------|-----------|
| ゲームフロー関数の呼び出し方 | `src/application/gameFlow.ts:105-119` — `handlePlayerAction` と `advanceUntilHumanTurn` |
| ゲーム初期化 | `src/domain/gameSetup.ts:6-35` — `setupNewGame` |
| 有効アクション取得 | `src/domain/betting.ts:3-23` — `getValidActions` |
| 型定義 | `src/domain/types.ts` — `GameState`, `PlayerAction` |
| テストヘルパー | `src/domain/testHelpers.ts` — `createTestState`, `createTestPlayer` |

### 変更の影響範囲

- **既存ファイルの変更: なし** — 新規ファイルのみ
- **後続タスク（7-9）への影響:** UI コンポーネント（GameScreen, TableView, PlayerSeats, ActionBar）はこのフックの返却値を使ってゲーム状態を表示・操作する。フックのインターフェースが後続タスクの設計前提となる

### 注意すべきアンチパターン

| アンチパターン | 対策 |
|--------------|------|
| ビジネスロジックのコントローラー漏れ | アクション検証・状態遷移は全て `gameFlow.ts` / `betting.ts` に委譲する。フック内にゲームルールを書かない |
| `useEffect` でのゲーム進行 | `startGame` / `handleAction` はイベントハンドラ内で同期的に呼ぶ。副作用フックでフロー制御しない |
| State の直接変更 | `gameFlow.ts` がイミュータブルな新 state を返すのでそのまま `setState` にセットする |
| 過度な抽象化 | Context Provider やストアは今は不要。単純な `useState` + 関数で十分 |

### 確認事項

なし（ユーザーへの確認不要。全ての判断材料はコードと仕様から得られた）