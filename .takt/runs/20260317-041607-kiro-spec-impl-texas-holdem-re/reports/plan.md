# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 10` — リスト表示の key を安定した識別子にする

## 分析結果

### 目的
React の `key` prop に配列の index を使用している箇所を、カードの一意識別子（`suit` + `rank`）に変更し、再描画の安定性を確保する。

### スコープ

| サブタスク | 変更要否 | 根拠 |
|-----------|---------|------|
| 10.1 コミュニティカードの key | **変更要** | `src/ui/TableView.tsx:13-14` で `key={index}` を使用 |
| 10.2 席やカードのリストの key | **一部変更要** | `src/ui/PlayerSeat.tsx:31-32` でホールカードに `key={index}` を使用。`src/ui/PlayerSeats.tsx:32` は既に `key={player.id}` で正しく、変更不要 |

変更対象ファイル:
- `src/ui/TableView.tsx` — 14行目の1箇所
- `src/ui/PlayerSeat.tsx` — 32行目の1箇所

### 実装アプローチ

`Card` 型は `{ suit: Suit, rank: Rank }` で構成され（`src/domain/types.ts`）、`id` フィールドは持たない。デッキ内のカードは `suit` + `rank` の組み合わせで一意なため、テンプレートリテラル `` `${card.suit}-${card.rank}` `` を key として使用する。

**変更内容:**

1. **`src/ui/TableView.tsx:14`**
   ```tsx
   // Before
   <CardView key={index} card={card} faceDown={false} />
   // After
   <CardView key={`${card.suit}-${card.rank}`} card={card} faceDown={false} />
   ```

2. **`src/ui/PlayerSeat.tsx:32`**
   ```tsx
   // Before
   <CardView key={index} card={card} faceDown={!shouldShowFaceUp} />
   // After
   <CardView key={`${card.suit}-${card.rank}`} card={card} faceDown={!shouldShowFaceUp} />
   ```

## 実装ガイドライン

- **参照すべき既存パターン:** `src/ui/PlayerSeats.tsx:32` の `key={player.id}` が正しいパターンの例
- **key の生成方法:** `` `${card.suit}-${card.rank}` `` をインラインで記述する。2箇所のみのためヘルパー関数の追加は不要
- **Card 型への変更禁止:** key 生成のためだけに `Card` 型に `id` フィールドを追加しないこと。既存の `suit` + `rank` で十分一意
- **map の `index` パラメータ:** 不要になった `index` パラメータは削除すること（`(card, index)` → `(card)`）。ただし `PlayerSeat.tsx` は他で `index` を使用していないため削除可能。`TableView.tsx` も同様