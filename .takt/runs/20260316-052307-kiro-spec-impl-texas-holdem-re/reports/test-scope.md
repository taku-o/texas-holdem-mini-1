# 変更スコープ宣言

## タスク
チップ0プレイヤーの次ハンド除外テスト（startNextHand での folded 維持、dealHoleCards でのカード配布スキップ）

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/domain/handProgression.test.ts` |
| 変更 | `src/domain/dealing.test.ts` |

## 推定規模
Small

## 影響範囲
- `handProgression.ts` の `startNextHand` 関数
- `dealing.ts` の `dealHoleCards` 関数