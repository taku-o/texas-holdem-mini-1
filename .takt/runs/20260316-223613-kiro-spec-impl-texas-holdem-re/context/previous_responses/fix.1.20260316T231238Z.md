ActionBar.tsx のTS型エラーは既存問題（stash検証で確認済み）です。今回の変更箇所（useGameController.ts）に型エラーはありません。

## 作業結果
- レビュー指摘2件（AIR-009-001 / VAL-009-001: 空catchブロック、AIR-009-002 / VAL-009-002: handleAction setState形式不統一）を修正
- `family_tag: style-inconsistency` の再発防止テストとして handleAction の関数形式テストを追加

## 変更内容
- `src/application/useGameController.ts`:
  - L35-39: 内側try-catch（空catchブロック）を削除し、`setGameState(() => null)` を直接呼び出しに変更
  - L59(旧63): `setGameState(result)` → `setGameState(() => result)` に変更
- `src/application/useGameController.setStateFn.test.ts`:
  - handleAction の setGameState が関数形式で呼ばれることを検証するテストを1件追加（計6テスト）

## ビルド結果
- `npx tsc -b --noEmit`: ActionBar.tsx に既存TS型エラー1件（今回の変更とは無関係）。useGameController.ts に型エラーなし

## テスト結果
- `npx vitest run`: 26ファイル 458テスト 全パス

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 2 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `src/application/useGameController.ts` を確認: L32 `setGameState(() => advanced)`, L35 `setGameState(() => null)`（try-catchなし）, L59 `setGameState(() => result)` — 全箇所で関数形式統一
- `git stash` で App.test.tsx 単独実行 → パス確認（既存問題ではなくフレイキー）
- 全テスト2回目実行で458テスト全パス確認