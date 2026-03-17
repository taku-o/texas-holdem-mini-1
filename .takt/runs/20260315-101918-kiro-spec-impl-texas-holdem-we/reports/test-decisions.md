# 決定ログ

## 1. React Hooks テストに renderHook を使用
- **背景**: useGameController はカスタムフックであり、通常のコンポーネントとしてテストできない
- **検討した選択肢**: (A) @testing-library/react の renderHook を使用, (B) テスト用ラッパーコンポーネントを作成して render でテスト
- **理由**: プロジェクトに @testing-library/react が既にインストールされており、renderHook は React Hooks のテストの標準的なアプローチ。ラッパーコンポーネントは不要な複雑性を追加する

## 2. インテグレーションテストは作成しない
- **背景**: useGameController は gameFlow.ts と gameSetup.ts を呼ぶだけの薄いラッパー。3モジュール横断のデータフローはあるが、gameFlow.test.ts で既に gameSetup → gameFlow の統合テストが充実している
- **検討した選択肢**: (A) 別ファイルでインテグレーションテスト作成, (B) ユニットテスト内で統合的なシナリオも含める
- **理由**: ユニットテスト内でゲーム終了まで連続操作するテスト（フォールド繰り返しでゲームオーバー）が実質的にインテグレーションテストとして機能しており、別ファイルは不要