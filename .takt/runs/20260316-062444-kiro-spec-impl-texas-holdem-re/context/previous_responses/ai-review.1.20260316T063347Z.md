Now I have all the information needed to complete the review. Let me compile my findings.

---

## AI Antipattern Review — タスク7: ゲーム開始時の乱数関数の結合を契約として明示する

### 変更概要

- `src/domain/gameSetup.ts`: `setupNewGame` 関数に JSDoc コメント（4行）を追加

### 検出した問題

#### [REJECT] finding_id: `AIR-T7-001` (new) — 説明コメント（What/How）の追加

**ファイル:** `src/domain/gameSetup.ts:6-9`

**問題:** 追加された JSDoc は What/How のコメントに該当する。

```typescript
/**
 * @param randomFn 席決定・デッキシャッフル等すべての乱数のソース。
 *   テスト時に固定値関数やシード付き乱数を注入することで決定論的な結果を得るための依存注入ポイント。
 */
```

- 「席決定・デッキシャッフル等すべての乱数のソース」→ **What**。関数本体（L11-12: `humanIndex`, `dealerIndex`, L23: `shuffleDeck`）を読めば `randomFn` が何に使われているかは明白。
- 「テスト時に固定値関数やシード付き乱数を注入することで決定論的な結果を得るための依存注入ポイント」→ **How**。型シグネチャ `randomFn: () => number` 自体が依存注入の契約であり、引数として受け取っている時点で差し替え可能であることは自明。

さらに、`src/` ディレクトリ全体を検索した結果、`@param` を含む JSDoc はこの1箇所のみ。コードベースの他の公開関数（`preparePreflopRound`, `createDeck`, `shuffleDeck` 等）にはJSDocが一切ないため、1関数だけにJSDocを付けることはコードベース全体のパターンと不整合になる。

**REJECT 根拠:** レビューポリシー「説明コメント（What/How のコメント）」に該当。

**修正案:** タスク7の要件「既存の randomFn 引数で充足している場合は記載のみでよい」に対し、型シグネチャ `randomFn: () => number` 自体が契約を十分に明示している。このコメントを削除する。タスク7.1 の「記載」は、関数シグネチャの型によって既に充足されていると判断すべき。

もし何かしらのコメントが必要と判断する場合でも、コードベースの既存スタイルに合わせて最小限の Why コメント（1行）に留めること：

```typescript
// randomFn は DI ポイント — テスト時にシード付き関数へ差し替え可能
export function setupNewGame(randomFn: () => number): GameState {
```

---

### 総合判定: **REJECT**

| finding_id | 状態 | 分類 | 概要 |
|---|---|---|---|
| `AIR-T7-001` | new | ブロッキング | What/How 説明コメント + コードベースパターン不整合 |

ブロッキング問題が1件あるため REJECT とする。