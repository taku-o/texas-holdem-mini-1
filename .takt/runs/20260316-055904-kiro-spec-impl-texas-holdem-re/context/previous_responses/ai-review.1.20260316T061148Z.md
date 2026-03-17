Now I have all the evidence needed for a thorough review.

---

## AI Antipattern Review — `handEvaluator.ts` タスク6

### 判定: **REJECT**

---

### ブロッキング問題

#### `[AR-001]` (new) — ロイヤルフラッシュ誤判定: 全カードのランクで判定しているが、ベスト5枚で判定すべき

**ファイル:** `src/domain/handEvaluator.ts:63-68`

**問題:**
新しいロイヤルフラッシュ判定は、入力された全カード（5〜7枚）のランクに対して10, J, Q, K, Aの存在をチェックしている。しかし、ライブラリの `rankBoard` / `evaluateStrings` はベスト5枚を自動選択するため、**ベスト5枚がロイヤルフラッシュでないのに、余りのカードにロイヤルフラッシュ構成ランクが含まれている場合、誤ってロイヤルフラッシュと判定される。**

**再現シナリオ:**
入力: `[K♥, Q♥, J♥, 10♥, 9♥, A♠, 2♦]`（7枚）
- ライブラリはベスト5枚 `K♥-Q♥-J♥-10♥-9♥` を選択 → **Straight Flush（キングハイ）**
- `baseCategory` = `'straight-flush'` ✓
- `cardRanks` = `{K, Q, J, 10, 9, A, 2}` — 全7枚のランク
- `ROYAL_FLUSH_RANKS` = `{10, J, Q, K, A}` — 全て `cardRanks` に含まれる ✓
- `isRoyalFlush` = `true` → **誤判定！**

正しくは `'straight-flush'`（キングハイ）であるべきところが `'royal-flush'` と判定される。

**根本原因:**
これは典型的なAIアンチパターン「もっともらしいが間違っている」。ドメインロジックとしては正しく見えるが、ライブラリが7枚からベスト5枚を選択するという振る舞いを考慮していない。旧コードの `score === ROYAL_FLUSH_SCORE`（score === 1）はライブラリのスコア値でロイヤルフラッシュ（最強ハンド＝最低スコア）を正確に識別できていた。

**修正案:**
ロイヤルフラッシュの判定をベスト5枚に対して行うか、旧コードと同様にスコア値ベースの判定を維持する。例:

```typescript
// 方法A: スコアベース（旧ロジックをrankDescriptionと併用）
const ROYAL_FLUSH_SCORE = 1
const isRoyalFlush = baseCategory === 'straight-flush' && score === ROYAL_FLUSH_SCORE

// 方法B: ライブラリが選んだベスト5枚を使う（可能なら）
```

タスク6の目的は「ライブラリ内部定数に直接依存しない形にする」だが、`score === 1` は `evaluateStrings` の**公開API**が返すスコア値であり、内部定数ではない。`LIB_RANK_TO_CATEGORY` の数値→カテゴリマッピングを `rankDescription` ベースに変更したのは正しい改善だが、ロイヤルフラッシュ判定の `score === 1` チェックまで置換したことでバグが導入された。

---

### 問題なし（確認済み）

| 観点 | 結果 |
|------|------|
| `rankDescription` APIの実在 | ✅ ライブラリに存在確認済（`dist/index.d.ts:33`, `README.md:133`） |
| `DESCRIPTION_TO_CATEGORY` マッピングの正確性 | ✅ ライブラリの `HAND_RANK_DESCRIPTIONS` と完全一致 |
| `as number` キャスト除去 | ✅ `rankBoard` は `HandRank` 型を返し、`rankDescription` は `HandRank` を受け取るため正しい |
| 未使用コード | ✅ 旧定数 `LIB_RANK_TO_CATEGORY`, `ROYAL_FLUSH_SCORE` は適切に削除済み |
| スコープクリープ | ✅ タスク6の範囲内の変更のみ |
| フォールバック濫用 | ✅ なし |
| `any` 型 | ✅ なし |
| デッドコード | ✅ なし |

---

### 指摘サマリ

| finding_id | 状態 | 種別 | 概要 |
|-----------|------|------|------|
| AR-001 | new | REJECT | 7枚入力時にロイヤルフラッシュが誤判定される（全カードのランクでチェックしているがベスト5枚で判定すべき） |