すべての情報が揃いました。以下が計画レポートです。

---

## 計画レポート: タスク9 — ゲーム画面ルートと開始・終了・再開のUI

### タスク概要

| サブタスク | 内容 | 要件 |
|-----------|------|------|
| 9.1 | ゲーム未開始時は「ゲーム開始」入口を表示し、ゲーム中はTableView・PlayerSeats・ActionBarを配置して状態を子に渡す | 4.1, 4.3, 8.1 |
| 9.2 | ゲーム終了時は「新しいゲームを始める」などの再開手段を表示する | 8.3 |

### 現状分析

**現在の `App.tsx`（11行）:** 静的な「Texas Hold'em」の見出しのみ。ゲーム状態の管理もUIコンポーネントの配置もない。

**既に実装済みのコンポーネント:**
- `useGameController`（`src/application/useGameController.ts`）: `gameState`, `validActions`, `isHumanTurn`, `startGame`, `handleAction` を提供するhook。`randomFn` を引数に取る
- `TableView`（`src/ui/TableView.tsx`）: `communityCards`, `pot` を受け取る
- `PlayerSeats`（`src/ui/PlayerSeats.tsx`）: `players`, `dealerIndex`, `currentPlayerIndex`, `phase` を受け取る
- `ActionBar`（`src/ui/ActionBar.tsx`）: `validActions`, `playerChips`, `currentBet`, `playerCurrentBetInRound`, `onAction` を受け取る

**ゲーム終了判定:** `gameFlow.ts:24` の `finishAsGameOver` が `phase: 'idle'` と `gameOverReason` をセットする。`useGameController` の `gameState` に `gameOverReason` が含まれるので、UI側で判定可能。

**ゲーム状態判別の整理:**
| 状態 | 判定条件 |
|------|---------|
| 未開始 | `gameState === null` |
| ゲーム中 | `gameState !== null && gameState.phase !== 'idle'` |
| ゲーム終了 | `gameState !== null && gameState.phase === 'idle' && gameState.gameOverReason` が存在 |

### 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/ui/GameScreen.tsx` | **新規作成** — ゲーム画面ルートコンポーネント。3つの表示モード（未開始・ゲーム中・終了）を切り替える |
| `src/App.tsx` | **変更** — `useGameController` を呼び出し、`GameScreen` に props を渡す |

### 設計方針

#### `GameScreen` コンポーネント（新規: `src/ui/GameScreen.tsx`）

**責務:** 受け取ったゲーム状態に応じて3つのビュー（未開始・ゲーム中・終了）を切り替えるプレゼンテーションコンポーネント。自身でゲーム状態を保持しない。

**Props:**
```typescript
type GameScreenProps = {
  gameState: GameState | null
  validActions: PlayerAction[]
  isHumanTurn: boolean
  onStartGame: () => void
  onAction: (action: PlayerAction) => void
}
```

**表示ロジック:**
1. **未開始（`gameState === null`）:** タイトル + 「ゲーム開始」ボタン。`onStartGame` を呼ぶ
2. **ゲーム終了（`gameState.phase === 'idle'` かつ `gameOverReason` あり）:** 終了理由の表示 + 「新しいゲームを始める」ボタン。`onStartGame` を呼ぶ
3. **ゲーム中（上記以外）:** `TableView` + `PlayerSeats` + （人間のターンなら）`ActionBar` を配置

**子コンポーネントへのprops配線:**
- `TableView`: `communityCards={gameState.communityCards}`, `pot={gameState.pot}`
- `PlayerSeats`: `players={gameState.players}`, `dealerIndex={gameState.dealerIndex}`, `currentPlayerIndex={gameState.currentPlayerIndex}`, `phase={gameState.phase}`
- `ActionBar`（`isHumanTurn` が true の場合のみ表示）: `validActions`, `playerChips={humanPlayer.chips}`, `currentBet={gameState.currentBet}`, `playerCurrentBetInRound={humanPlayer.currentBetInRound}`, `onAction`
  - `humanPlayer` は `gameState.players.find(p => p.id === gameState.humanPlayerId)` で取得

**スタイリング方針:**
- Apple HIG風: 広めの余白、クリーンなレイアウト、控えめな装飾
- Tailwind CSS で実装
- 既存コンポーネント（CardView, PlayerSeat）のスタイルパターン（`rounded-lg`, `shadow-sm`, `bg-white`, `border-gray-200`）に合わせる

#### `App.tsx` の変更

**変更内容:** `useGameController(Math.random)` を呼び出し、返り値を `GameScreen` に渡すだけの薄いルートに変更する。

**変更理由:** design.md の設計に従い、Appはルートとして状態管理hookとUIコンポーネントを接続する役割のみ担う。

### Coder向け実装ガイドライン

#### 参照すべき既存パターン

| パターン | ファイル:行 |
|---------|------------|
| Props型の定義パターン | `src/ui/TableView.tsx:4-7` |
| Tailwindスタイルの適用パターン | `src/ui/PlayerSeat.tsx:24-37` |
| useGameControllerの使い方 | `src/application/useGameController.ts:15-45` |
| 人間プレイヤーの特定方法 | `src/application/useGameController.ts:35-37`（`players[currentPlayerIndex].isHuman`）|
| gameOverReasonの設定箇所 | `src/application/gameFlow.ts:24-26` |

#### 配線の全箇所

1. `App.tsx` → `useGameController(Math.random)` を呼ぶ
2. `App.tsx` → `<GameScreen>` に `gameState`, `validActions`, `isHumanTurn`, `onStartGame={startGame}`, `onAction={handleAction}` を渡す
3. `GameScreen` → `<TableView>` に `communityCards`, `pot` を渡す
4. `GameScreen` → `<PlayerSeats>` に `players`, `dealerIndex`, `currentPlayerIndex`, `phase` を渡す
5. `GameScreen` → `<ActionBar>` に `validActions`, `playerChips`, `currentBet`, `playerCurrentBetInRound`, `onAction` を渡す

#### 注意事項

- `GameScreen` はプレゼンテーション専用。ゲームロジックや状態管理のロジックを含めないこと
- `useEffect` は使用しない（tech.md: 「useEffectはどうしても必要な場合以外使用しない」）
- `humanPlayer` の取得で `find` が `undefined` を返す可能性があるが、ゲーム中（`gameState !== null && phase !== 'idle'`）であれば必ず存在する。型ガードで明示すること
- `GameScreen.tsx` は200行以内に収める。超えそうな場合、未開始画面・終了画面を別コンポーネントに分割する

#### アンチパターン

- `GameScreen` 内で `useState` / `useReducer` でゲーム状態を二重管理しないこと（状態は `App` → `GameScreen` のprops経由のみ）
- `ActionBar` の表示制御を `ActionBar` 内部に持たせないこと。`isHumanTurn` に基づく表示/非表示は `GameScreen` が制御する