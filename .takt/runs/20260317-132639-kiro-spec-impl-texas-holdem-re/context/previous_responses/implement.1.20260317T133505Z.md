## 作業結果
- タスク2.1に従い、`ActionBar` の数値入力に min/max クリップ処理を追加しました
- `setChipAmount` を直接渡していた箇所を、クリップロジック付きの `handleChipAmountChange` 関数に置き換えました

## 変更内容
- **変更**: `src/ui/ActionBar.tsx`
  - `handleChipAmountChange` 関数を新規追加（L69-75）: 入力値を `findRangeAction(mode)` の `min`/`max` でクリップしてから `setChipAmount` を呼び出す
  - `ChipInput` への `onChipAmountChange` prop を `setChipAmount` → `handleChipAmountChange` に変更（L114）

## ビルド結果
- `tsc -b --noEmit` — 型エラーなし（成功）

## テスト結果
- `npx vitest run src/ui/ActionBar.test.tsx` — 39テスト全パス
- `npx vitest run` — 全29ファイル、483テスト全パス（既存テストへの影響なし）