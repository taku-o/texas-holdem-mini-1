## 作業結果
- 計画レポートに基づき、新規作成予定の2つのモジュールに対するテストを作成した
  - **`calcTotalChips`**: チップ保存則チェックの共通ヘルパー関数（タスク5）のテスト — 正常系（プレイヤーチップ+ポット）、ポット0、チップ0、フォールド済みプレイヤー含む、5人ゲーム標準状態の5ケース
  - **`debug_common`**: デバッグスクリプト共通モジュール（タスク1）のテスト — `executeBettingRound`（ラウンド完了、チップ保存則、maxActions制限、nullセレクター停止、イミュータビリティ）、`setupCpuChips`（CPU設定、人間への残配分、チップ保存、イミュータビリティ）、`callCheckSelector`（call優先、check選択、null返却）、`cpuFoldHumanCallSelector`（CPU fold優先、CPU check fallback、CPU null返却、人間 call優先、人間 check fallback、人間 null返却）の計18ケース
- タスク2〜4の既存テストリファクタリング（expectedExports共通化、ベッティングラウンドヘルパー、waitForGameEnd）は新しい振る舞いの追加ではないため、実装フェーズで既存テストを修正する方針とした

## 変更内容
- 作成: `debug_common.test.ts`（デバッグ共通モジュールのユニットテスト）
- 作成: `src/domain/testHelpers.calcTotalChips.test.ts`（calcTotalChips のユニットテスト）