## 作業結果
- タスク1「デバッグ用ファイルの扱い方針の決定と反映」を実装完了
- プロジェクトルート直下の5つのデバッグファイルを削除した: `debug_common.ts`, `debug_common.test.ts`, `debug_game.ts`, `debug_game2.ts`, `debug_game3.ts`
- `src/` からのインポート参照がないことを事前確認済み

## 変更内容
- 削除: `debug_common.ts`
- 削除: `debug_common.test.ts`
- 削除: `debug_game.ts`
- 削除: `debug_game2.ts`
- 削除: `debug_game3.ts`

## ビルド結果
- `npm run build` 成功（`tsc -b && vite build`）。型エラーなし

## テスト結果
- `npm run test`（`vitest run`）: **29ファイル、481テスト全パス**
- `src/project-structure.test.ts` の3テスト（デバッグファイル不在の検証）もすべてパス