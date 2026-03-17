# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 6` — 役判定のロイヤルフラッシュをライブラリ内部定数に直接依存しない形にする（タスク6, 6.1）

## 分析結果

### 目的
`src/domain/handEvaluator.ts` のロイヤルフラッシュ判定が `@pokertools/evaluator` ライブラリの内部数値（マジックナンバー）に直接依存しているため、アプリ側で定義した条件で判定するように変更する。

### スコープ
- **変更対象**: `src/domain/handEvaluator.ts`（58行）のみ
- **影響なし**: `showdown.ts`, `cpuStrategy.ts` — `evaluate` 関数のシグネチャ・戻り値型 (`HandRank`) は不変
- **テスト**: `handEvaluator.test.ts`（515行, 24テスト）— 既存テストがそのまま通ることを確認

### 現状の問題箇所

| 箇所 | 問題 |
|------|------|
| `handEvaluator.ts:39` `ROYAL_FLUSH_SCORE = 1` | ライブラリが返すスコア値1にハードコード依存 |
| `handEvaluator.ts:51` `libRank === 0` | straight-flushを示す数値0にハードコード依存 |
| `handEvaluator.ts:27-37` `LIB_RANK_TO_CATEGORY` | ライブラリの `HandRank` enum数値(0-8)にハードコード依存 |

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| A. `rankDescription` で文字列ベースにマッピング＋カード内容でロイヤルフラッシュ判定 | **採用** | ライブラリの数値への依存を完全に排除できる。`rankDescription` はライブラリの公開APIであり、文字列は安定した契約 |
| B. ライブラリの `HandRank` enum をインポートしてマッピング | 不採用 | `const enum` のためランタイムでは数値に展開される。ライブラリバージョンアップで数値が変わるリスクは残る |
| C. スコア値の範囲で判定（閾値ベース） | 不採用 | ライブラリ内部のスコア体系に完全依存。最も脆い |

### 実装アプローチ

1. **`rankDescription` を import に追加**: `import { evaluateStrings, rankBoard, rankDescription } from '@pokertools/evaluator'`

2. **`LIB_RANK_TO_CATEGORY` を `DESCRIPTION_TO_CATEGORY` に置き換え**: ライブラリの `rankDescription(libRank)` が返す文字列からアプリの `HandRankCategory` へマッピングする Record を定義。数値キーを文字列キーに変更する。

3. **ロイヤルフラッシュ判定をドメイン条件に変更**:
   - `ROYAL_FLUSH_SCORE` 定数を削除
   - 代わりに「カテゴリが straight-flush かつ、元のカードに 10, J, Q, K, A のランクがすべて含まれる」というポーカードメインの定義で判定
   - ロイヤルフラッシュランクのセットを定数化: `ROYAL_FLUSH_RANKS: ReadonlySet<Card['rank']> = new Set(['10', 'J', 'Q', 'K', 'A'])`

4. **`evaluate` 関数の内部ロジック更新**:
   - `rankBoard` の戻り値を `rankDescription` に渡してカテゴリ文字列を取得
   - `DESCRIPTION_TO_CATEGORY` でアプリの `HandRankCategory` に変換
   - ロイヤルフラッシュは上記のドメイン条件で判定

5. **不要コード削除**: `ROYAL_FLUSH_SCORE`, `LIB_RANK_TO_CATEGORY`

## 実装ガイドライン

- **`evaluate` 関数のシグネチャと戻り値型は変更しない**。内部実装のみの変更
- **カードのランクはアプリ内では `'10'`**（ライブラリ向けの `'T'` ではない）。`RANK_TO_LIB` マッピング（行4-18）参照
- **`rankDescription` の戻り値文字列を推測で書かない**。ライブラリの `HAND_RANK_DESCRIPTIONS` エクスポートまたは実際の戻り値を確認して正確な文字列を使うこと
- **参照すべき既存パターン**: `handEvaluator.ts:4-18` の `RANK_TO_LIB`（Record型マッピング）— 同パターンで `DESCRIPTION_TO_CATEGORY` を定義する
- **マジックナンバー禁止**: 新たな数値リテラルへの依存を導入しない
- **`libRank` を `rankDescription` に渡す際の型**: `rankBoard` の戻り値は `HandRank`（`const enum`、実体は number）。`rankDescription` はそのまま受け取れる

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| `HandRankCategory` 型の変更 | 既存の型定義で十分。変更不要 |
| `showdown.ts` / `cpuStrategy.ts` の変更 | `evaluate` のインターフェースは不変のため影響なし |
| テストの assertion 変更 | 既存テストは判定結果の正しさを検証しており、内部実装変更後もそのまま通るはず |