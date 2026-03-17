調査完了しました。タスク10は小規模で、設計判断が不要な変更です。

---

## 計画レポート

### タスク概要

**タスク10: リスト表示の key を安定した識別子にする**（要件11）

React の `key` prop に配列の index を使用している箇所を、カードの一意識別子（`suit + rank`）に変更する。

### 要件と変更要否の判定

| サブタスク | 変更要否 | 根拠 |
|-----------|---------|------|
| 10.1 コミュニティカードの key | **変更要** | `src/ui/TableView.tsx:13` で `key={index}` を使用 |
| 10.2 席やカードのリストの key | **変更要（PlayerSeat のみ）** | `src/ui/PlayerSeat.tsx:31` でホールカードに `key={index}` を使用。`PlayerSeats.tsx:32` は既に `key={player.id}` で正しい |

### 影響範囲

- `src/ui/TableView.tsx` — 1箇所（14行目）
- `src/ui/PlayerSeat.tsx` — 1箇所（32行目）

他にUIファイルで index を key にしている箇所はなし（`ActionBar.tsx` は `key={actionType}` で正しい）。

### 実装アプローチ

**Card の一意識別子の生成方法:**
- `Card` 型は `{ suit: Suit, rank: Rank }` で構成される（`src/domain/types.ts`）
- `id` フィールドは存在しないため、`suit` と `rank` から key 文字列を生成する
- key 文字列: `` `${card.suit}-${card.rank}` `` （例: `"spades-A"`, `"hearts-10"`）
- デッキ内でカードは一意なので、この文字列は key として適切

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

### Coder 向け実装ガイドライン

1. **参照すべき既存パターン:** `src/ui/PlayerSeats.tsx:32` — `key={player.id}` の使い方が正しいパターンの例
2. **変更ファイル:** `TableView.tsx`（14行目）と `PlayerSeat.tsx`（32行目）の2箇所のみ
3. **key の生成:** テンプレートリテラル `` `${card.suit}-${card.rank}` `` をインラインで記述する。ヘルパー関数やユーティリティの追加は不要（2箇所のみのため）
4. **注意すべきアンチパターン:** key 生成のためだけに Card 型に `id` フィールドを追加しないこと。既存の `suit` + `rank` の組み合わせで十分一意
5. **テスト:** 既存のUIテストがあればkey変更後も通ることを確認する。key変更自体の振る舞いテストは不要（Reactの内部最適化の問題であり、機能的な差異はない）