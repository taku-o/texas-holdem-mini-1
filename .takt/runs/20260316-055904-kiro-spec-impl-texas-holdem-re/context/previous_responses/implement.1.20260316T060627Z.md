## 作業結果
- 計画に従い、`handEvaluator.ts` のロイヤルフラッシュ判定をライブラリ内部定数（マジックナンバー）に依存しない形に変更した
- `LIB_RANK_TO_CATEGORY`（数値→カテゴリ）を `DESCRIPTION_TO_CATEGORY`（文字列→カテゴリ）に置き換え、`rankDescription` APIを使用
- `ROYAL_FLUSH_SCORE` 定数を削除し、ドメイン条件（straight-flush + 10,J,Q,K,Aがすべて含まれる）で判定するよう変更
- `evaluate` 関数のシグネチャ・戻り値型は不変

## 変更内容
- `src/domain/handEvaluator.ts` — `rankDescription` のimport追加、`LIB_RANK_TO_CATEGORY` → `DESCRIPTION_TO_CATEGORY` 置換、`ROYAL_FLUSH_SCORE` → `ROYAL_FLUSH_RANKS` 置換、`evaluate` 内部ロジック更新

## ビルド結果
- TypeScript型チェック: handEvaluator関連のエラーなし（`ActionBar.tsx` に既存の型エラーあり、本変更とは無関係）

## テスト結果
- `npx vitest run src/domain/handEvaluator.test.ts` → 25テスト全パス
- `npx vitest run` → 全24ファイル・437テスト全パス