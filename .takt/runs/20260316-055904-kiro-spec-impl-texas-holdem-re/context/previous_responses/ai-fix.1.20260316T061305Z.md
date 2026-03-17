全437テスト合格です。

---

## 確認したファイル
- `src/domain/handEvaluator.ts:63-68` — `cardRanks`が全入力カード（最大7枚）のランクで構成され、ベスト5枚以外のAがあるとロイヤルフラッシュ誤判定になるバグを確認

## 実行した検索
- `grep "royal.?flush|score.*===.*1"` — ロイヤルフラッシュ関連コードの使用箇所を確認
- `evaluateStrings`のスコア値を検証: ロイヤルフラッシュ=`1`、K-high SF=`2`、7枚入力のK-high SF+A♠=`2`

## 修正内容
- **AR-001 修正**: `ROYAL_FLUSH_RANKS`セットと全入力カードのランク比較ロジックを削除し、`score === ROYAL_FLUSH_SCORE`（`ROYAL_FLUSH_SCORE = 1`）でロイヤルフラッシュを識別するように変更。これにより7枚入力時にベスト5枚がK-high SFでも別スートのAに影響されなくなった。

## テスト結果
- `npx vitest run src/domain/handEvaluator.test.ts` — 25テスト全合格
- `npx vitest run` — 全24ファイル、437テスト全合格