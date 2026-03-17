## 作業結果
- 計画に基づき、4つのテストファイルに合計10テストケースを追加
- 全92テスト（既存82 + 新規10）がパス

## 変更内容

### `src/domain/handProgression.test.ts` (+2テスト)
- `advancePhase` に `idle` フェーズを渡した場合のエラースロー検証
- `advancePhase` に `showdown` フェーズを渡した場合のエラースロー検証

### `src/domain/gameEngine.integration.test.ts` (+3テスト)
- ショーダウン後にポットが0になり、チップ保存則が成り立つことの検証
- `gameEngine.ts` facade から期待する全11関数がエクスポートされていることの検証
- 想定外のエクスポートが存在しないことの検証

### `src/domain/cpuStrategy.test.ts` (+3テスト)
- bet アクションの amount が BIG_BLIND 以上かつプレイヤーチップ以下であることの検証
- raise アクションの amount が currentBet より大きくプレイヤーチップ以下であることの検証
- チップが制限されている場合の bet/raise amount のクランプ検証

### `src/application/useGameController.test.ts` (+2テスト)
- 複数ハンドにわたり call, call, fold の混合アクションを実行し、各ハンド間でチップ保存則と isHumanTurn/validActions の一貫性を検証
- CPU全員脱落によるゲーム終了の統合テスト（call繰り返しでゲーム終了、isHumanTurn=false、validActions=[]）