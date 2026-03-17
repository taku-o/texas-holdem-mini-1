レビューが完了しました。以下が結果です。

---

## AI Antipattern Review — `useGameController`

**判定: REJECT**

---

### ブロッキング問題

#### [AIR-001] `computeIsHumanTurn` の冗長な実装 (new)

**ファイル:** `src/application/useGameController.ts:15-19`

**問題:** `findIndex` で人間プレイヤーのインデックスを検索し、`currentPlayerIndex` と比較するアプローチは冗長。既存コードベース（`gameFlow.ts:90`）では `state.players[state.currentPlayerIndex].isHuman` で直接判定しており、同値の短い書き方が存在する。

**現在のコード:**
```typescript
function computeIsHumanTurn(state: GameState | null): boolean {
  if (!state || state.phase === 'idle') return false
  const humanIndex = state.players.findIndex((p) => p.isHuman)
  return state.currentPlayerIndex === humanIndex
}
```

**修正案:**
```typescript
function computeIsHumanTurn(state: GameState | null): boolean {
  if (!state || state.phase === 'idle') return false
  return state.players[state.currentPlayerIndex].isHuman
}
```

**根拠:**
- `gameFlow.ts:90` は `if (currentPlayer.isHuman)` で直接判定しており、プロジェクトの標準パターン
- `findIndex` は O(n) の走査を行うが、インデックスは既に `currentPlayerIndex` として保持されており不要
- ポリシー「冗長な式（同値の短い書き方がある）」→ REJECT

---

### 非ブロッキング（参考情報）

なし

---

### 確認済み項目（問題なし）

| 観点 | 結果 |
|------|------|
| 幻覚API・存在しないメソッド | ✅ 全インポート（`setupNewGame`, `getValidActions`, `handlePlayerAction`, `advanceUntilHumanTurn`）の署名を実ファイルで確認済み。型も一致 |
| `any` 型の使用 | ✅ なし |
| フォールバック値の濫用 | ✅ なし（`if (!prev) return prev` は null ガードとして適切） |
| 説明コメント | ✅ なし |
| 未使用コード | ✅ `computeIsHumanTurn`, `computeValidActions` はいずれも `useMemo` で使用。`GameController` 型は戻り値の型注釈として使用 |
| TODO コメント | ✅ なし |
| オブジェクト/配列の直接変更 | ✅ なし（`handlePlayerAction` が新しい `GameState` を返す） |
| スコープクリープ | ✅ タスク 6.1/6.2/6.3 の要件に対して過不足なく実装されている |
| スコープ縮小 | ✅ 6.1（ゲーム初期化）、6.2（人間アクション処理+CPU自動進行）、6.3（CPU自動行動）すべてカバー |
| 既存パターンとの整合性 | ✅ React hooks の命名規則（`use` プレフィックス）、`useCallback`/`useMemo` の依存配列、関数型 `setGameState` の使用パターンは適切 |
| DRY 違反 | ✅ なし |
| エラーの握りつぶし | ✅ なし |