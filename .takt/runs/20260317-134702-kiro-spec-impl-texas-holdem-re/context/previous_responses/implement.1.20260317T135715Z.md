## 作業結果
- タスク3（ショーダウン時のポット配分の正当性確保）の実装フェーズを完了
- 計画フェーズの分析結果通り、**プロダクションコードの変更は不要**と確認
- 既存の `showdown.ts` が全要件を満たしている：
  - 単一ポット・簡略化配分の仕様がコメントで明記済み
  - 配分ロジックは加算のみ（`p.chips + share + extra`）で、chips が負になる経路が構造的に不在
  - チップ保存則が数学的に保証（`share * winners.length + remainder = pot`）
  - `resolveUncontestedPot` も同様に加算のみで安全

## 変更内容
- プロダクションコードの変更なし
- レポートファイル作成:
  - `coder-scope.md`
  - `coder-decisions.md`

## ビルド結果
- `npx tsc --noEmit` → 型エラーなし（正常終了）

## テスト結果
- `npx vitest run src/domain/showdown.test.ts` → 16テスト全パス
- `npx vitest run` → 全29ファイル・483テスト全パス