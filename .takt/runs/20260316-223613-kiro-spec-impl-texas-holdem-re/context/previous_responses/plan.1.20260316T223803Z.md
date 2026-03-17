現在の実装を十分に把握しました。これは小規模タスクなので設計セクションは省略します。

---

## 計画レポート: タスク9 - ゲーム開始時の setState を関数形式に統一する

### タスク概要

**要件14**: `startGame` で初期状態を設定する際、`setState(value)` ではなく `setState(() => newState)` の関数形式を使い、前回状態に依存しない確実な状態設定を行う。

### 現状分析

**対象ファイル**: `src/application/useGameController.ts`

`startGame` 内の `setGameState` 呼び出し（32行目）:
```typescript
setGameState(advanced)  // 直接値を渡している
```

エラー時の `setGameState(null)`（36行目）も同様に直接値形式。

また `handleAction` 内の `setGameState(result)`（63行目）も直接値形式だが、タスク9のスコープは `startGame` のみ（要件14 の受け入れ基準は startGame を対象）。

### 変更要/不要の判定

| 箇所 | 現在のコード | 判定 | 根拠 |
|------|-------------|------|------|
| `useGameController.ts:32` | `setGameState(advanced)` | **変更要** | 直接値形式。関数形式 `setState(() => advanced)` にすべき |
| `useGameController.ts:36` | `setGameState(null)` | **変更要** | 同じ `startGame` 内のエラーハンドラ。一貫性のために関数形式にする |
| `useGameController.ts:63` | `setGameState(result)` | **変更不要** | `handleAction` 内。タスク9のスコープ外（要件14は startGame が対象） |

**補足**: `advanceUntilHumanTurn` に渡される `onProgress` コールバック（`setGameState` そのもの）は `processCpuTurnsAndPhases` 内で `onProgress?.(current)` として呼ばれる（gameFlow.ts:103行目）。これも直接値形式だが、gameFlow.ts 側のインターフェースを変更するのはタスク9のスコープ外。

### 影響範囲

- **変更ファイル**: `src/application/useGameController.ts` のみ
- **変更行数**: 2行（32行目、36行目）
- **影響**: なし。動作は同一。React の関数形式 setState は `prevState` を引数に取るが、今回は `prev` を使わず固定値を返すため、振る舞いは完全に同一。

### 実装ガイドライン（Coder向け）

#### 変更内容

**ファイル: `src/application/useGameController.ts`**

1. **32行目**: `setGameState(advanced)` → `setGameState(() => advanced)`
2. **36行目**: `setGameState(null)` → `setGameState(() => null)`

#### 参照パターン

なし。既存コードに関数形式の setState パターンは存在しない（今回が最初の適用）。

#### 注意事項

- `handleAction` 内の `setGameState(result)`（63行目）はタスク9のスコープ外。変更しない。
- `gameFlow.ts` 内の `onProgress?.(current)` はタスク9のスコープ外。変更しない。
- 関数形式の引数名に `prev` などを使いたくなるが、今回は前回状態を使わないので `() => value` の形で十分。`(_prev) => value` のような未使用引数は不要。