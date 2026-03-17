## 作業結果
- `testHelpers.test.ts`に`createDeck()`の遅延評価を検証するテスト4件を追加
  - `should not call createDeck when deck is provided in overrides`: deck: []指定時にcreateDeckが呼ばれないことを検証
  - `should call createDeck when deck is not provided in overrides`: deck未指定（他のoverridesあり）時にcreateDeckが1回呼ばれることを検証
  - `should call createDeck when no overrides are provided`: 引数なし時にcreateDeckが1回呼ばれることを検証
  - `should not call createDeck when deck is provided as custom cards`: カスタムデッキ指定時にcreateDeckが呼ばれないことを検証
- 既存テスト25件はすべてパス。新規テストのうち2件は実装前のため想定通り失敗（実装後にパスする前提）

## 変更内容
- `src/domain/testHelpers.test.ts`: vi.mockによるcreateDeckのモック設定追加、遅延評価テスト4件追加