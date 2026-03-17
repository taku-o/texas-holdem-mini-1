# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 9` — タスク9「ゲーム画面ルートと開始・終了・再開のUI」の実装

- 9.1: ゲーム未開始時は「ゲーム開始」入口を表示し、ゲーム中はTableView・PlayerSeats・ActionBarを配置して状態を子に渡す（Requirements: 4.1, 4.3, 8.1）
- 9.2: ゲーム終了時は「新しいゲームを始める」などの再開手段を表示する（Requirements: 8.3）

## 分析結果

### 目的
現在プレースホルダーのみの `App.tsx` を、実際のゲーム画面として機能させる。既に実装済みの `useGameController` hook と各UIコンポーネント（TableView, PlayerSeats, ActionBar）を組み合わせ、ゲームの3つの状態（未開始・ゲーム中・終了）に応じた画面切り替えを実現する。

### スコープ

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `src/ui/GameScreen.tsx` | 新規作成 | ゲーム画面ルートコンポーネント。3つのビュー切り替え |
| `src/App.tsx` | 変更 | `useGameController` を呼び出し `GameScreen` に props を渡す |

**ゲーム状態の判定条件（`src/application/gameFlow.ts:24-26`, `src/domain/types.ts:47-59` で確認済み）:**

| 状態 | 判定条件 |
|------|---------|
| 未開始 | `gameState === null` |
| ゲーム中 | `gameState !== null && gameState.phase !== 'idle'` |
| ゲーム終了 | `gameState !== null && gameState.phase === 'idle' && gameState.gameOverReason` が存在 |

### 実装アプローチ

#### 1. `src/ui/GameScreen.tsx`（新規作成）

**Props型:**
```typescript
type GameScreenProps = {
  gameState: GameState | null
  validActions: PlayerAction[]
  isHumanTurn: boolean
  onStartGame: () => void
  onAction: (action: PlayerAction) => void
}
```

**3つのビュー:**

1. **未開始ビュー（`gameState === null`）:** タイトル「Texas Hold'em」 + 「ゲーム開始」ボタン → `onStartGame` を呼ぶ
2. **ゲーム終了ビュー（`phase === 'idle'` かつ `gameOverReason` あり）:** 終了理由の表示 + 「新しいゲームを始める」ボタン → `onStartGame` を呼ぶ
3. **ゲーム中ビュー:** `TableView` + `PlayerSeats` + （`isHumanTurn` が true のときのみ）`ActionBar` を配置

**子コンポーネントへのprops配線:**
- `TableView`: `communityCards={gameState.communityCards}`, `pot={gameState.pot}`
- `PlayerSeats`: `players={gameState.players}`, `dealerIndex={gameState.dealerIndex}`, `currentPlayerIndex={gameState.currentPlayerIndex}`, `phase={gameState.phase}`
- `ActionBar`: `validActions`, `playerChips={humanPlayer.chips}`, `currentBet={gameState.currentBet}`, `playerCurrentBetInRound={humanPlayer.currentBetInRound}`, `onAction`
  - `humanPlayer` は `gameState.players.find(p => p.id === gameState.humanPlayerId)` で取得

#### 2. `src/App.tsx`（変更）

- `useGameController(Math.random)` を呼び出す
- 返り値（`gameState`, `validActions`, `isHumanTurn`, `startGame`, `handleAction`）を `GameScreen` に渡す
- App自体はゲームロジックを持たない薄いルート

## 実装ガイドライン

### 参照すべき既存パターン

| パターン | ファイル:行 |
|---------|------------|
| Props型の定義 | `src/ui/TableView.tsx:4-7` |
| Tailwindスタイルの適用 | `src/ui/PlayerSeat.tsx:24-37` — `rounded-lg`, `shadow-sm`, `bg-white`, `border-gray-200` |
| useGameControllerの返り値 | `src/application/useGameController.ts:7-13` — `GameController` 型 |
| 人間ターン判定パターン | `src/application/useGameController.ts:34-37` |
| gameOverReasonの設定箇所 | `src/application/gameFlow.ts:24-26` |
| ゲーム終了理由の文言 | `src/domain/handProgression.ts:108` `'Human player has no chips remaining'`, `src/domain/handProgression.ts:115` `'All CPU players eliminated'` |

### スタイリング方針
- Apple HIG風: 広めの余白（`p-8` 以上）、クリーンなレイアウト、控えめな装飾
- 既存コンポーネントのTailwindパターンに合わせる
- 未開始・終了画面は画面中央に配置（`flex items-center justify-center min-h-screen`）
- ゲーム中画面は縦積みレイアウト（`flex flex-col items-center gap-6`）
- ボタンは目立つが控えめなスタイル（例: `bg-blue-600 text-white rounded-xl px-8 py-3 font-semibold`）

### 注意事項
- `GameScreen` はプレゼンテーション専用。`useState` / `useReducer` でゲーム状態を二重管理しない
- `useEffect` は使用しない（tech.md の規約）
- `humanPlayer` の取得: ゲーム中であれば `gameState.players.find(p => p.id === gameState.humanPlayerId)` は必ず値を返す。`undefined` の場合は early return でガード
- `ActionBar` の表示制御は `GameScreen` が `isHumanTurn` で行う。`ActionBar` 内部に持たせない
- `GameScreen.tsx` は200行以内に収める。未開始・終了の表示が複雑化する場合は分割を検討するが、現時点ではシンプルなので1ファイルで十分