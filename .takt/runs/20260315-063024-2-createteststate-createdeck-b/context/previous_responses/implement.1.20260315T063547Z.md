全187テストがパスしました。

## 作業結果
- `createTestState()`の`deck`フィールドに遅延評価を導入し、`overrides`に`deck`キーが含まれる場合は`createDeck()`の呼び出しをスキップするようにした

## 変更内容
- `src/domain/testHelpers.ts` 33行目: `deck: createDeck()` → `deck: 'deck' in overrides ? overrides.deck! : createDeck()`

## ビルド結果
- `npx tsc --noEmit`: 型エラーなし

## テスト結果
- `npx vitest run src/domain/`: 11ファイル・187テスト全件パス