# 変更スコープ宣言

## タスク
ブラインド・ショートスタック修正（タスク2）のテスト作成: currentBetを実際のBB額に、チップ0プレイヤーのSB/BBスキップ

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/domain/dealing.test.ts` |
| 変更 | `src/domain/handProgression.test.ts` |

## 推定規模
Small

## 影響範囲
- `src/domain/dealing.ts` の `postBlinds` 関数
- `src/domain/handProgression.ts` の `preparePreflopRound` 関数

## 変更詳細

### `src/domain/dealing.test.ts`
- **名称更新**: `should set currentBet to BIG_BLIND` → `should set currentBet to actual BB amount when BB has enough chips`
- **アサーション追加**: `should handle all-in when player has fewer chips than BB` に `expect(result.currentBet).toBe(7)` を追加
- **新規テスト**: `should set currentBet to actual BB amount when BB is short-stacked` — BB=4チップ時にcurrentBet=4
- **新規テスト**: `should not affect currentBet when only SB is short-stacked` — SBショートでもcurrentBetはBIG_BLIND
- **新規テスト**: `should skip chips-0 player at SB position` — SB位置のchips=0をスキップし次のプレイヤーがSB
- **新規テスト**: `should skip chips-0 player at BB position` — BB位置のchips=0をスキップし次のプレイヤーがBB
- **新規テスト**: `should skip multiple consecutive chips-0 players` — 連続chips=0プレイヤーのスキップ
- **新規テスト**: `should set lastAggressorIndex to actual BB index after skipping` — スキップ後のlastAggressorIndex検証

### `src/domain/handProgression.test.ts`
- **新規テスト**: `should set UTG based on actual BB position when chips-0 player is skipped` — スキップ後のUTG位置検証
- **新規テスト**: `should set currentBet to actual BB amount in preparePreflopRound` — preparePreflopRound経由のcurrentBet検証

## テスト実行結果
- 既存テスト46個: 全てパス
- 新規テスト8個: プロダクションコード未修正のため想定通り失敗（実装後にパスする前提）