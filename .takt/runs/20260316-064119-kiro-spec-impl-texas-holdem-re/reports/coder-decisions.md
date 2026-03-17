# 決定ログ

## 1. useGameController.test.ts のテスト修正
- **背景**: `handlePlayerAction` と `advanceUntilHumanTurn` が async 化されたことで、useGameController 内部の処理も非同期になった。既存テストは同期パターン（`act(() => { ... })`）で記述されており、async 処理完了を待たずにアサートしていたため全面的な修正が必要だった
- **検討した選択肢**:
  - A: `await act(async () => { ... })` + `waitFor` で非同期完了を待つ
  - B: `vi.useFakeTimers()` でタイマーを制御する
- **理由**: A を採用。`setTimeout(0)` による yield は `waitFor` のポーリングで自然に待機できる。`startAndWait`/`waitForSettled` ヘルパーで「人間のターンまたはゲーム終了」を待つパターンに統一した。長時間テスト（ゲーム終了まで繰り返すテスト）には 30000ms のタイムアウトを設定

## 2. onProgress コールバックの呼び出しタイミング
- **背景**: 計画では「CPUアクション適用後、yield 前に呼ぶ」とされていた
- **検討した選択肢**:
  - A: `onProgress` → `await yieldToMainThread()` の順
  - B: `await yieldToMainThread()` → `onProgress` の順
- **理由**: A を採用（計画通り）。`onProgress` で React の `setGameState` を呼んだ後に yield することで、React がバッチ更新を処理するタイミングを確保できる

## 3. gameStateRef の同期パターン
- **背景**: async 処理中に最新の state を参照する必要がある
- **検討した選択肢**:
  - A: レンダー時に `gameStateRef.current = gameState` で同期 + async コールバック内でも明示的にセット
  - B: `useEffect` で同期
- **理由**: A を採用。`useEffect` は非同期にスケジュールされるため、ref の更新が遅れる可能性がある。レンダー中に直接同期することで最新値が常に利用可能