## arch-review
I have all the facts I need. Let me compile the architecture review.

---

## Architecture Review Report

**対象タスク**: タスク1（サブタスク1.1〜1.4）— ベッティングのバリデーションとラウンド終了・有効アクション返却の修正

**変更ファイル**:
- `src/domain/betting.ts` — バリデーション追加、`getValidActions` の `ValidAction` 化、`isBettingRoundComplete` 修正
- `src/domain/types.ts` — `ValidAction` 型追加
- `src/domain/gameEngine.ts` — `ValidAction` 型の re-export
- `src/application/useGameController.ts` — `PlayerAction[]` → `ValidAction[]` 型変更
- `src/ui/ActionBar.tsx` — `ValidAction[]` 型変更
- `src/ui/GameScreen.tsx` — `ValidAction[]` 型変更
- `src/ui/ActionBar.test.tsx` — 型変更対応
- `src/ui/GameScreen.test.tsx` — 型変更対応
- `src/domain/betting-validation.test.ts` — 新規（23テスト）

**変更スコープ**: Medium（約300行の差分）。変更は論理的にまとまっており、分割不要。

---

### 前回指摘の追跡

| finding_id | 前回の問題 | 状態 | 根拠 |
|---|---|---|---|
| AIR-001 | `isTypeFeasible` バイパスはプロダクション到達不能な「念のため」コード | → 本レビューで `ARCH-001` として引き継ぎ | `src/domain/betting.ts:38-44` に現存 |
| Warning-001 | ActionBar の min/max 計算が getValidActions と不一致 | → 本レビューで `ARCH-002` として引き継ぎ（ブロッキングに昇格） | `src/ui/ActionBar.tsx:33-35` に現存 |
| Warning-002 | cpuStrategy が ValidAction の min/max を未使用 | `resolved`（スコープ外） | 変更外ファイル、別タスクで対応予定 |

---

### 判定: **REJECT**

---

### ブロッキング問題

#### `finding_id: ARCH-001` | 状態: `new`

**ファイル**: `src/domain/betting.ts:38-44`
**問題**: 未使用コード（「念のため」のコード） — `isTypeFeasible` バイパスはプロダクション到達不能なデッドコード

```typescript
if (!validActions.some((a) => a.type === action.type)) {
    const isTypeFeasible =
      (action.type === 'bet' && state.currentBet === 0) ||
      (action.type === 'raise' && state.currentBet > 0)
    if (!isTypeFeasible) {
      throw new Error(`Invalid action: ${action.type}`)
    }
  }
```

**詳細**:

呼び出しチェーンを検証した結果、`applyAction` の全プロダクション呼び出し元は `getValidActions` で事前にフィルタされており、`validActions` に含まれないアクションタイプが到達することはない:

1. `gameFlow.ts:97` — CPU は `decideAction` → `getValidActions` 経由で `.type` を決定
2. `gameFlow.ts:108` — 人間は `ActionBar` → `getValidActions` 由来の `validActionTypes` でフィルタ済み

元のコード（変更前）は `validActions` に含まれない場合に即 `throw` していた。今回の変更で `isTypeFeasible` によるバイパスが追加され、`getValidActions` が除外した bet/raise を通過させる経路が作られた。これは:

- **REJECT基準「未使用コード（念のためのコード）」** に該当
- **呼び出し元の制約による論理的デッドコード** — 全呼び出し元が `getValidActions` で保証しているため到達しない分岐

**修正案**: `isTypeFeasible` バイパスを削除し、元の厳格なバリデーション（`validActions` に含まれないアクションは即 `throw`）に戻す。対応テスト（`betting-validation.test.ts` 行323-347 "should allow all-in bet below BIG_BLIND when chips are insufficient"、行415-437 "should allow all-in raise below minimum raise when chips are insufficient"）も削除する。

```typescript
// 修正後
if (!validActions.some((a) => a.type === action.type)) {
  throw new Error(`Invalid action: ${action.type}`)
}
```

---

#### `finding_id: ARCH-002` | 状態: `new`

**ファイル**: `src/ui/ActionBar.tsx:33-35`
**問題**: レイズ最小額の計算がドメイン層と不一致 — DRY違反かつ不正な振る舞い

```typescript
function getMinRaise(): number {
    return Math.min(currentBet * 2, playerChips + playerCurrentBetInRound)
}
```

ドメイン層（`betting.ts:21`）のレイズ最小額は `currentBet + BIG_BLIND` であるのに対し、ActionBar は `currentBet * 2` を使用している。`currentBet > BIG_BLIND` の場合に不整合が発生する:

- 例: `currentBet = 20` → ドメインの最小レイズ = `20 + 10 = 30`、ActionBar = `20 * 2 = 40`
- 例: `currentBet = 10`（= `BIG_BLIND`）→ たまたま一致（`10 + 10 = 20` = `10 * 2 = 20`）

