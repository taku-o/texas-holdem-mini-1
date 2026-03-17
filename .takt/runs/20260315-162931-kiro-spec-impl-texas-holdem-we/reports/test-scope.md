# 変更スコープ宣言

## タスク
タスク10: 結合・動作確認とテスト — 不足しているテストケースの追加（10件）

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/application/useGameController.test.ts` |
| 変更 | `src/domain/gameEngine.integration.test.ts` |
| 変更 | `src/domain/handProgression.test.ts` |
| 変更 | `src/domain/cpuStrategy.test.ts` |

## 推定規模
Medium

## 影響範囲
- useGameController（複数ハンド混合アクション統合テスト、CPU全員脱落によるゲーム終了テスト追加）
- gameEngine結合テスト（ショーダウン後ポット配分が0になることの検証、facadeエクスポート一覧検証・過不足検証）
- handProgression（advancePhaseにidle/showdownを渡した場合のエラースロー検証）
- cpuStrategy（bet/raiseアクションのamountがBIG_BLIND以上・プレイヤーチップ以下であることの検証、チップ制限時のクランプ検証）

## 作業結果
- 4つのテストファイルに合計10テストケースを追加
- 全92テスト（既存82 + 新規10）がパス済み

## 変更内容

### `src/domain/handProgression.test.ts` (+2テスト)
- `advancePhase` に `idle` フェーズを渡した場合に `Cannot advance from phase: idle` がスローされることを検証
- `advancePhase` に `showdown` フェーズを渡した場合に `Cannot advance from phase: showdown` がスローされることを検証

### `src/domain/gameEngine.integration.test.ts` (+3テスト)
- ショーダウン後にポットが0になり、全チップが勝者に配分されてチップ保存則が成り立つことの検証
- `gameEngine.ts` facade から期待する全11関数（setupNewGame, getValidActions, applyAction, isBettingRoundComplete, evaluateShowdown, determineWinners, resolveUncontestedPot, advancePhase, startNextHand, isGameOver, getActivePlayerCount）がエクスポートされていることの検証
- 想定外のエクスポートが存在しないことの検証

### `src/domain/cpuStrategy.test.ts` (+3テスト)
- bet アクションの amount が BIG_BLIND 以上かつプレイヤーチップ以下であることの検証
- raise アクションの amount が currentBet より大きくプレイヤーチップ以下であることの検証
- チップが制限されている場合（BIG_BLIND * 3）の bet/raise amount のクランプ検証

### `src/application/useGameController.test.ts` (+2テスト)
- 3ハンドにわたり call, call, fold の混合アクションを実行し、各ハンド間でチップ保存則と isHumanTurn/validActions の一貫性を検証
- CPU全員脱落によるゲーム終了の統合テスト（call繰り返しでゲーム終了到達、phase=idle、gameOverReason定義済み、isHumanTurn=false、validActions=[]）