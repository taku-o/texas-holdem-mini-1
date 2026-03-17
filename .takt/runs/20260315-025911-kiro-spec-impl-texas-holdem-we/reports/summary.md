# タスク完了サマリー

## タスク
タスク 3.1: `@pokertools/evaluator` を用いて、7枚のカードから最良の5枚役のランクを返すアダプタを実装する。同一役の場合はキッカー等で比較可能なスコアを返す。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 作成 | `src/domain/handEvaluator.ts` | @pokertools/evaluator のアダプタ。Card[] → HandRank（category + score）を返す（57行） |
| 作成 | `src/domain/handEvaluator.test.ts` | 全10役カテゴリ・スコア比較・エッジケース等 23テストケース（515行） |
| 変更 | `package.json` | `@pokertools/evaluator: ^1.0.1` を dependencies に追加 |
| 変更 | `package-lock.json` | 依存解決の更新 |

## 確認コマンド
```bash
npx vitest run
npx tsc --noEmit
```