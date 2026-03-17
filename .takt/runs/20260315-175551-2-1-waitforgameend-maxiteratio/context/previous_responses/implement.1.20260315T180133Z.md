## 作業結果
- `ActionLogger` 型を3引数から4引数（`actions: PlayerAction[]` 追加）に拡張
- `executeBettingRound` 内でロガー呼び出し時に `actions` を4番目の引数として渡すよう変更
- `debug_game3.ts` のロガーから冗長な `getValidActions()` 呼び出しを除去し、`executeBettingRound` から渡される `actions` を利用するよう変更
- 不要になった `getValidActions` のインポートを `debug_game3.ts` から削除
- `waitForGameEnd` の maxIterations 到達時エラースローは前ムーブメント（write_tests）で既にテストファイルに実装済み

## 変更内容
| 種別 | ファイル | 内容 |
|------|---------|------|
| 変更 | `debug_common.ts` | `ActionLogger` 型に4番目の引数 `actions: PlayerAction[]` を追加。`executeBettingRound` のロガー呼び出しに `actions` を渡すよう変更 |
| 変更 | `debug_game3.ts` | ロガーが4引数を受け取るよう変更。冗長な `getValidActions()` 呼び出しを除去。不要なインポートを削除 |

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし ✅

## テスト結果
- `npx vitest run` — 全23ファイル、383テストパス ✅