# 変更スコープ宣言

## タスク
CPUプレイヤーの行動決定ロジック（decideAction）のテスト作成

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/domain/cpuStrategy.test.ts` |

## 推定規模
Medium

## 影響範囲
- `src/domain/cpuStrategy.ts`（実装対象モジュール）
- `src/domain/betting.ts`（getValidActions を利用）
- `src/domain/handEvaluator.ts`（evaluate を利用）
- `src/domain/constants.ts`（BIG_BLIND を参照）