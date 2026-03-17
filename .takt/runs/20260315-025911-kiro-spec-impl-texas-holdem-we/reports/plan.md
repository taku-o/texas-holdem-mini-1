# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 3` — タスク 3.1「@pokertools/evaluator を用いて、7枚のカードから最良の5枚役のランクを返すアダプタを実装する（役はハイカード〜ロイヤルストレートフラッシュ）。同一役の場合はキッカー等で比較可能なランクを返す」

## 分析結果

### 目的
ドメイン型 `Card[]` を受け取り、`@pokertools/evaluator` ライブラリを内部で呼び出して、ドメイン型 `HandRank`（`{ category: HandRankCategory, score: number }`）を返すアダプタモジュールを実装する。ライブラリの詳細をドメイン層から隠蔽し、公開APIはドメイン型のみとする。

### 参照資料の調査結果

**@pokertools/evaluator (v1.0.1) の API:**

| 関数 | シグネチャ | 用途 |
|------|----------|------|
| `evaluate` | `(codes: number[]) => number` | 5-7枚の整数配列 → スコア（低い=強い。1=Royal Flush, 7462=最弱High Card） |
| `rank` | `(codes: number[]) => HandRank` | 整数配列 → HandRank enum（0-8） |
| `getCardCode` | `(cardStr: string) => number` | カード文字列（例:`"Ah"`）→ 整数 |
| `rankDescription` | `(rank: HandRank) => string` | HandRank → 人間可読文字列 |

**ライブラリ HandRank enum:**
`StraightFlush=0, FourOfAKind=1, FullHouse=2, Flush=3, Straight=4, ThreeOfAKind=5, TwoPair=6, OnePair=7, HighCard=8`

**カード文字列フォーマット:** `"Ah"` = Ace of hearts, `"Td"` = Ten of diamonds

**現在の実装との差異:**
- `@pokertools/evaluator` は未インストール（`package.json` の dependencies に不在）
- ドメイン型（`Card`, `HandRank`, `HandRankCategory`）は `src/domain/types.ts:1-74` で定義済み
- アダプタモジュールは未実装

### スコープ

| ファイル | 操作 | 内容 |
|---------|------|------|
| `package.json` | 変更 | `@pokertools/evaluator` を dependencies に追加（`npm install`） |
| `src/domain/handEvaluator.ts` | 新規作成 | アダプタモジュール |
| `src/domain/handEvaluator.test.ts` | 新規作成 | 単体テスト |

既存ファイルへのコード変更なし。後続タスク（4.4 ショーダウン）がこのアダプタを利用する。

### 実装アプローチ

**新規ファイル `src/domain/handEvaluator.ts` の構成:**

1. **内部関数 `cardToLibraryString(card: Card): string`** — ドメインの `Card` をライブラリが期待する文字列に変換
   - `rank: '10'` → `'T'`（それ以外はそのまま）
   - `suit: 'spades'` → `'s'`, `'hearts'` → `'h'`, `'diamonds'` → `'d'`, `'clubs'` → `'c'`
   - 例: `{ rank: 'A', suit: 'hearts' }` → `"Ah"`

2. **公開関数 `evaluateHand(cards: Card[]): HandRank`** — メインのアダプタ関数
   - `Card[]` を文字列配列に変換し、`getCardCode` で整数化
   - `evaluate(codes)` でスコア取得（低い=強い）
   - `rank(codes)` でカテゴリ取得
   - ロイヤルフラッシュ判別: `rankValue === HandRank.StraightFlush && score === 1` → `'royal-flush'`、それ以外の StraightFlush → `'straight-flush'`
   - 結果を `{ category: HandRankCategory, score: number }` として返す

**ライブラリ HandRank → ドメイン HandRankCategory のマッピング:**

| ライブラリ enum | ドメイン category | 特記事項 |
|---------------|-----------------|---------|
| `StraightFlush(0)` + score===1 | `'royal-flush'` | スコア1のみ |
| `StraightFlush(0)` + score>1 | `'straight-flush'` | スコア2-10 |
| `FourOfAKind(1)` | `'four-of-a-kind'` | |
| `FullHouse(2)` | `'full-house'` | |
| `Flush(3)` | `'flush'` | |
| `Straight(4)` | `'straight'` | |
| `ThreeOfAKind(5)` | `'three-of-a-kind'` | |
| `TwoPair(6)` | `'two-pair'` | |
| `OnePair(7)` | `'one-pair'` | |
| `HighCard(8)` | `'high-card'` | |

## 実装ガイドライン

- **参照すべき既存パターン:** `src/domain/types.ts:1-74` の型定義（`Card`, `Suit`, `Rank`, `HandRank`, `HandRankCategory`）。`src/domain/constants.ts` のモジュール配置パターン（domain ディレクトリ直下にフラット配置）
- **ライブラリ型の漏洩禁止:** `@pokertools/evaluator` の `HandRank` enum、カード整数型、`getCardCode` 等をアダプタ外にエクスポートしない。公開APIはドメイン型 `Card` と `HandRank` のみ
- **`'10'` → `'T'` 変換:** ドメインの Rank 型は `'10'` だがライブラリは `'T'` を期待する。この変換を `cardToLibraryString` 内で確実に行う
- **スコアの比較方向:** ライブラリの evaluate は「低い値 = 強い手」を返す。`HandRank.score` にこの値をそのまま格納する。後続タスク（4.4 ショーダウン）で `score` が小さい方が勝者となる
- **ファイルサイズ:** アダプタは薄いラッパー。50行以下に収まる見込み。マッピングテーブル含めても100行以内
- **npm install:** `npm install @pokertools/evaluator` を実行して dependencies に追加すること

**テスト方針:**
- 各役カテゴリ（10種）について既知の7枚カード組み合わせで `category` を検証
- ロイヤルフラッシュ vs ストレートフラッシュの区別を検証（score===1 の境界）
- 同一役同士でスコア比較が正しく機能することを検証（例: 強いワンペア vs 弱いワンペアで score の大小が正しい）
- 5枚・6枚入力での動作を検証
- テストファイル: `src/domain/handEvaluator.test.ts`