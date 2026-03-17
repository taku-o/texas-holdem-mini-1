十分な情報が集まりました。計画をまとめます。

---

## 計画レポート

### タスク概要

**タスク 3.1**: `@pokertools/evaluator` を用いて、7枚のカードから最良の5枚役のランクを返すアダプタを実装する。同一役の場合はキッカー等で比較可能なランクを返す。

**対応要件**: 5.4（ショーダウンで役の強さに従って勝者判定）、5.5（標準ルールのハイカード〜ロイヤルストレートフラッシュ）

### 現状分析

**既に完了しているもの:**
- ドメイン型定義（`src/domain/types.ts`）: `Card`, `HandRank`, `HandRankCategory` が定義済み
- 定数定義（`src/domain/constants.ts`）: ゲーム定数が定義済み

**未完了・必要なもの:**
- `@pokertools/evaluator` パッケージが未インストール（`package.json` の dependencies に存在しない）
- `HandEvaluator` アダプタモジュールが未実装

### ライブラリ API 調査結果

`@pokertools/evaluator` の主要 API:

| 関数 | 用途 |
|------|------|
| `evaluate(codes: number[]): number` | 5-7枚のカード整数配列 → スコア（**低いほど強い**: 1=ロイヤルフラッシュ, 7462=最弱ハイカード） |
| `rank(codes: number[]): HandRank` | カード整数配列 → HandRank enum（0-8） |
| `getCardCode(cardStr: string): number` | カード文字列（例: `"Ah"`）→ 整数 |
| `rankDescription(rank: HandRank): string` | HandRank → 人間可読文字列 |

**HandRank enum（ライブラリ側）:**
```
StraightFlush=0, FourOfAKind=1, FullHouse=2, Flush=3, Straight=4,
ThreeOfAKind=5, TwoPair=6, OnePair=7, HighCard=8
```

**カード文字列フォーマット:** `"Ah"` = Ace of hearts, `"Td"` = Ten of diamonds

### 型マッピング設計

**Card → ライブラリ文字列の変換:**

| ドメイン型 | ライブラリ形式 | 変換 |
|-----------|-------------|------|
| `rank: '10'` | `'T'` | `'10'` → `'T'` に変換、他はそのまま |
| `suit: 'spades'` | `'s'` | 先頭1文字を小文字で取得 |
| `suit: 'hearts'` | `'h'` | 同上 |
| `suit: 'diamonds'` | `'d'` | 同上 |
| `suit: 'clubs'` | `'c'` | 同上 |

**ライブラリ HandRank → ドメイン HandRankCategory の変換:**

| ライブラリ HandRank | ドメイン HandRankCategory | 判定条件 |
|-------------------|------------------------|---------|
| `StraightFlush(0)` + score=1 | `'royal-flush'` | score === 1 のみ |
| `StraightFlush(0)` + score>1 | `'straight-flush'` | score > 1 |
| `FourOfAKind(1)` | `'four-of-a-kind'` | |
| `FullHouse(2)` | `'full-house'` | |
| `Flush(3)` | `'flush'` | |
| `Straight(4)` | `'straight'` | |
| `ThreeOfAKind(5)` | `'three-of-a-kind'` | |
| `TwoPair(6)` | `'two-pair'` | |
| `OnePair(7)` | `'one-pair'` | |
| `HighCard(8)` | `'high-card'` | |

**スコア:** ライブラリの `evaluate` が返す値をそのまま `HandRank.score` に格納する。低いほど強いため、比較時は `score` が小さい方が勝者となる。

### 実装アプローチ

#### ファイル構成

| ファイル | 操作 | 責務 |
|---------|------|------|
| `src/domain/handEvaluator.ts` | **新規作成** | HandEvaluator アダプタ（Card[] → HandRank 変換） |
| `package.json` | **変更** | `@pokertools/evaluator` を dependencies に追加 |

#### 新規ファイル: `src/domain/handEvaluator.ts`

**公開関数:**
```typescript
evaluate(cards: Card[]): HandRank
```
- 入力: 5〜7枚の `Card[]`（ドメイン型）
- 出力: `HandRank`（`{ category: HandRankCategory, score: number }`）
- `score` はライブラリの `evaluate()` の戻り値をそのまま使用（低い = 強い）

**内部関数:**
```typescript
cardToString(card: Card): string  // Card → "Ah" 等のライブラリ形式文字列
```

**処理フロー:**
1. `Card[]` を `cardToString` で文字列配列に変換
2. `getCardCode` で各文字列を整数に変換
3. ライブラリの `evaluate(codes)` でスコアを取得
4. ライブラリの `rank(codes)` で HandRank enum を取得
5. ロイヤルフラッシュの判別: `rankValue === HandRank.StraightFlush && score === 1` → `'royal-flush'`
6. その他は enum → ドメイン HandRankCategory のマッピングテーブルで変換
7. `{ category, score }` を返す

#### npm インストール

```bash
npm install @pokertools/evaluator
```

### Coder 向け実装ガイドライン

**参照すべき既存実装パターン:**
- 型定義: `src/domain/types.ts:1-74` — `Card`, `Suit`, `Rank`, `HandRank`, `HandRankCategory` の型定義
- ドメインモジュールの配置パターン: `src/domain/constants.ts` — domain ディレクトリ直下にフラットに配置

**変更の影響範囲:**
- 新規ファイル追加のみのため、既存コードへの影響なし
- 後続タスク（4.4 ショーダウン処理）で `evaluate()` 関数を呼び出す想定

**注意すべきアンチパターン:**
1. **ライブラリ型の漏洩禁止**: `@pokertools/evaluator` の `HandRank` enum やカード整数をアダプタ外に露出しない。公開APIはドメイン型（`Card`, `HandRank`）のみ
2. **`'10'` → `'T'` 変換漏れ**: ドメインの Rank 型は `'10'` だがライブラリは `'T'` を期待する。この変換を忘れるとランタイムエラーになる
3. **スコアの比較方向**: ライブラリのスコアは「低い = 強い」。ドメインの `HandRank.score` にこの値をそのまま格納するため、ショーダウンの勝者判定で比較方向を間違えないこと（後続タスク向けの注意事項）
4. **ファイル行数**: アダプタは薄いラッパーであり、50行以下に収まる見込み。200行を超える場合は設計に問題がある

**テスト方針（write_tests ムーブメント向け）:**
- 既知の7枚カードの組み合わせで、各役カテゴリが正しく判定されることを検証
- ロイヤルフラッシュ vs ストレートフラッシュの区別を検証
- 同一役（例: ワンペア同士）でスコアによる比較が正しく動くことを検証
- 5枚・6枚入力でも動作することを検証
- テストファイル配置: `src/domain/handEvaluator.test.ts`