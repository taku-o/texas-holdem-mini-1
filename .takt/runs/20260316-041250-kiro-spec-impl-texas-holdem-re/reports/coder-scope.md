# 変更スコープ宣言

## タスク
ブラインド・ショートスタック修正: currentBetを実際のBB額に、chips=0プレイヤーのSB/BBスキップ

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/domain/dealing.ts` |
| 変更 | `src/domain/handProgression.ts` |
| 変更 | `src/domain/handProgression.test.ts` |
| 変更 | `src/application/gameFlow.test.ts` |

## 推定規模
Small

## 影響範囲
- dealing モジュール（postBlinds関数: SB/BB位置決定ロジック、currentBet設定）
- handProgression モジュール（preparePreflopRound関数: BBインデックス取得元の変更）
- gameFlow 統合テスト（新ロジックによるブラインド課金の変化に伴うアサーション修正）