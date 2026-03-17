# 変更スコープ宣言

## タスク
`debug_common.test.ts` のインライン reduce パターン2箇所を既存の `calcTotalChips` ヘルパーに置き換え

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `debug_common.test.ts` |

## 推定規模
Small

## 影響範囲
- `debug_common.test.ts` のみ。ロジック変更なし（同一関数への置換）
- 置換対象外の3箇所（125行目・135行目・141行目）は `+ state.pot` を含まないため変更なし
- 全19テストがパス済み