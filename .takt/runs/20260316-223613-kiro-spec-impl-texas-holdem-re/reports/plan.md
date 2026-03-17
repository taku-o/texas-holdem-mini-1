# タスク計画

## 元の要求
/kiro:spec-impl texas-holdem-review-fixes 9

タスク9: ゲーム開始時の setState を関数形式に統一する
タスク9.1: startGame で初期状態を設定する際、前回状態に依存しない形で setState する（例: setState(() => newState)）

## 分析結果

### 目的
`useGameController.ts` の `startGame` 関数内で `setState(value)` の直接値形式を `setState(() => value)` の関数形式に統一し、React の推奨パターンに従って前回状態に依存しない確実な状態設定を行う。

### スコープ
- **変更ファイル**: `src/application/useGameController.ts` のみ（1ファイル、2行の変更）

| 箇所 | 現在のコード | 判定 | 根拠 |
|------|-------------|------|------|
| `useGameController.ts:32` | `setGameState(advanced)` | **変更要** | 直接値形式。関数形式にすべき |
| `useGameController.ts:36` | `setGameState(null)` | **変更要** | 同じ `startGame` 内のエラーハンドラ。一貫性のため関数形式にする |
| `useGameController.ts:63` | `setGameState(result)` | **変更不要** | `handleAction` 内。要件14は startGame のみが対象 |
| `gameFlow.ts:103` | `onProgress?.(current)` | **変更不要** | gameFlow.ts 側のインターフェース変更はタスク9のスコープ外 |

### 実装アプローチ

小規模タスク（設計判断不要）。以下の2行を機械的に変更する。

**ファイル: `src/application/useGameController.ts`**

1. **32行目**: `setGameState(advanced)` → `setGameState(() => advanced)`
2. **36行目**: `setGameState(null)` → `setGameState(() => null)`

動作は完全に同一。React の関数形式 setState は `(prevState) => newState` のシグネチャだが、今回は `prev` を使わず固定値を返すだけなので振る舞いに差異なし。

## 実装ガイドライン

- 関数形式の引数に `_prev` のような未使用引数を書かないこと。`() => value` で十分
- `handleAction` 内（63行目）の `setGameState(result)` は変更しない。タスク9のスコープは `startGame` のみ
- `gameFlow.ts` の `onProgress?.(current)` も変更しない
- 既存テストがある場合は動作が変わらないことを確認する。関数形式への変更は振る舞いを変えないため、テスト追加は `startGame` の setState が関数形式で呼ばれることを検証する程度でよい

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| `handleAction` 内の `setGameState(result)` (63行目) | 要件14は `startGame` が対象。handleAction は別タスクのスコープ |
| `gameFlow.ts` の `onProgress?.(current)` (103行目) | gameFlow のインターフェース変更は別の関心事 |