タスク1.4で `ValidAction` に `min/max` が付与されるようになった。`getValidActions` から返される `ValidAction` の `min` フィールドを使えば、この計算の重複は不要になる。しかし現状の `ActionBar` はこの `min` を無視して独自計算を行っている。

**この問題がブロッキングである理由**: タスク1.4の成果（`ValidAction.min/max`）がUIに伝播されておらず、ドメインの計算との不一致が修正されていない。今回の変更で `ValidAction` 型が UI まで伝播されたにもかかわらず、その `min/max` フィールドが使われていない。これは配線漏れであり、タスク1.4の目的（「UIがチップ入力の範囲として利用できるようにする」）を部分的にしか達成していない。

**修正案**: `ActionBar` の `getMinRaise()` と `getMinBet()` を削除し、`validActions` から該当アクションの `min/max` を取得して使用する。

```typescript
// 修正案
function getActionRange(actionType: 'bet' | 'raise'): { min: number; max: number } {
  const action = validActions.find((a) => a.type === actionType)
  if (action?.min !== undefined && action?.max !== undefined) {
    return { min: action.min, max: action.max }
  }
  // フォールバック（到達しないはずだが型安全のため）
  return actionType === 'bet'
    ? { min: BIG_BLIND, max: playerChips }
    : { min: currentBet + BIG_BLIND, max: playerChips + playerCurrentBetInRound }
}
```

同時に、`getSliderProps()` も `getActionRange` を使うよう変更する。テスト（`ActionBar.test.tsx:210` "should set raise slider min to currentBet * 2"）も `currentBet + BIG_BLIND` に期待値を更新する。

---

#### `finding_id: ARCH-003` | 状態: `new`

**ファイル**: `src/ui/ActionBar.tsx:29-35`
**問題**: ドメインロジックの重複 — `getMinBet()` と `getMinRaise()` がドメイン層の計算を UIコンポーネント内で再実装している

```typescript
function getMinBet(): number {
    return Math.min(BIG_BLIND, playerChips)
}

function getMinRaise(): number {
    return Math.min(currentBet * 2, playerChips + playerCurrentBetInRound)
}
```

これらはドメイン層（`betting.ts` の `getValidActions`）で既に計算され、`ValidAction.min` として返されている計算の重複である。`BIG_BLIND` を UI 層で直接 import してビジネスルールを再計算している点も、レイヤー設計の依存方向違反ではないが、責務の漏洩に該当する。

**REJECT基準「本質的に同じロジックの重複（DRY違反）」** に該当。

**修正案**: ARCH-002 と同一の修正で解決。`ValidAction.min/max` を使用する形に統一すれば、`getMinBet()`、`getMinRaise()` の両関数とも不要になる。その結果、`ActionBarProps` から `currentBet` と `playerCurrentBetInRound` も不要になる可能性がある（`playerChips` は All-in ボタンで使用されるため残す）。

---

### 正常に実装されている部分

| 観点 | 評価 |
|------|------|
| `ValidAction` 型の設計（`types.ts:39-43`） | ✅ `min?/max?` のオプショナル設計は fold/check/call で不要な場合に適切 |
| `getValidActions` のレイズ可否判定（`betting.ts:20-27`） | ✅ `minRaiseCost` を計算し、支払えない場合は raise を除外。高凝集 |
| bet/raise の amount バリデーション（`betting.ts:77-82, 97-103`） | ✅ チップ超過・最低額未満を正しく拒否。オールインも許容 |
| `isBettingRoundComplete` の修正（`betting.ts:129-135`） | ✅ aggressor が all-in で `chips=0` の場合はフォールスルーで全員マッチを確認。無限ループ解消 |
| 型の伝播チェーン（`gameEngine.ts` → `useGameController.ts` → `GameScreen.tsx` → `ActionBar.tsx`） | ✅ `PlayerAction[]` → `ValidAction[]` が全レイヤーで正しく伝播 |
| `applyAction` のイミュータブル更新（`betting.ts:47`） | ✅ `players.map(p => ({...p}))` で元状態を破壊しない |
| テストカバレッジ（`betting-validation.test.ts`） | ✅ 23テストで getValidActions/applyAction/isBettingRoundComplete を網羅的にテスト |
| ファイルサイズ（`betting.ts`: 156行） | ✅ 200行以下、1ファイル1責務 |

### 警告（非ブロッキング）

#### `Warning-001`: `ActionBarProps` の `currentBet` / `playerCurrentBetInRound` が ARCH-002/003 修正後に未使用になる可能性

