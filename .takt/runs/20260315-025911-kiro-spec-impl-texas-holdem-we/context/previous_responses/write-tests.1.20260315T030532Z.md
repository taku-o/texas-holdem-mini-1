## 作業結果
- 計画に基づき、`evaluate(cards: Card[]): HandRank` 関数のユニットテストを作成しました
- 既存テスト（`constants.test.ts`, `types.test.ts`）のパターンに従い、vitest + Given-When-Then 構造で記述しました
- インテグレーションテストは不要と判断しました（単一モジュールの純粋変換、3モジュール横断なし）

## 変更内容
- **作成**: `src/domain/handEvaluator.test.ts`

### テストケース一覧（20テスト）

| カテゴリ | テスト内容 |
|---------|-----------|
| **役カテゴリの判定（10テスト）** | royal-flush, straight-flush, four-of-a-kind, full-house, flush, straight, three-of-a-kind, two-pair, one-pair, high-card の各判定 |
| **ロイヤルフラッシュ区別（1テスト）** | royal-flush と straight-flush が正しく区別されること |
| **スコア比較（3テスト）** | 同一カテゴリ内のスコア比較、RF vs SF のスコア比較、異なるカテゴリ間のスコア順序 |
| **カード枚数（3テスト）** | 5枚・6枚・7枚入力それぞれで正しく動作すること |
| **返り値の構造（2テスト）** | category と score プロパティの存在・型、スコアが正の整数であること |
| **ランク10の変換（1テスト）** | ドメイン型 `'10'` → ライブラリ形式 `'T'` の変換が機能すること |
| **エッジケース（3テスト）** | 7枚から最良の5枚を選択、エースローストレート（A-2-3-4-5）、エースハイストレート（10-J-Q-K-A） |