## 作業結果
- 計画レポートに基づき、`handlePlayerAction` と `advanceUntilHumanTurn` の async 化に対するテストを作成した
- テストは以下の新しい振る舞いをカバーする:
  - **Promise 返却**: 両関数が Promise を返すことの検証
  - **onProgress コールバック**: CPUターン処理中に中間状態が通知されることの検証
  - **onProgress 不呼出**: 人間の番で即座に返る場合は onProgress が呼ばれないことの検証
  - **yield to main thread**: `setTimeout(0)` によるメインスレッドへの yield の検証
  - **統合テスト**: async API を使った完全なゲームフロー（フォールド繰り返しによるゲーム終了）
  - **チップ保存則**: async 処理を通じてチップ合計が保持されることの検証
- 既存テストの `await` 追加は実装フェーズで行う

## 変更内容
- 作成: `src/application/gameFlow.async.test.ts` — async 化固有の振る舞いテスト（14テストケース）