ARCH-002/003 の修正で `ValidAction.min/max` を使うようにした場合、`ActionBarProps` の `currentBet` と `playerCurrentBetInRound` は `handleAllIn` でのみ使用される。`handleAllIn` も `ValidAction.max` で代替可能であるため、これらの props を削除してインターフェースを簡素化できる。ARCH-002/003 の修正時に合わせて検討すること。

---

## supervise
Now I have all the information needed. Let me compile the final validation report.

---

# 最終検証結果

## 結果: REJECT

## 要件充足チェック

タスク指示書（tasks.md タスク1）から要件を抽出し、各要件を実コードで個別に検証した。

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1.1 | ベット額がプレイヤー所持チップ以下であることを検証し、違反時エラー | ✅ | `src/domain/betting.ts:77-78`（bet超過throw）, `src/domain/betting.ts:97-98`（raise超過throw） |
| 1.1 | レイズ額が最低レイズ額以上であることを検証し、違反時エラー | ✅ | `src/domain/betting.ts:80-82`（bet最低額throw）, `src/domain/betting.ts:100-103`（raise最低額throw） |
| 1.2 | レイズ可否条件に「コール額＋最低レイズ額を支払えるか」を追加、支払えない場合はレイズを有効にしない | ✅ | `src/domain/betting.ts:20-27`（`minRaiseCost` 計算、`player.chips >= minRaiseCost` でフィルタ） |
| 1.3 | last aggressorがオールインでも正しくラウンド終了する（無限ループ防止） | ✅ | `src/domain/betting.ts:129-135`（aggressor chips>0チェック追加）, `src/domain/betting.ts:137-139`（全員マッチのフォールバック） |
| 1.4 | 有効アクション取得時にベット/レイズのmin/max範囲を返す | ✅ | `src/domain/betting.ts:14`（bet min/max）, `src/domain/betting.ts:25`（raise min/max）, `src/domain/types.ts:39-43`（ValidAction型） |

**全要件は機能的に充足している。** ただし、以下のブロッキング問題が存在する。

## 未解決のレビュー指摘

### `finding_id: AIR-001` | 状態: `persists`（AI Reviewからの未対応）

**ファイル**: `src/domain/betting.ts:38-44`
**問題**: `isTypeFeasible` バイパスはこの変更で導入された到達不能な「念のため」コード

AIレビューが REJECT した AIR-001 が未解決のまま残っている。

**事実確認（ファクトチェック済み）**:

1. **この変更で導入された**: `git diff HEAD -- src/domain/betting.ts` を確認。元のコードは `throw new Error('Invalid action: ...')` の単純な throw だったが、今回の変更で `isTypeFeasible` バイパスが追加された（diff行 `+39`〜`+44`）
2. **プロダクション到達不能**: `applyAction` の全呼び出し元を grep で確認:
   - `gameFlow.ts:97` — CPU: `decideAction` → `getValidActions` でフィルタ済み
   - `gameFlow.ts:108` — Human: UI が `getValidActions` でフィルタ済み
   - いずれのパスも `getValidActions` に含まれないアクションタイプを渡すことはない
3. **テストが到達不能パスを通る**: `betting-validation.test.ts:323-347`（チップ<BIG_BLINDでbet）と `betting-validation.test.ts:415-437`（最低レイズ未満でraise）は、`getValidActions` がこれらのアクションを返さない状態で `applyAction` を直接呼び出しており、`isTypeFeasible` バイパスを通過している

**レビューポリシーとの照合**:
- 「未使用コード（「念のため」のコード）」→ REJECT基準に該当
- 「今回の変更で導入された問題」→ ブロッキング

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` — 406 passed (24 files) |
| ビルド | ✅ | `npm run build` — 成功（67 modules, 629ms） |
| 要件充足 | ✅ | 5要件すべて機能的に充足 |
| AIレビュー指摘対応 | ❌ | AIR-001 未解決 |

## 成果物

- 変更: `src/domain/betting.ts`, `src/domain/types.ts`, `src/domain/gameEngine.ts`, `src/application/useGameController.ts`, `src/ui/ActionBar.tsx`, `src/ui/ActionBar.test.tsx`, `src/ui/GameScreen.tsx`, `src/ui/GameScreen.test.tsx`
- 作成: `src/domain/betting-validation.test.ts`

## 未完了項目（REJECT理由）

| # | finding_id | 項目 | 理由 |
|---|------------|------|------|
| 1 | AIR-001 | `src/domain/betting.ts:38-44` の `isTypeFeasible` バイパス | AIレビューで指摘された到達不能な「念のため」コードが未解決。この変更で導入されたデッドコードであり、レビューポリシーの REJECT 基準に該当する。AIレビューの修正案（選択肢A: バイパス削除＋対応テスト削除、または選択肢B: `getValidActions`でオールインをモデル化）のいずれかで対応が必要 |