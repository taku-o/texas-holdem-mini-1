影響範囲確認完了。`ActionLogger` 型を使っている箇所は3つ:
1. `debug_game3.ts:30` - 修正対象
2. `debug_common.test.ts:84` - テスト内のロガー（第5引数を使わないが、追加引数なので受け取らなくてもOK）
3. `debug_common.ts` - 型定義と呼び出し元

TypeScriptでは関数の引数を少なく受け取ることは型安全なので、`debug_common.test.ts` のロガーはそのままで型エラーにならない。

---

### 最終計画まとめ

| # | 対象ファイル | 変更内容 | 注意点 |
|---|---|---|---|
| 1 | `src/application/useGameController.test.ts` | `waitForGameEnd` にmaxIterations到達時のエラースロー追加 | 既存テストへの影響なし |
| 2 | `debug_common.ts` | `ActionLogger` 型に `actions` パラメータ追加、`logger` 呼び出しに `actions` を渡す | `debug_common.test.ts` のロガーは引数省略可のため変更不要 |
| 3 | `debug_game3.ts` | ロガーで引数から `actions` を受け取り、`getValidActions` のimportと直接呼び出しを削除 | import行の削除を忘れないこと |

**参照すべき既存実装パターン:**
- `executeBettingRound` の `actions` 取得パターン: `debug_common.ts:27`
- `ActionLogger` 型定義: `debug_common.ts:11-15`

**アンチパターン注意:**
- 修正1: エラーメッセージに `maxIterations` の値を含めること（デバッグ容易性）
- 修正2: import文の不要な残留に注意。`getValidActions` が `debug_game3.ts` で他に使われていないことは確認済み