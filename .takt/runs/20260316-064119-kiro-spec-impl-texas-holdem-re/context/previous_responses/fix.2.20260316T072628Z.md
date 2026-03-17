All 452 tests pass across 25 test files, no errors.

## 作業結果
- VAL-001: `startGame` の `throw e` を削除し、`console.error(e)` で記録のみとした。また `setGameState(null)` の呼び出しを try-catch で囲み、React環境が破棄された後でも unhandled rejection が発生しないようにした
- VAL-002: `handleAction` の async IIFE に `catch (e) { console.error(e) }` ブロックを追加し、エラー記録を行うようにした
- `App.test.tsx` の `should not show start button during active game` テストを async + `waitFor` パターンに修正（async化に伴う回帰修正）

## 変更内容
- **`src/application/useGameController.ts`**: `startGame` の `throw e` 削除 → `console.error(e)` + `setGameState(null)` を try-catch で保護。`handleAction` に `catch (e) { console.error(e) }` 追加
- **`src/App.test.tsx`**: `should not show start button during active game` テストを `async` + `waitFor` に修正

## ビルド結果
- `npx tsc --noEmit` — エラーなし（成功）

## テスト結果
- `npx vitest run` — 25 test files, 452 tests passed, 0 failed, 0 errors

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 2 (VAL-001, VAL-002) |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `useGameController.ts:33-38`: `catch(e)` で `console.error(e)` → try-catch 付き `setGameState(null)` に変更。`throw e` 削除済み
- `useGameController.ts:60-61`: `catch (e) { console.error(e) }` 追加済み
- `App.test.tsx:45-54`: `async` + `waitFor` パターンに変更済み
- `npx vitest run src/App.test.tsx`: 5 tests passed, 0 errors（unhandled rejection 解消確認）
- `npx vitest run`: 452 tests passed, 0 failed, exit code 0