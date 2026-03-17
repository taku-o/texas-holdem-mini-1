All fixes are applied correctly.

## 作業結果
- レビューで指摘された2件の問題を修正した
  - **AI-UNUSED-IMPORT-debug_game-L3 (dead-code)**: `debug_game.ts` から未使用の `isBettingRoundComplete` インポートを削除
  - **AI-SCOPE-SHRINK-debug_game3 (scope-shrink)**: `debug_common.ts` の `executeBettingRound` にオプショナルな `ActionLogger` コールバックを追加し、`debug_game3.ts` のインラインベッティングループを `executeBettingRound` 呼び出しに置換
- `family_tag: dead-code` の再発防止: debug_game3.ts でも `isBettingRoundComplete`, `applyAction` のインポートが不要になったことを確認し削除済み
- `family_tag: scope-shrink` の再発防止テスト: `debug_common.test.ts` に `executeBettingRound` のロガーコールバック呼び出しを検証するテストを追加

## 変更内容
- 変更: `debug_game.ts` — 未使用 `isBettingRoundComplete` インポート削除
- 変更: `debug_common.ts` — `ActionLogger` 型エクスポートと `executeBettingRound` へのオプショナル `logger` パラメータ追加
- 変更: `debug_game3.ts` — `executeBettingRound` + `ActionLogger` を使用するリファクタリング、未使用インポート (`applyAction`, `isBettingRoundComplete`) 削除
- 変更: `debug_common.test.ts` — ロガーコールバック検証テスト追加

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし（成功）

## テスト結果
- `npx vitest run` — 23ファイル、382テスト全パス（3.10s）
- デバッグスクリプト3本の動作確認: 変更前と同一の出力を確認

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 0 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回修正） | 2 |

## 証拠
- `grep isBettingRoundComplete debug_game.ts` → 0件（未使用インポート削除確認）
- `grep isBettingRoundComplete debug_game3.ts` → 0件（不要インポート残存なし）
- `grep applyAction debug_game3.ts` → 0件（不要インポート残存なし）
- `grep executeBettingRound debug_game3.ts` → L7,L36で使用確認（共有モジュール利用）
- `npx tsx debug_game3.ts` → 変更前と同一のログ出力
- `debug_common.test.ts` → ロガーテスト追加、19テスト全パス