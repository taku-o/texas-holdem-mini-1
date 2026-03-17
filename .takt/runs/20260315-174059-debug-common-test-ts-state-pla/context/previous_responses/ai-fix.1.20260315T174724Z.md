全19テストがパスしました。

## 確認したファイル
- `debug_common.test.ts:10` — `INITIAL_CHIPS` がインポートされているが、ファイル内で未使用であることを確認

## 実行した検索
- `grep INITIAL_CHIPS debug_common.test.ts` → 10行目のインポートのみ、使用箇所なし

## 修正内容
- `debug_common.test.ts:10`: `import { INITIAL_CHIPS, PLAYER_COUNT }` → `import { PLAYER_COUNT }` に変更。未使用の `INITIAL_CHIPS` インポートを削除

## テスト結果
- `npx vitest run debug_common.test.ts` → 全19テストパス（1ファイル、19テスト）