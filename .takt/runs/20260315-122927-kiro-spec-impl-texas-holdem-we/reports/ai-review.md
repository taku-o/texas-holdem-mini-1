# AI生成コードレビュー

## 結果: REJECT

## サマリー
テストコード2件が主張するシナリオを実際にはテストしておらず、回帰検出能力がない（検知漏れ）。

## 検証した項目
| 観点 | 結果 | 備考 |
|------|------|------|
| 仮定の妥当性 | ❌ | 2件のテストでGiven/セットアップが主張と不一致 |
| API/ライブラリの実在 | ✅ | 全API実在確認済み |
| コンテキスト適合 | ✅ | 既存テストパターンに準拠 |
| スコープ | ✅ | 計画どおりの4ファイル変更 |

## 今回の指摘（new）
| # | finding_id | family_tag | カテゴリ | 場所 | 問題 | 修正案 |
|---|------------|------------|---------|------|------|--------|
| 1 | AIR-001 | plausible-but-wrong | 検知漏れ | `src/domain/handProgression.test.ts:303-322` | `startNextHand`内で`getNextDealerIndex`がchip-0プレイヤーをスキップしディーラーがindex 3に移動するため、SB=4,BB=0となりplayers[1],[2]はブラインド位置に来ない。アサーションは自明に成立し回帰検出不能 | ディーラー移動後にSB/BB位置にchip-0プレイヤーが来るよう初期状態を設計する。`postBlinds`の`Math.min(BLIND, 0)=0`の仕様を検証すべき |
| 2 | AIR-002 | plausible-but-wrong | 検知漏れ | `src/domain/gameEngine.integration.test.ts:210-268` | ループが`maxIterations`(50)到達時、ゲーム終了未到達でもチップ保存則のみ検証して正常終了する。Givenコメント(L212)も「CPUチップが少なく」と記述するが実際は全員同額 | ループ後に`expect(iterations).toBeLessThan(maxIterations)`を追加しゲーム終了到達を保証する。Givenコメントを実態に合わせて修正 |

## 継続指摘（persists）
なし

## 解消済み（resolved）
なし

## 再開指摘（reopened）
なし

## REJECT判定条件
- `new` が2件（AIR-001, AIR-002）あるため REJECT