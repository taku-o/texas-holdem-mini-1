# 変更スコープ宣言

## タスク
テストヘルパー関数（card, createTestPlayer, createTestState, createSimpleDeck）の共通化モジュールに対するテスト作成

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/domain/testHelpers.test.ts` |

## 推定規模
Small

## 影響範囲
- `src/domain/testHelpers.ts`（テスト対象、未作成のプロダクションコード）
- 将来的に5つのテストファイル（dealing.test.ts, betting.test.ts, handProgression.test.ts, showdown.test.ts, handEvaluator.test.ts）が共通ヘルパーを使うよう移行される