## 作業結果
- タスク 3.1 に従い、`@pokertools/evaluator` を用いたハンド評価アダプタ `evaluate(cards: Card[]): HandRank` を実装しました
- ドメイン型（`Card`, `Rank`, `Suit`）からライブラリ形式（`"As"`, `"Th"` 等）への変換マッピングを定義
- ライブラリの `HandRank` const enum（0〜8）からドメインの `HandRankCategory` への変換テーブルを定義
- ロイヤルフラッシュとストレートフラッシュの区別は、ライブラリのスコア値（`score === 1` がロイヤルフラッシュ）で判定

## 変更内容
| 種別 | ファイル | 内容 |
|------|---------|------|
| 作成 | `src/domain/handEvaluator.ts` | `evaluate` 関数の実装（61行） |
| 追加 | `package.json` | `@pokertools/evaluator` を dependencies に追加 |

## ビルド結果
- `tsc -b --noEmit` — 型エラーなし（成功）

## テスト結果
- `npm test` — 全 63 テスト合格（4ファイル）
  - `handEvaluator.test.ts`: 23テスト全パス
  - `types.test.ts`: 28テスト全パス
  - `constants.test.ts`: 10テスト全パス
  - `App.test.tsx`: 2テスト全パス