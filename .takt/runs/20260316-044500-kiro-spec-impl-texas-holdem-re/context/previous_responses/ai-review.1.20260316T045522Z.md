Now I have all the information needed. Let me compile my review.

---

## AI Antipattern Review — Task 3.1 (showdown.ts)

### 変更概要

`src/domain/showdown.ts` に対して以下の変更が行われた:
1. `evaluateShowdown` と `resolveUncontestedPot` に仕様を説明する Why コメントを追加
2. 両関数に `newChips < 0` の不変条件アサーション（throw）を追加
3. `src/domain/showdown.test.ts` にポット配分の正当性を検証するテストを追加

### 検出した問題

#### `[AI-REVIEW-001]` (new) — 論理的に到達不能な防御コード（`newChips < 0` チェック）

**ファイル:** `src/domain/showdown.ts` 40〜44行目、58〜62行目

**問題:** `evaluateShowdown` と `resolveUncontestedPot` の両関数で、勝者の `newChips < 0` をチェックして throw する防御コードが追加されているが、これは論理的に到達不能である。

- `evaluateShowdown`: `newChips = p.chips + share + extra`
  - `share = Math.floor(state.pot / winners.length)` → `pot >= 0` なら `share >= 0`
  - `extra = remainder` → `pot >= 0` なら `remainder >= 0`
  - `p.chips >= 0`（ゲームロジックの不変条件）
  - **∴ `newChips >= 0` は常に成立**

- `resolveUncontestedPot`: `newChips = p.chips + state.pot`
  - `p.chips >= 0` かつ `state.pot >= 0`
  - **∴ `newChips >= 0` は常に成立**

勝者のチップにポットを**加算**しているため、chips と pot が共に非負である限り、結果は必ず非負になる。これは典型的な AI の「念のため」防御コードであり、以下のポリシーに該当する:

- **「未使用コード（「念のため」のコード）」** — REJECT 基準
- **「論理的に到達不能な防御コード」** — 呼び出しチェーンの前提条件により論理的に到達しない
- **「テストがない新しい振る舞い」** — throw は新しい振る舞いだが、到達不能のためテストも書けない

**修正方法:** `src/domain/showdown.ts` の40〜44行目と58〜62行目の `if (newChips < 0) { throw ... }` ブロックを削除する。`const newChips` 変数は `return { ...p, chips: newChips }` で使えるのでそのまま残してよい（あるいは元の `p.chips + share + extra` インラインに戻す）。

---

### 問題なし項目

- **Why コメント（28〜30行目、51〜52行目）**: 仕様上の設計判断（単一ポット、端数処理）を説明しており、適切な Why コメント ✅
- **テスト追加**: chips=0 のオールインプレイヤー、pot=0、チップ保存則の検証など、エッジケースを適切にカバー ✅
- **イミュータビリティ**: スプレッド構文で元の state を変更していない ✅
- **スコープ**: タスク 3.1 の要件（単一ポット明記、配分の正当性確保）に対して適切な範囲 ✅
- **既存コードとの整合性**: 既存のパターン（`state.players.map` + スプレッド）を踏襲 ✅

---

### 判定

**REJECT**

| finding_id | 状態 | 概要 |
|---|---|---|
| AI-REVIEW-001 | new | 論理的に到達不能な `newChips < 0` 防御コード（`showdown.ts:40-44`, `showdown.ts:58-62`） |

ブロッキング問題が 1 件あるため REJECT とする。到達不能な防御コードを削除すれば APPROVE 可能。