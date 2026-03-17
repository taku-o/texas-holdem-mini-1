## 作業結果
- `waitForGameEnd` ヘルパー関数に `maxIterations` 到達時のエラースローを追加
- `debug_common.test.ts` の既存ロガーテストを新しい `ActionLogger` 型シグネチャ（4引数）に更新
- `debug_common.test.ts` に `actions` パラメータがロガーに正しく渡されることを検証する新テストを追加

## 変更内容
| 種別 | ファイル | 内容 |
|------|---------|------|
| 変更 | `src/application/useGameController.test.ts` | `waitForGameEnd` に maxIterations 到達時のエラースロー追加 |
| 変更 | `debug_common.test.ts` | 既存ロガーテストの引数を4引数に更新 + `actions` パラメータ検証テスト追加 |