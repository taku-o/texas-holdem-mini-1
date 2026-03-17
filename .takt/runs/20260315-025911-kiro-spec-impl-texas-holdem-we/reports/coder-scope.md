# 変更スコープ宣言

## タスク
@pokertools/evaluator を用いたハンド評価アダプタの実装（タスク 3.1）

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/domain/handEvaluator.ts` |
| 変更 | `package.json` |

## 推定規模
Small

## 影響範囲
- `src/domain/` モジュール（HandRank 型を返す evaluate 関数の提供）
- `package.json`（`@pokertools/evaluator` 依存追加）