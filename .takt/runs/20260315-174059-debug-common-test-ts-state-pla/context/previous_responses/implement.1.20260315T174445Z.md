実装は write_tests ムーブメントで既に完了しており、変更不要でした。

## 作業結果
- `debug_common.test.ts` は既に write_tests ムーブメントで変更済み（`calcTotalChips` の import 追加、32行目・38行目のインラインパターン置換済み）
- 125行目・135行目・141行目の `reduce` パターンは `+ state.pot` を含まないため、タスク指示書通り置換対象外
- 追加の実装変更は不要

## 変更内容
- 本ムーブメントでの変更なし（前ムーブメントで完了済み）

## ビルド結果
- `npx tsc --noEmit` — エラーなし（成功）

## テスト結果
- `npx vitest run debug_common.test.ts` — 19テスト全てパス