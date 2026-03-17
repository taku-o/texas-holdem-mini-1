## 作業結果
- ActionBarコンポーネントを新規作成し、テスト先行で作成された22テストケース（+2テストケースはjest-dom導入で通過）を全てパスさせた
- テスト環境に `@testing-library/jest-dom` を導入し、`toBeDisabled()` マッチャーを有効化

## 変更内容
- **作成**: `src/ui/ActionBar.tsx` — ActionBarコンポーネント（アクションボタン表示、チップ入力UI、有効/無効制御）
- **作成**: `src/test-setup.ts` — テストセットアップファイル（jest-domマッチャー登録）
- **変更**: `vite.config.ts` — setupFilesにtest-setup.tsを追加
- **変更**: `package.json` — `@testing-library/jest-dom` をdevDependenciesに追加

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし（成功）

## テスト結果
- `npx vitest run src/ui/ActionBar.test.tsx` — 24テスト全パス
- `npx vitest run` — 全20テストファイル、313テスト全パス