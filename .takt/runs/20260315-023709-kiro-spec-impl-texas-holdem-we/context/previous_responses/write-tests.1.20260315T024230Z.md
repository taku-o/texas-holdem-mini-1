## 作業結果
- 計画レポートに基づき、`src/domain/types.ts` と `src/domain/constants.ts` に対するテストファイルを TDD スタイルで先行作成した
- 既存テストパターン（vitest, Given-When-Then 構造）に従って記述した
- プロダクションコードは一切作成・変更していない（テスト対象モジュールは未作成のため、実装後にテストがパスする想定）
- インテグレーションテストは不要と判断（型と定数の定義のみで、モジュール間のデータフローが発生しないため）

## 変更内容
- **作成**: `src/domain/constants.test.ts` — 定数の値検証（INITIAL_CHIPS, PLAYER_COUNT, CPU_COUNT, SMALL_BLIND, BIG_BLIND）、定数間の整合性検証（BB=SB×2、CPU_COUNT=PLAYER_COUNT-1）、境界条件（正の整数、ブラインド比率の妥当性）
- **作成**: `src/domain/types.test.ts` — Card型（全スート・全ランク・52枚デッキの一意性）、Player型（人間/CPU、ホールカード、フォールド状態、チップ0）、PlayerAction型（全5種のアクション、amount有無）、GamePhase型（全6フェーズ）、GameState型（各フェーズごとのコミュニティカード枚数、ディーラーインデックス、デッキ管理）、HandRank型（全10種の役カテゴリ、スコア比較）
- **作成**: レポート `test-scope.md`, `test-decisions.md`