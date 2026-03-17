修正完了。`family_tag` 関連の再発防止テストについて確認 — この指摘はビルドエラー（型エラー）であり、ビルド成功自体が再発防止の証拠です。型ガード関数 `isChipInputAction` により型レベルで保護されているため、追加のランタイムテストは不要です。

## 作業結果
- `SUP-001-ActionBar-L35-TS2345`（TypeScriptビルドエラー）を修正
- `CHIP_INPUT_ACTIONS` を `as const` に変更し、型ガード関数 `isChipInputAction` を導入して型絞り込みを有効化

## 変更内容
- `src/ui/ActionBar.tsx`: `CHIP_INPUT_ACTIONS` の型を `ActionType[]` から `readonly ('bet' | 'raise')[]`（`as const`）に変更。`ChipInputAction` 型と `isChipInputAction` 型ガード関数を追加。`handleButtonClick` 内の `CHIP_INPUT_ACTIONS.includes()` を `isChipInputAction()` に置換。

## ビルド結果
- `npm run build` — 成功（エラーなし）

## テスト結果
- `npx vitest run` — 26ファイル 475テスト全パス

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 1 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `supervisor-validation.md` で `SUP-001-ActionBar-L35-TS2345` を確認（TS2345ビルドエラー）
- `ai-review.md` — APPROVE、指摘なし
- `architect-review.md` — APPROVE、指摘なし
- `npm run build` 成功ログ確認（67モジュール変換、ビルド完了）
- `npx vitest run` — 475テスト全パス