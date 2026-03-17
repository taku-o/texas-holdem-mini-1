## arch-review
ファクトチェック完了。レビューに必要な情報が全て揃いました。

---

## Architecture Review — 1回目

### 判定: **REJECT**

---

### 前回指摘の追跡

| finding_id | 前回状態 | 今回状態 | 備考 |
|---|---|---|---|
| `MISSING_CARD_TYPE_IMPORT_HAND_EVALUATOR` | new (ai_review) | **persists** | AI レビューのスコープだが、変更ファイル内の型安全性問題としてアーキテクチャでも追跡 |
| `MISSING_CARD_TYPE_IMPORT_SHOWDOWN` | new (ai_review) | **persists** | 同上 |

---

### ブロッキング問題

#### finding_id: `DUPLICATE_CREATE_SIMPLE_DECK` (new)

**ファイル:** `src/domain/testHelpers.ts:8-14`
**参照:** `src/domain/deck.ts:8-10`

**問題:** `testHelpers.ts` の `createSimpleDeck()` は `deck.ts` の `createDeck()` と本質的に同一のロジックを再実装している。

```typescript
// testHelpers.ts:8-14 — 再実装
export function createSimpleDeck(): Card[] {
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs']
  const ranks: Card['rank'][] = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
  ]
  return suits.flatMap((suit) => ranks.map((rank) => card(rank, suit)))
}

// deck.ts:8-10 — 既存のプロダクションコード
export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })))
}
```

両関数とも4スート×13ランク=52枚の `Card[]` を返す。テストヘルパーの責務は「テスト用のデータを組み立てること」であり、デッキ生成ロジック自体の再実装ではない。

**修正案:** `testHelpers.ts` で `createDeck` を `deck.ts` からインポートして使う。`createSimpleDeck` をエクスポートから削除し、`testHelpers.ts` 内部では `createDeck()` を直接使用する。`createSimpleDeck` のテスト（`testHelpers.test.ts:39-91`）は `createDeck` のテストと重複するため削除する。

```typescript
// testHelpers.ts — 修正後
import type { Card, Player, GameState } from './types'
import { createDeck } from './deck'

export const card = (rank: Card['rank'], suit: Card['suit']): Card => ({
  rank,
  suit,
})

// createSimpleDeck を削除し、createTestState 内で createDeck() を使用
export function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    // ...
    deck: createDeck(),
    // ...
  }
}
```

**根拠:** ポリシーのREJECT基準「本質的に同じロジックの重複（DRY違反）」に該当。変更ファイル内（新規追加ファイル）の問題であり、ボーイスカウトルールではなく今回の変更で導入された問題。

---

#### finding_id: `MISSING_CARD_TYPE_IMPORT_HAND_EVALUATOR` (persists)

**ファイル:** `src/domain/handEvaluator.test.ts:10, 29, 48, 67, 86, 105, 124, 143, 162, 181, 202, 211, 234, 243, 265, 274, 294, 303, 312, 336, 353, 371, 392, 414, 436, 457, 476, 495` (全28箇所)

**問題:** `Card[]` 型注釈を使用しているが、`Card` 型が `./types` からインポートされていない。`import { card } from './testHelpers'` のみ存在（3行目）。

**未解決の根拠:** `handEvaluator.test.ts:3` のインポート文に `Card` 型が含まれず、10行目で `const cards: Card[] = [` が未定義型を参照している。

**修正案:**
```typescript
// src/domain/handEvaluator.test.ts:3 の後に追加
import type { Card } from './types'
```

---

#### finding_id: `MISSING_CARD_TYPE_IMPORT_SHOWDOWN` (persists)

**ファイル:** `src/domain/showdown.test.ts:40, 72, 101`

**問題:** `Card[]` 型注釈を使用しているが、`Card` 型がインポートされていない。7行目の `import type { GameState, Player } from './types'` に `Card` が含まれていない。

**未解決の根拠:** `showdown.test.ts:7` のインポート文に `Card` がなく、40行目で `const communityCards: Card[] = [` が未定義型を参照している。

**修正案:**
```typescript
// src/domain/showdown.test.ts:7 を変更
import type { Card, GameState, Player } from './types'
```

---

### 警告（非ブロッキング）

#### W1: `betting.test.ts` と `handProgression.test.ts` のローカル `createTestState` がほぼ同一

**ファイル:** `src/domain/betting.test.ts:12-20`, `src/domain/handProgression.test.ts:13-19`

**問題:** 両ファイルのローカルラッパーがほぼ同じデフォルト値（`pot: 15, currentBet: BIG_BLIND, currentPlayerIndex: 3`）を設定しており、唯一の差分は `betting.test.ts` の `deck: []` のみ。設計判断（coder-decisions.md）でローカルラッパーの使用は承認済みだが、差分が極めて小さい。

**備考:** テストファイルの重複はポリシー上 Warning 扱い。実害（フレーク、検知漏れ等）は確認されない。

#### W2: `testHelpers.ts` がプロダクションビルドに含まれる可能性

**ファイル:** `src/domain/testHelpers.ts`

**問題:** ファイル名に `.test.` を含まないため、`tsconfig.app.json:22` の `exclude` パターン `["src/**/*.test.tsx", "src/**/*.test.ts"]` に一致せず、`tsc -b` でプロダクションコードとしてコンパイル対象になる。

