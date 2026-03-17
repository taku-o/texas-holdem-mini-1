# 決定ログ

## 1. @testing-library/jest-dom の導入
- **背景**: テストが `toBeDisabled()` マッチャーを使用しているが、`@testing-library/jest-dom` が未インストールでテストが失敗した
- **検討した選択肢**: (1) jest-domパッケージを導入しセットアップファイルを追加する (2) テストを書き換えてdisabled属性を直接チェックする（例: `getAttribute('disabled')`）
- **理由**: テストは既に作成済みで修正最小化が求められるため、jest-domを導入した。`src/test-setup.ts` を作成し `vite.config.ts` の `setupFiles` に登録した

## 2. 全アクションボタンの常時レンダリング（disabled制御方式）
- **背景**: テストが `queryByRole('button', { name: /^bet$/i })` で無効なアクションのボタン存在を確認し、`toBeDisabled()` で無効状態を検証している。ボタンの表示方式を決める必要があった
- **検討した選択肢**: (1) validActionsに含まれるアクションのみボタンを表示する (2) 全5アクションタイプのボタンを常時表示し、validActionsに含まれないものはdisabledにする
- **理由**: テストが無効ボタンの存在とdisabled状態を検証しているため、全ボタン常時表示＋disabled制御を採用した

## 3. ChipInputの内部コンポーネント分離
- **背景**: ActionBarコンポーネント内にチップ入力UI（スライダー、数値入力、確定/キャンセル/All-inボタン）を含める必要があった
- **検討した選択肢**: (1) ActionBar内にインラインで全JSXを記述する (2) ChipInput を同一ファイル内の内部関数コンポーネントとして分離する
- **理由**: 1関数1責務の原則に従い、チップ入力UIの描画責務をChipInputに分離した。外部からは使用されないため同一ファイル内の非エクスポート関数とした