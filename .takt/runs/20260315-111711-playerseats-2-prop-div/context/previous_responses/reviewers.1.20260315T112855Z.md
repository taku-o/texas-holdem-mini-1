## arch-review
事実確認が完了しました。レビュー結果をまとめます。

---

## Architecture Review — 判定: **REJECT**

### 前回指摘の追跡

| finding_id | 前回状態 | 今回状態 | 概要 |
|---|---|---|---|
| `AIR-001` | new (AI Review) | **persists** → `ARCH-001` として再定義 | `PlayerSeat` の `isHuman` propが `player.isHuman` と冗長 |

---

### 検出された問題

#### [REJECT] finding_id: `ARCH-001` (persists — AIR-001と同一問題) — `PlayerSeat` の `isHuman` propが `player` propのフィールドと冗長

**ファイル:** `src/ui/PlayerSeat.tsx:6`, `src/ui/PlayerSeats.tsx:29`

**問題:**
`PlayerSeat` は `player: Player` propを受け取っており、`Player` 型には `isHuman: boolean` フィールドが存在する（`src/domain/types.ts:25`）。にもかかわらず、`PlayerSeatProps` に `isHuman: boolean` を別propとして定義し、`PlayerSeats.tsx:29` で `isHuman={player.isHuman}` と同値を渡している。

これは今回の変更で導入された冗長性。タスクの目的は「`humanPlayerId` propの冗長性解消」だったが、冗長性が `PlayerSeats` → `PlayerSeat` に1レベル移動しただけで根本解消していない。

**未解決の根拠:**
- `src/ui/PlayerSeat.tsx:6` — `isHuman: boolean` がprops型に残存
- `src/ui/PlayerSeat.tsx:15` — デストラクチャリングで `isHuman` を個別に受け取り
- `src/ui/PlayerSeats.tsx:29` — `isHuman={player.isHuman}` で同値を渡している

**修正方法:**
1. `PlayerSeatProps` から `isHuman` propを削除する
2. `PlayerSeat` 内部で `player.isHuman` を直接使う:
   - `src/ui/PlayerSeat.tsx:21` — `const shouldShowFaceUp = player.isHuman || showCards`
   - `src/ui/PlayerSeat.tsx:23` — `const seatClasses = buildSeatClasses({ isHuman: player.isHuman, isCurrentTurn, folded: player.folded })`
3. `src/ui/PlayerSeats.tsx:29` — `isHuman={player.isHuman}` の行を削除する
4. `src/ui/PlayerSeat.test.tsx` — 全テストケース（16箇所）から `isHuman={...}` propを削除する

```tsx
// 修正後: src/ui/PlayerSeat.tsx
export type PlayerSeatProps = {
  player: Player
  isDealer: boolean
  isCurrentTurn: boolean
  showCards: boolean
  'data-testid'?: string
}

export function PlayerSeat({
  player,
  isDealer,
  isCurrentTurn,
  showCards,
  'data-testid': dataTestId,
}: PlayerSeatProps) {
  const shouldShowFaceUp = player.isHuman || showCards
  const seatClasses = buildSeatClasses({ isHuman: player.isHuman, isCurrentTurn, folded: player.folded })
  // ...
}
```

**判定根拠:** 今回の変更で導入された冗長性。ボーイスカウトルール「冗長な式（同値の短い書き方がある）→ REJECT」に該当。`player` propが既に保持する値を別propとして渡す設計は、prop数の増加・同期ずれリスク・可読性低下を招く。

---

### 問題なし確認済み項目

| 確認項目 | 結果 |
|---|---|
| ファイルサイズ | ✅ PlayerSeat.tsx: 68行、PlayerSeats.tsx: 38行（基準内） |
| モジュール構成（高凝集・低結合） | ✅ PlayerSeats（コンテナ）→ PlayerSeat（表示）の責務分離が適切 |
| 循環依存 | ✅ なし（`domain/types` ← `ui/PlayerSeat` ← `ui/PlayerSeats`） |
| `data-testid` propの実装 | ✅ オプショナルpropとしてルートdivに付与。ラッパーdiv除去済み |
| `humanPlayerId` のPlayerSeatsからの除去 | ✅ `PlayerSeatsProps` から正しく除去済み |
| `buildSeatClasses` のスコープ | ✅ モジュール内プライベート関数として適切 |
| 関数サイズ | ✅ 全関数30行以内 |
| レイヤー設計（依存方向） | ✅ `ui` → `domain` の一方向 |
| デッドコード（isHuman以外） | ✅ 未使用import・変数なし |
| 呼び出しチェーン | ✅ `PlayerSeats` のみが `PlayerSeat` を使用 |
| テストカバレッジ | ✅ 両コンポーネントにテストあり |
| 変更スコープ | ✅ Small（タスク範囲内の変更のみ） |

