## 作業結果
- 計画に基づき、タスク2（ブラインド・ショートスタック修正）のテストを作成
- `dealing.test.ts` に7つの新規テストを追加、1つの既存テストの名称を更新、1つの既存テストにアサーション追加
- `handProgression.test.ts` に2つの新規テストを追加
- 既存テスト46個は全てパス、新規テスト8個はプロダクションコード未修正のため想定通り失敗

## 変更内容

### `src/domain/dealing.test.ts`（変更）
- **名称更新**: `should set currentBet to BIG_BLIND` → `should set currentBet to actual BB amount when BB has enough chips`
- **アサーション追加**: BB未満チップテストに `expect(result.currentBet).toBe(7)` 追加
- **新規**: `should set currentBet to actual BB amount when BB is short-stacked` — BB=4チップ時にcurrentBet=4
- **新規**: `should not affect currentBet when only SB is short-stacked` — SBショートでもcurrentBetはBIG_BLIND
- **新規**: `should skip chips-0 player at SB position` — SB位置のchips=0をスキップし次のプレイヤーがSB
- **新規**: `should skip chips-0 player at BB position` — BB位置のchips=0をスキップし次のプレイヤーがBB
- **新規**: `should skip multiple consecutive chips-0 players` — 連続chips=0プレイヤーのスキップ
- **新規**: `should set lastAggressorIndex to actual BB index after skipping` — スキップ後のlastAggressorIndex検証

### `src/domain/handProgression.test.ts`（変更）
- **新規**: `should set UTG based on actual BB position when chips-0 player is skipped` — スキップ後のUTG位置検証
- **新規**: `should set currentBet to actual BB amount in preparePreflopRound` — preparePreflopRound経由のcurrentBet検証