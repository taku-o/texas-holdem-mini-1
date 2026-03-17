調査が完了しました。現在の実装と要件を分析して計画を立てます。

---

## 計画レポート

### タスク概要

**タスク6**: 役判定のロイヤルフラッシュをライブラリ内部定数に直接依存しない形にする（要件7）

**タスク6.1**: ロイヤルフラッシュの判定を、アプリ側で定義した条件または定数で行うようにし、ライブラリの内部数値に直接依存しないようにする

### 現状分析

**対象ファイル**: `src/domain/handEvaluator.ts`（58行）

現在の実装における問題箇所:

1. **`LIB_RANK_TO_CATEGORY` (行27-37)**: ライブラリの `HandRank` enum の数値（0-8）に直接依存するマッピング。ライブラリの enum 値が変わると壊れる。
2. **`ROYAL_FLUSH_SCORE = 1` (行39)**: ライブラリの `evaluateStrings` が返すスコアのマジックナンバーに依存。ロイヤルフラッシュのスコアが1であるのはライブラリの内部実装の詳細。
3. **`libRank === 0` (行51)**: straight-flush を示す数値0にハードコードで依存。

**ライブラリの公開API**:
- `@pokertools/evaluator` は `HandRank` という `const enum`（0-8）を公開している
- `rankDescription(rank)` でランク名の文字列を取得可能
- `evaluateStrings(cards)` はスコア（数値、低いほど強い）を返す
- `rankBoard(board)` は `HandRank` enum値を返す

### 要件の変更要/不要判定

| 要件 | 判定 | 根拠 |
|------|------|------|
| ロイヤルフラッシュ判定のライブラリ内部定数依存を排除 | **変更要** | `handEvaluator.ts:39,51` で `ROYAL_FLUSH_SCORE = 1` および `libRank === 0` というマジックナンバーに依存。ライブラリ内部実装が変わると壊れる |

### 設計方針

**アプローチ**: ライブラリの数値定数をハードコードする代わりに、「ストレートフラッシュであり、かつ最高ランク（A）を含む」というアプリ側の条件でロイヤルフラッシュを判定する。

**理由**:
- `ROYAL_FLUSH_SCORE = 1` はライブラリの内部実装に完全依存しており、ライブラリのバージョンアップで壊れるリスクがある
- ポーカーのドメイン知識として「ロイヤルフラッシュ = ストレートフラッシュ + T,J,Q,K,A」は不変の定義
- `LIB_RANK_TO_CATEGORY` のマッピングはライブラリの `const enum` 値に依存しているが、ライブラリが公開している `rankDescription` を使うことでマジックナンバー依存を排除できる

**具体的な変更内容**:

1. **ロイヤルフラッシュ判定**: `score === ROYAL_FLUSH_SCORE` を廃止し、アプリ側の条件で判定する
   - カテゴリが straight-flush であり、かつカードに T, J, Q, K, A が含まれているかで判定
   - `ROYAL_FLUSH_SCORE` 定数を削除

2. **`LIB_RANK_TO_CATEGORY` のマジックナンバー排除**: ライブラリの `rankDescription` を使って文字列ベースでカテゴリをマッピングする
   - `rankDescription` が返す文字列（例: "Straight Flush", "Four of a Kind" 等）からアプリの `HandRankCategory` に変換
   - 数値への直接依存がなくなる

### 影響範囲

| ファイル | 影響 |
|---------|------|
| `src/domain/handEvaluator.ts` | 主な変更対象（判定ロジック変更） |
| `src/domain/handEvaluator.test.ts` | テスト自体は既存のテストが通ることを確認（テストのassertionは変更不要のはず） |
| `src/domain/showdown.ts` | `evaluate` の戻り値型は変わらないため影響なし |
| `src/domain/cpuStrategy.ts` | `evaluate` の戻り値型は変わらないため影響なし |

### Coder向け実装ガイドライン

#### 変更対象
- **`src/domain/handEvaluator.ts`** のみ（58行 → 同程度の行数を想定）

#### 実装手順

1. **`rankDescription` を import に追加する**
   - `import { evaluateStrings, rankBoard, rankDescription } from '@pokertools/evaluator'`

2. **`LIB_RANK_TO_CATEGORY` マッピングを rankDescription ベースに変更する**
   - ライブラリの数値ではなく `rankDescription` が返す文字列からマッピングする関数を作成:
   ```typescript
   const DESCRIPTION_TO_CATEGORY: Record<string, HandRankCategory> = {
     'Straight Flush': 'straight-flush',
     'Four of a Kind': 'four-of-a-kind',
     'Full House': 'full-house',
     'Flush': 'flush',
     'Straight': 'straight',
     'Three of a Kind': 'three-of-a-kind',
     'Two Pair': 'two-pair',
     'One Pair': 'one-pair',
     'High Card': 'high-card',
   }
   ```
   - `rankDescription` の戻り値を確認して正確な文字列を使うこと

3. **ロイヤルフラッシュ判定をアプリ側条件に変更する**
   - `ROYAL_FLUSH_SCORE = 1` 定数を削除
   - straight-flush カテゴリの場合に、元のカード（`cards` 引数）に 'T', 'J', 'Q', 'K', 'A' のランクがすべて含まれるかで判定:
   ```typescript
   const ROYAL_FLUSH_RANKS: ReadonlySet<Card['rank']> = new Set(['10', 'J', 'Q', 'K', 'A'])
   
   function isRoyalFlush(category: HandRankCategory, cards: Card[]): boolean {
     if (category !== 'straight-flush') return false
     return [...ROYAL_FLUSH_RANKS].every(r => cards.some(c => c.rank === r))
   }
   ```
   - 注意: カードのランクはアプリ内では `'10'`（`'T'` ではない）。`RANK_TO_LIB` マッピング（行13）参照

4. **`evaluate` 関数内の判定ロジックを更新する**
   - `libRank` の数値比較を `rankDescription` ベースに変更
   - ロイヤルフラッシュ判定を上記の `isRoyalFlush` に変更

5. **不要になったコード・定数を削除する**
   - `ROYAL_FLUSH_SCORE` 定数
   - `LIB_RANK_TO_CATEGORY` マッピング（`DESCRIPTION_TO_CATEGORY` に置き換え）

#### 参照すべき既存実装パターン
- `handEvaluator.ts:4-18` (`RANK_TO_LIB`): Record 型によるマッピングパターン（同じパターンで `DESCRIPTION_TO_CATEGORY` を定義する）
- `handEvaluator.ts:45-57` (`evaluate`): 関数の構造はそのまま維持し、内部ロジックのみ変更

#### 注意すべきアンチパターン
- **マジックナンバー**: `rankDescription` の戻り値文字列は定数として定義済みの `DESCRIPTION_TO_CATEGORY` のキーと一致させること。新たなマジックナンバーを導入しない
- **`rankDescription` の戻り値の正確性**: ライブラリの `HAND_RANK_DESCRIPTIONS` が実際にどのような文字列を返すかを、テスト実行時に確認すること。推測で文字列を書かない
- **インターフェースの変更禁止**: `evaluate` 関数のシグネチャと戻り値型 (`HandRank`) は変更しない。内部実装のみの変更とする

#### スコープ外
- `HandRankCategory` 型の変更は不要
- `showdown.ts` / `cpuStrategy.ts` の変更は不要
- テストファイルの assertion 変更は不要（既存テストがそのまま通ることを確認する）