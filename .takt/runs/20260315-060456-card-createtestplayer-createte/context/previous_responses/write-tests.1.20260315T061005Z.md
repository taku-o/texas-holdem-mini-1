## 作業結果
- `src/domain/testHelpers.ts`（未作成のプロダクションコード）に対するテストファイルを TDD アプローチで作成した
- 4つの公開関数（`card`, `createSimpleDeck`, `createTestPlayer`, `createTestState`）に対して計 22 テストケースを作成
  - **`card`**: カード生成の基本動作、異なる入力、ランク10のハンドリング（3テスト）
  - **`createSimpleDeck`**: 52枚、全ユニーク、4スート網羅、13ランク網羅、各スート13枚（5テスト）
  - **`createTestPlayer`**: デフォルト値、各フィールドの個別override、複数フィールド同時override、Player型充足（7テスト）
  - **`createTestState`**: デフォルト値、プレイヤー数、連番ID、52枚デッキ、各フィールドのoverride、GameState型充足（7テスト）
- インテグレーションテストは不要と判断（モジュール横断のデータフローなし）
- テストは Given-When-Then 構造で記述し、1テスト1概念を遵守

## 変更内容
- 作成: `src/domain/testHelpers.test.ts`