### 変更スコープ評価

対象ファイルは `PlayerSeats.tsx`（38行）と `PlayerSeat.tsx`（68行）のみ。タスク指示書の2件（humanPlayerId prop削除、ラッパーdiv除去）に対応する変更で、スコープは適切。

---

## supervise
検証が完了しました。以下が最終検証結果です。

---

# 最終検証結果

## 結果: REJECT

## 要件充足チェック

タスク指示書から要件を抽出し、各要件を実コードで個別に検証する。

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1 | PlayerSeats から `humanPlayerId` propを削除する | ✅ | `src/ui/PlayerSeats.tsx:4-9` — `PlayerSeatsProps` に `humanPlayerId` なし |
| 2 | `player.id === humanPlayerId` による判定を `player.isHuman` に置き換える | ✅ | `src/ui/PlayerSeats.tsx:29` — `isHuman={player.isHuman}` |
| 3 | PlayerSeats の呼び出し元から `humanPlayerId` の受け渡しを削除する | ✅ | `src/ui` 内で `humanPlayerId` の grep 結果 0件 |
| 4 | 不要なラッパー div を除去する | ✅ | `src/ui/PlayerSeats.tsx:25-33` — `<PlayerSeat>` に直接 `key` と `data-testid` を渡す形 |
| 5 | PlayerSeat に `data-testid` propを受け取れるようにする | ✅ | `src/ui/PlayerSeat.tsx:10` — `'data-testid'?: string` |
| 6 | PlayerSeat のルート `<div>` に `data-testid` を付与する | ✅ | `src/ui/PlayerSeat.tsx:26` — `data-testid={dataTestId}` |
| 7 | ビルド（型チェック）が通ること | ✅ | `npx tsc --noEmit` 成功 |
| 8 | 既存テストがパスすること | ✅ | 289 tests passed (19 files) |

## AIレビュー未対応指摘

| # | finding_id | 状態 | 問題 | 根拠 |
|---|------------|------|------|------|
| 1 | AIR-001 | persists | `PlayerSeat` の `isHuman` propが `player.isHuman` と冗長 | `src/ui/PlayerSeat.tsx:6` に `isHuman: boolean` が残存。`src/ui/PlayerSeats.tsx:29` で `isHuman={player.isHuman}` と同値を渡している |

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` (289 passed) |
| ビルド | ✅ | `npx tsc --noEmit` 成功 |
| 動作確認 | ✅ | テスト経由で全フロー確認 |
| AIレビュー指摘対応 | ❌ | AIR-001 未修正 |

## 成果物
- 作成: `src/ui/CardView.tsx`, `src/ui/CardView.test.tsx`, `src/ui/PlayerSeat.tsx`, `src/ui/PlayerSeat.test.tsx`, `src/ui/PlayerSeats.tsx`, `src/ui/PlayerSeats.test.tsx`, `src/ui/TableView.tsx`, `src/ui/TableView.test.tsx`
- 変更: `src/application/gameFlow.ts`, `src/application/gameFlow.test.ts`, `src/domain/cpuStrategy.ts`, `vite.config.ts`

## 未完了項目（REJECT理由）

| # | 項目 | 理由 |
|---|------|------|
| 1 | AIR-001: `PlayerSeat` の `isHuman` prop冗長性解消 | AIレビューで REJECT 判定された指摘が未修正。`PlayerSeat` は `player: Player` を受け取っており `player.isHuman` でアクセス可能なのに、別途 `isHuman: boolean` propを受け取っている。タスクの目的である「冗長なpropの削除」が `PlayerSeats` → `PlayerSeat` の1レベル下に移動しただけで根本解消されていない。 |

### 修正方法（AIR-001）

1. `src/ui/PlayerSeat.tsx:6` — `PlayerSeatProps` から `isHuman: boolean` を削除
2. `src/ui/PlayerSeat.tsx:14` — デストラクチャリングから `isHuman` を削除
3. `src/ui/PlayerSeat.tsx:21` — `isHuman || showCards` → `player.isHuman || showCards`
4. `src/ui/PlayerSeat.tsx:23` — `buildSeatClasses({ isHuman, ...})` → `buildSeatClasses({ isHuman: player.isHuman, ...})`
5. `src/ui/PlayerSeats.tsx:29` — `isHuman={player.isHuman}` 行を削除
6. `src/ui/PlayerSeat.test.tsx` — 全11テストから `isHuman={...}` propを削除（テストプレイヤーの `isHuman` は `createTestPlayer` で設定済み）