**備考:** タスクスコープを逸脱するリファクタリング（テストディレクトリの分離等）のため非ブロッキング。`tsconfig.app.json` の `exclude` に `src/**/testHelpers.ts` を追加する、または `testHelpers.test-utils.ts` のようなパターンに一致する名前にリネームすることを推奨。

---

### 問題なしの確認事項

| 観点 | 結果 |
|------|------|
| ファイル分割 | OK — `testHelpers.ts` は44行、単一責務 |
| モジュール構成（高凝集・低結合） | OK — テストヘルパーが1モジュールに集約され、各テストファイルから適切にインポート |
| ローカルラッパーパターン | OK — 文脈固有のデフォルト値を薄いラッパーで吸収する設計は妥当（coder-decisions.md記載） |
| 循環依存 | なし — `testHelpers.ts` → `types.ts` の一方向のみ |
| オブジェクト直接変更 | なし — スプレッド構文で新オブジェクトを生成 |
| デッドコード（`DUPLICATE_CREATE_SIMPLE_DECK` 以外） | なし — `card`, `createTestPlayer`, `createTestState` は全て使用箇所あり |
| 呼び出しチェーン | OK — 全エクスポートに使用箇所あり |
| 変更スコープ | Small（testHelpers.ts:44行, testHelpers.test.ts:287行 新規追加 + 各テストファイルのインポート変更） — 適切 |
| 操作の一覧性 | OK — テスト生成操作（card, createTestPlayer, createTestState, createSimpleDeck）が `testHelpers.ts` に一覧化 |

---

### 変更スコープ評価

- **サイズ:** Small（新規2ファイル + 既存テストファイルのインポート変更）
- **論理的まとまり:** テストヘルパーの集約という単一目的に限定されており、適切

---

## supervise
重大な発見です。`handEvaluator.test.ts` の diff を見ると、**元々あった `import type { Card } from './types'` が削除されている**のに、`Card[]` 型注釈が28箇所残っています。これはこのタスクで導入されたリグレッションです。

最終検証の結果をまとめます。

---

# 最終検証結果

## 結果: REJECT

## 要件充足チェック

タスク指示書: 「テストヘルパーの重複（card, createTestPlayer, createTestState等）を修正」

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1 | `card` 関数の重複を共通ヘルパーに集約 | ✅ | `src/domain/testHelpers.ts:3-6` に定義、5テストファイルすべてで `import { card } from './testHelpers'` に置換済み |
| 2 | `createTestPlayer` 関数の重複を共通ヘルパーに集約 | ✅ | `src/domain/testHelpers.ts:16-26` に定義、各テストから直接インポートまたはローカルラッパー経由で使用 |
| 3 | `createTestState` 関数の重複を共通ヘルパーに集約 | ✅ | `src/domain/testHelpers.ts:28-44` に定義、各テストからローカルラッパー経由で使用 |
| 4 | `createSimpleDeck` 関数の重複を共通ヘルパーに集約 | ✅ | `src/domain/testHelpers.ts:8-14` に定義、テストファイル内のローカル定義は除去済み |
| 5 | 既存テストが引き続き動作する | ✅ | `vitest run` → 12ファイル 188テスト全パス |
| 6 | AIレビュー指摘事項の修正（Card型インポート漏れ） | ❌ | `handEvaluator.test.ts:10` で `Card[]` 使用、`Card` インポートなし（リグレッション）。`showdown.test.ts:40,72,101` で同様 |

## 検証サマリー
| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `vitest run` (12 files, 188 passed) |
| ビルド | ✅ | `tsc -b` 成功（テストファイルが除外されるため顕在化しない） |
| ヘルパー集約 | ✅ | grep確認：テストファイルにローカルの `card`/`createSimpleDeck` 定義なし |
| AIレビュー対応 | ❌ | 2件のブロッキング指摘が未修正 |

## 成果物
- 作成: `src/domain/testHelpers.ts`, `src/domain/testHelpers.test.ts`
- 変更: `src/domain/handEvaluator.test.ts`, `src/domain/betting.test.ts`, `src/domain/dealing.test.ts`, `src/domain/handProgression.test.ts`, `src/domain/showdown.test.ts`

## 未完了項目（REJECTの理由）

| # | finding_id | 項目 | 理由 |
|---|------------|------|------|
| 1 | `AI-MISSING-CARD-IMPORT-HAND-EVAL` | `src/domain/handEvaluator.test.ts` の `Card` 型インポート欠落 | **リグレッション**: 元コードでは `import type { Card } from './types'` が存在していたが、`card` 関数のローカル定義を削除する際に一緒に削除された。しかし `Card[]` 型注釈は28箇所で使用されたまま。修正: `import type { Card } from './types'` を追加 |
| 2 | `AI-MISSING-CARD-IMPORT-SHOWDOWN` | `src/domain/showdown.test.ts` の `Card` 型インポート欠落 | 7行目で `import type { GameState, Player } from './types'` に `Card` が含まれていない。`Card[]` が3箇所で使用されている。修正: `import type { Card, GameState, Player } from './types'` に変更 |