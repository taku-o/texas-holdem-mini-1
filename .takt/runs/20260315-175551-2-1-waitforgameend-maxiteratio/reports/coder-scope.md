# 変更スコープ宣言

## タスク
ActionLogger型を4引数に拡張し、debug_game3.tsの冗長なgetValidActions呼び出しを除去

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `debug_common.ts` |
| 変更 | `debug_game3.ts` |

## 推定規模
Small

## 影響範囲
- debug_common の ActionLogger 型定義と executeBettingRound のロガー呼び出し
- debug_game3.ts のロガー実装と不要インポートの除去