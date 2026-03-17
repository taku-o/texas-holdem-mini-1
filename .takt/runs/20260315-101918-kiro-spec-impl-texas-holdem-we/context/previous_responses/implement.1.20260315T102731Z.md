## 作業結果
- タスク 6.1, 6.2, 6.3 に対応する `useGameController` カスタムフックを実装した
- 既存の `gameFlow` モジュール（`handlePlayerAction`, `advanceUntilHumanTurn`）と `betting` モジュール（`getValidActions`）を活用し、React の `useState`/`useCallback`/`useMemo` で状態管理を構成

## 変更内容
- **作成**: `src/application/useGameController.ts` — ゲーム状態管理フック
  - `startGame()`: `setupNewGame` でゲーム初期化 → `advanceUntilHumanTurn` で人間ターンまで進行
  - `handleAction(action)`: `handlePlayerAction` でアクション適用 → CPU ターン自動進行
  - `isHumanTurn`: 現在のプレイヤーが人間かどうかを `useMemo` で算出
  - `validActions`: 人間ターン時に `getValidActions` から有効アクションを `useMemo` で算出

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし（成功）

## テスト結果
- `npx vitest run src/application/useGameController.test.ts` — 21テスト全パス
- `npx vitest run` — 全253テスト全パス（既存テストへの影響なし）