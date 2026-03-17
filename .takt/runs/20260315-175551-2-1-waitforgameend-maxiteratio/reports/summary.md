# タスク完了サマリー

## タスク
レビュー指摘事項2件の修正：(1) `waitForGameEnd` の maxIterations 到達時にエラーをスローしてサイレント失敗を防止する、(2) `debug_game3.ts` のロガー内での冗長な `getValidActions()` 呼び出しを除去し、`executeBettingRound` で既に取得済みの結果を利用する。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 変更 | `src/application/useGameController.test.ts` | `waitForGameEnd` に maxIterations 到達時のエラースロー追加 |
| 変更 | `debug_common.ts` | `ActionLogger` 型に4番目の引数 `actions: PlayerAction[]` を追加、ロガー呼び出しに `actions` を渡す |
| 変更 | `debug_common.test.ts` | 既存ロガーテストを4引数に更新、4番目引数の検証テスト追加 |
| 変更 | `debug_game3.ts` | ロガーが4引数を受け取るよう変更、冗長な `getValidActions()` 呼び出しと不要インポート削除 |

## 確認コマンド
```bash
npx vitest run
npx tsc --noEmit
```