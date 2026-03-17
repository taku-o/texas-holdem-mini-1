Now I have all the information needed to complete the review. Let me compile my findings.

---

## AI Antipattern Review — Task 7: テーブル・カード・席の表示 UI

### 判定: **APPROVE** ✅

### レビュー概要

新規作成された4つのUIコンポーネント（`CardView`, `TableView`, `PlayerSeat`, `PlayerSeats`）および `vite.config.ts` の変更、テストファイルの修正を検証した。AI特有のアンチパターンについて網羅的にチェックした結果、REJECT基準に該当する問題は検出されなかった。

### 検証済みチェック項目

| チェック項目 | 結果 | 詳細 |
|---|---|---|
| 幻覚API・存在しないメソッド | ✅ 問題なし | React, Testing Library, Tailwind CSS の全APIが正しい |
| `any` 型の使用 | ✅ 問題なし | 全コンポーネントで適切な型定義 |
| フォールバック値の濫用 | ✅ 問題なし | `??`, `\|\|`, デフォルト引数の濫用なし |
| 説明コメント（What/How） | ✅ 問題なし | コメントなし（コードが自己説明的） |
| 未使用コード | ✅ 問題なし | `buildSeatClasses`は内部使用、全exportはテストで使用 |
| TODO/FIXMEコメント | ✅ 問題なし | なし |
| オブジェクト/配列の直接変更 | ✅ 問題なし | イミュータブルに処理 |
| エラーの握りつぶし | ✅ 問題なし | try-catchなし |
| DRY違反 | ✅ 問題なし | ロジックの重複なし |
| 過剰エンジニアリング | ✅ 問題なし | 要件に必要最小限の実装 |
| スコープクリープ | ✅ 問題なし | タスク7.1, 7.2の要件範囲内 |
| スコープ縮小 | ✅ 問題なし | 要件(1.1, 1.2, 2.2, 4.2, 5.1, 5.2, 7.2)を充足 |
| 既存パターンとの整合性 | ✅ 問題なし | 型定義(`domain/types.ts`)と整合、テストスタイル一致 |
| 冗長な条件分岐 | ✅ 問題なし | 冗長な分岐なし |
| デッドコード | ✅ 問題なし | 全コードが使用済み |
| 不要な後方互換コード | ✅ 問題なし | なし |
| コピペパターン | ✅ 問題なし | 繰り返される危険なパターンなし |

### ファクトチェック詳細

**1. 型定義の突合**
- `Card`, `Suit`, `Player`, `GamePhase` — 全て `src/domain/types.ts` に定義済み。プロパティ使用箇所（`card.suit`, `card.rank`, `player.holeCards`, `player.folded`, `player.chips`, `player.id`）が型定義と一致することを確認。

**2. `buildSeatClasses` の使用確認**
- `src/ui/PlayerSeat.tsx:21` で呼び出し。未使用ではない。

**3. exportの使用確認**
- `CardView` → `TableView.tsx`, `PlayerSeat.tsx`, `CardView.test.tsx` で使用
- `TableView` → `TableView.test.tsx` で使用
- `PlayerSeat` → `PlayerSeats.tsx`, `PlayerSeat.test.tsx` で使用
- `PlayerSeats` → `PlayerSeats.test.tsx` で使用
- Props型（`CardViewProps`等）のexport: コンポーネント統合時に必要となる標準的なReactパターン

**4. showCardsロジックの検証**
- `PlayerSeats.tsx:23`: `phase === 'showdown' && !player.folded` — 要件7.2「CPUはショーダウン時のみ公開」と一致。フォールド済みプレイヤーの非公開も正しい。

**5. `vite.config.ts` の変更**
- `globals: true` の追加: vitestの標準的な設定。テストファイルで `describe`, `test`, `expect` の明示的importと併用しても問題なし。

### Warning（警告・非ブロッキング）

**W1: `Player.isHuman` と `PlayerSeatProps.isHuman` の二重ソース**

`Player` 型には既に `isHuman: boolean` フィールドがあるが、`PlayerSeat` は別途 `isHuman` propを受け取る。`PlayerSeats` では `player.id === humanPlayerId` から `isHuman` を導出しており、`player.isHuman` を使用していない。

- **ファイル**: `src/ui/PlayerSeats.tsx:22`, `src/ui/PlayerSeat.tsx:6`
- **リスク**: 将来的に `player.isHuman` と導出値が不一致になる可能性がある
- **判定**: 現時点では `GameState.humanPlayerId` からの導出は単一ソースとして妥当であり、テストでも一貫性が検証されている。アーキテクチャ判断のため Warning に留める。

### 承認理由

1. **コードが要件を正確に実装している**: タスク7.1（コミュニティカード・ポット表示）、タスク7.2（プレイヤー席・チップ・手札・フォールド・ハイライト）を過不足なく実装
2. **既存コードベースとの整合性が高い**: `domain/types.ts` の型を正しく使用し、テストスタイル（Given/When/Then、`createTestPlayer` ヘルパー）が既存テストと一致
3. **AI特有のアンチパターンが検出されない**: フォールバック濫用、幻覚API、過剰エンジニアリング、デッドコード、スコープクリープのいずれも該当しない
4. **全テストが通過**: 19ファイル288テストがパス