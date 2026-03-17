# タスク完了サマリー

## タスク
ActionBar の数値入力で範囲外の値が入力された際に、`min`/`max` の範囲内に即座にクリップする UX 改善を実装する（タスク 2.1: クリップロジック追加 + タスク 2.2: テスト追加）。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 変更 | `src/ui/ActionBar.tsx` | `handleChipAmountChange` 関数を追加し、入力値を `findRangeAction(mode)` の `min`/`max` 範囲内にクリップ。`onChipAmountChange` prop を `setChipAmount` から `handleChipAmountChange` に差し替え |
| 変更 | `src/ui/ActionBar.test.tsx` | クリップ処理のテスト6件追加（min未満→minにクリップ、max超過→maxにクリップ、範囲内はそのまま、クリップ後Confirm有効、raiseモードでのクリップ、クリップ値でonAction呼出）。クリップ導入により前提が変わった旧バリデーションテスト4件を削除し再構成 |

## 確認コマンド
```bash
npx vitest run
npx tsc --noEmit
npx vite build
```