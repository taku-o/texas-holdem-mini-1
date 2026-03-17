## 作業結果
- Task 3.1（ショーダウン時のポット配分の正当性確保）を実装
- `evaluateShowdown` と `resolveUncontestedPot` に単一ポット前提の仕様コメントと不変条件アサーション（chips >= 0）を追加
- 既存テスト16件すべてがパス、全423テストもパス

## 変更内容
- **変更**: `src/domain/showdown.ts`
  - `evaluateShowdown`: 単一ポット・均等配分・端数処理の仕様を Why コメントで明記。配分後の `newChips < 0` チェックを追加し、違反時は throw
  - `resolveUncontestedPot`: 単一ポット配分の仕様を Why コメントで明記。配分後の `newChips < 0` チェックを追加し、違反時は throw

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし（正常終了）

## テスト結果
- `npx vitest run src/domain/showdown.test.ts` — 16 tests passed
- `npx vitest run` — 全24ファイル・423テスト passed