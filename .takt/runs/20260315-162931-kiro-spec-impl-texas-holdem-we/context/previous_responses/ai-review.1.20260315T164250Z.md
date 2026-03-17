テストファイルは`tsconfig.app.json`から除外されています。`npx tsc --noEmit`はテストファイルのチェックを行わないため、未使用変数があってもビルドエラーにはなりません。ただし、ポリシー上は「未使用コード」はREJECT基準です。

テストの`non-null assertion`（`!`）の使用パターンも確認しましたが、これは既存テストで広く使われている慣習です。

全レビューをまとめます。

---

## AI Antipattern Review — タスク10「結合・動作確認とテスト」

### レビュー対象

| ファイル | 種別 |
|---------|------|
| `src/App.tsx` | プロダクションコード（変更） |
| `src/ui/GameScreen.tsx` | プロダクションコード（新規） |
| `src/App.test.tsx` | テスト（変更） |
| `src/application/useGameController.test.ts` | テスト（変更） |
| `src/domain/cpuStrategy.test.ts` | テスト（変更） |
| `src/domain/gameEngine.integration.test.ts` | テスト（変更） |
| `src/domain/handProgression.test.ts` | テスト（変更） |
| `src/domain/showdown.test.ts` | テスト（変更） |
| `src/ui/GameScreen.test.tsx` | テスト（新規） |

### 判定: **REJECT**

---

### ブロッキング問題

#### `[AIR-001]` (new) — 未使用変数 `stateBefore`

- **ファイル:** `src/application/useGameController.test.ts:501`
- **問題:** `const stateBefore = result.current.gameState!` が定義されているが、テスト内で一度も参照されていない。AIがL141の既存テスト（`stateBefore`を使用）からパターンをコピーした際に、不要な変数を残している典型的なコピペパターン。
- **ポリシー根拠:** 「未使用コード（「念のため」のコード）」はREJECT基準
- **修正案:** L501の `const stateBefore = result.current.gameState!` を削除する。

---

### Warning（非ブロッキング）

#### `[AIR-W01]` — テスト内のボイラープレートの繰り返し

- **ファイル:** `src/application/useGameController.test.ts:397-461` (ゲーム再開テスト2件)
- **問題:** 「ゲーム終了まで fold を繰り返す」ループが2つのテストで同じパターンで繰り返されている。以下のループが重複：
  ```typescript
  let iterations = 0
  const maxIterations = 500
  while (result.current.gameState?.phase !== 'idle' && iterations < maxIterations) {
    act(() => { result.current.handleAction({ type: 'fold' }) })
    iterations++
  }
  ```
- **判断:** テストファイルのDRYはWarning扱い（ポリシー「テストファイルの扱い」に基づく）。実害（フレーク等）は確認されていない。
- **推奨:** ヘルパー関数 `runUntilGameOver(result)` を抽出して重複を解消すると保守性が向上する。

#### `[AIR-W02]` — テストのアサーションが条件付き（弱いアサーション）

- **ファイル:** `src/domain/cpuStrategy.test.ts:235-238`, `src/domain/cpuStrategy.test.ts:264-269`, `src/domain/cpuStrategy.test.ts:303-306`
- **問題:** bet/raiseのamount検証が `if (action.type === 'bet')` / `if (action.type === 'raise')` 条件内にあり、CPUが別のアクション（check, call, fold等）を選択した場合、テストが何も検証せずパスする。テストの検知漏れリスクがある。
- **判断:** テストの実装詳細への依存としてWarning。

---

### 確認済み・問題なしの観点

| 観点 | 結果 |
|------|------|
| 幻覚API | ✅ 使用されているimport（`TableView`, `PlayerSeats`, `ActionBar`, `useGameController`）は全て実在するモジュール |
| 型安全性 | ✅ `any`型の使用なし。`GameScreenProps`の型定義は`GameState`/`PlayerAction`と整合 |
| フォールバック濫用 | ✅ 不要な`??`や`|| defaultValue`の使用なし |
| スコープクリープ | ✅ タスク10の要件（結合・動作確認とテスト）に沿った変更。過剰な機能追加なし |
| スコープ縮小 | ✅ タスク9.1/9.2のUI実装（`GameScreen.tsx`）とタスク10のテスト追加を適切にカバー |
| 既存パターンとの整合性 | ✅ テストスタイル（Given/When/Then）、コンポーネント設計（props-down）、型定義パターンが既存コードベースと一致 |
| 配線忘れ | ✅ `GameScreen`は`App.tsx`で正しくインポート・使用されている。propsの受け渡しも`useGameController`の返り値と整合 |
| オブジェクト/配列の直接変更 | ✅ プロダクションコードでのミュータブル操作なし |
| 説明コメント | ✅ What/Howコメントなし |
| TODOコメント | ✅ TODOコメントの追加なし |
| デッドコード | ✅ 新規コードに未使用の関数・エクスポートなし（テスト内の未使用変数を除く） |
| 後方互換コード | ✅ 不要なlegacy対応なし |
| コンテキスト適合性 | ✅ `NotStartedView`/`GameOverView`はファイルスコープの内部コンポーネントとして定義されており、既存パターン（`ChipInput` in `ActionBar.tsx`）と整合 |

---

### finding 一覧

| finding_id | 状態 | 種別 | 概要 |
|-----------|------|------|------|
| AIR-001 | new | REJECT | `useGameController.test.ts:501` — 未使用変数 `stateBefore` |
| AIR-W01 | new | Warning | `useGameController.test.ts` — ゲーム終了ループの重複 |
| AIR-W02 | new | Warning | `cpuStrategy.test.ts` — 条件付きアサーションによる検知漏れリスク |