# 変更スコープ宣言

## タスク
タスク12: 結合・動作確認テストおよびドメイン層単体テストの追加

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/domain/__tests__/integration/shortStack-allIn-elimination.integration.test.ts` |
| 作成 | `src/domain/__tests__/integration/multipleAllIn-potDistribution.integration.test.ts` |
| 作成 | `src/domain/__tests__/integration/cpuRaise-validation.integration.test.ts` |

## 推定規模
Medium

## 影響範囲
- `src/domain/dealing.ts` — ショートスタックBBポスト、チップ0プレイヤー除外ロジック
- `src/domain/betting.ts` / `src/domain/betting-validation.ts` — ベッティングバリデーション、オールイン判定
- `src/domain/showdown.ts` — ショーダウン時のポット配分、チップ保存則
- `src/domain/handProgression.ts` — ハンド進行、チップ0プレイヤースキップ
- `src/domain/cpuStrategy.ts` — CPUレイズ額の下限保証
- `src/domain/gameEngine.ts` — 結合フロー全体の統合