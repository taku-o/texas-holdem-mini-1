# 変更スコープ宣言

## タスク
レビュー指摘5件のコード重複解消に対応する新規ヘルパー関数のテスト作成

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `debug_common.test.ts` |
| 作成 | `src/domain/testHelpers.calcTotalChips.test.ts` |

## 推定規模
Medium

## 影響範囲
- `debug_common.ts`（新規作成予定のデバッグ共通モジュール — `executeBettingRound`, `setupCpuChips`, `callCheckSelector`, `cpuFoldHumanCallSelector`）
- `src/domain/testHelpers.ts`（`calcTotalChips` 関数追加予定）
- `src/domain/gameEngine.integration.test.ts`（既存テストの重複解消リファクタリング対象 — タスク2,3,5）
- `src/application/useGameController.test.ts`（既存テストの重複解消リファクタリング対象 — タスク4,5）
- `src/application/gameFlow.test.ts`（`calcTotalChips` 置換対象 — タスク5）
- `src/domain/showdown.test.ts`（`calcTotalChips` 置換対象 — タスク5）
- `src/domain/gameSetup.test.ts`（`calcTotalChips` 置換対象 — タスク5）