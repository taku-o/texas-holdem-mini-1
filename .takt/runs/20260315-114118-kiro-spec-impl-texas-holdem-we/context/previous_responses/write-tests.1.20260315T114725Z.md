## 作業結果
- 計画レポートのActionBarコンポーネント設計に基づき、テスト先行でユニットテストを作成
- 既存テストパターン（`PlayerSeat.test.tsx`）に従い、Given-When-Then構造、`@testing-library/react` の `render`/`screen`/`fireEvent`、`vitest` を使用
- 3つのサブタスク（8.1, 8.2, 8.3）に対応するテストケースを網羅
- インテグレーションテストは不要と判断（ActionBarはprops経由のみで通信、統合はタスク9の範囲）

## 変更内容
- **作成**: `src/ui/ActionBar.test.tsx` — 22テストケース
  - **8.1 アクションボタンの表示** (5件): ボタンレンダリング、fold/check/callの即座コールバック
  - **8.3 有効/無効アクションの制御** (3件): validActionsにないアクションの無効化、無効ボタンクリック無視
  - **8.2 ベット時のチップ数入力** (8件): bet/raise時の入力エリア表示・非表示、スライダーmin/max/step、スライダーと数値入力の同期、確定ボタンによるonAction呼び出し
  - **8.2 チップ入力の境界値** (4件): betのデフォルト値（BIG_BLIND）、raiseのデフォルト値（currentBet*2）、オールイン許容、キャンセル
  - **8.2 クイックベットボタン** (2件): All-inボタンの存在と動作