# 変更スコープ宣言

## タスク
startGame の setState 呼び出しを関数形式 `setState(() => value)` に統一する

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/application/useGameController.ts` |

## 推定規模
Small

## 影響範囲
- useGameController の startGame 関数内の setState 呼び出し（正常系・異常系の2箇所）