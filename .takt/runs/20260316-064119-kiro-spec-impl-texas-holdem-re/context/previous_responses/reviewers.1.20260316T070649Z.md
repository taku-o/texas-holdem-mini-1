## arch-review
Now I have all the information needed for the architecture review. Let me compile my findings.

---

## Architecture Review — Task 8: CPU連続処理の非同期化

### 対象ファイル
- `src/application/gameFlow.ts`（変更: 126行）
- `src/application/useGameController.ts`（変更: 72行）
- `src/application/gameFlow.test.ts`（変更: 869行）
- `src/application/useGameController.test.ts`（変更: 404行）
- `src/application/gameFlow.async.test.ts`（新規: 387行）

### 変更スコープ: Medium（226追加/284削除）
変更は論理的にまとまっている（同期→非同期化 + テスト適応）。分割不要。

---

### 前回指摘の追跡

前回（AI Antipattern Review）の open findings を追跡する：

| finding_id | 前回状態 | 今回状態 | 備考 |
|---|---|---|---|
| AIR-001 | new | persists | `.catch(console.error)` は依然として存在（後述） |
| AIR-002 | new | persists | 説明コメントは依然として存在（後述） |
| AIR-003 | new | persists | `let state = fullState` は依然として存在（後述） |
| AIR-004 | new | persists | `startGame` に `processingRef` ガードなし（後述） |
| AIR-W01 | new (Warning) | — | AI特有の問題ではないため本レビューで構造的観点から判断 |
| AIR-W02 | new (Warning) | — | テストの弱アサーションは本レビューで判断 |

---

### 判定: **REJECT**

---

### ブロッキング問題

#### `[AIR-001]` persists — `useGameController.ts:30,53` — `.catch(console.error)` によるエラーの握りつぶし

**根拠:** `useGameController.ts` 30行目と53行目で `.catch(console.error)` が現存。

**問題:** `startGame` と `handleAction` の非同期処理で例外が発生した場合、`console.error` に出力されるだけで UI への状態復旧が行われない。REJECT基準「エラーの握りつぶし（空の catch）」に該当。`startGame` 側は `try/finally` すら無いため、失敗時に `gameStateRef.current` が不整合な状態で残る。

**修正案:**
- `startGame` 内の IIFE にも `try/finally` を追加する
- `.catch(console.error)` を削除し、`catch` ブロック内で `setGameState(null)` 等の復旧処理を行うか、少なくともエラー状態を state に反映する

---

#### `[AIR-004]` persists — `useGameController.ts:20-30` — `startGame` に `processingRef` ガードが欠落

**根拠:** `useGameController.ts` 20-30行目。`handleAction` は35行目で `if (processingRef.current) return` のガードがあるが、`startGame` には無い。

**問題:** `startGame` が非同期処理中に再度呼ばれると、2つの async処理が `gameStateRef.current` と `setGameState` を競合的に更新する。`handleAction` で導入された `processingRef` パターンと一貫性がなく、同じ hook 内で2つの非同期関数が異なるガードパターンを持つのは設計の不整合。

**修正案:** `startGame` の先頭に `if (processingRef.current) return` を追加し、IIFE 内に `try { processingRef.current = true; ... } finally { processingRef.current = false }` を追加する。

---

#### `[AIR-002]` persists — `useGameController.ts:68` — 説明コメント（What/How コメント）

**根拠:** `useGameController.ts` 68行目: `// Keep gameStateRef in sync with gameState`

**問題:** コードの動作をそのまま自然言語で言い換えているコメント。69行目の `gameStateRef.current = gameState` から自明。REJECT基準「説明コメント（What/How のコメント）」に該当。

**修正案:** コメントを削除する。

---

#### `[AIR-003]` persists — `gameFlow.test.ts:291` — 未使用の中間変数 `let state = fullState`

**根拠:** `gameFlow.test.ts` 291行目で `let state = fullState` と宣言。293行目で `advanceUntilHumanTurn(state, fixedRandom)` と使用されるが、一度も再代入されないため `fullState` を直接使えばよい。

**問題:** 以前の同期版ではループ内で `state = ...` と再代入していた名残と推測されるが、非同期化に伴い不要になった変数が残存。REJECT基準「未使用コード（「念のため」のコード）」に該当。

**修正案:** `let state = fullState` を削除し、293行目を `await advanceUntilHumanTurn(fullState, fixedRandom)` に変更する。

---

#### `[ARCH-001]` new — `gameFlow.async.test.ts:146-207` — テストが意味のあるアサーションを持たない

**問題:** テスト「should not call onProgress when no CPU turns occur」（146行目）のアサーションが206行目の `expect(onProgress).toBeDefined()` のみ。テスト名は「onProgressが呼ばれない」ことを期待しているが、`vi.fn()` は定義時点で必ず defined であり、このアサーションは何も検証していない。これはテストがない新しい振る舞い（「CPUターンなしで onProgress が呼ばれない」こと）と同等であり、REJECT基準「テストがない新しい振る舞い」に該当。

**修正案:**
- `expect(onProgress).not.toHaveBeenCalled()` に変更するか、テスト前提（CPUターンなしで解決するシナリオ）を正確に構築して正しいアサーションを行う
- もし前提条件の構築が難しくテストの意図を正確に表現できないなら、テスト名を実際のアサーションに合わせるか、テストを削除する

---

### 非ブロッキング（参考情報）

#### `[ARCH-W01]` Warning — `gameFlow.test.ts` と `gameFlow.async.test.ts` のテストヘルパー重複

`gameFlow.test.ts`（1-68行目）と `gameFlow.async.test.ts`（1-46行目）で `createGameState` と `createHumanTurnState` が実質同一のヘルパーとして重複定義されている。テストファイル間のヘルパー重複はテストポリシーにより原則 Warning 扱い。ただし、将来的にヘルパーの共通化を検討することを推奨する。

#### `[ARCH-W02]` Warning — `gameFlow.async.test.ts` 300-323行目 — `setTimeout` モック使用時の `vi.restoreAllMocks()` の位置

322行目で `vi.restoreAllMocks()` をテスト本体の末尾で直接呼んでいる。テストがアサーション前で失敗した場合、`restoreAllMocks` が呼ばれずグローバル状態が汚染される。`afterEach` か `try/finally` で囲むのが安全。ただしテストの不安定化が現時点では再現できないため Warning 扱い。

---

### 構造・設計の評価

| 観点 | 評価 |
|------|------|
| ファイル分割 | OK — 全ファイル200行以内（テストを除く）。責務も明確 |
| モジュール構成 | OK — `gameFlow.ts` はドメイン関数を組み合わせるオーケストレーション層として適切 |
| レイヤー依存方向 | OK — `useGameController` → `gameFlow` → `domain/*` の方向が守られている |
| 関数設計 | OK — `processCpuTurnsAndPhases` は30行超だが、ゲームループのステートマシンとして妥当 |
| パブリック API | OK — `handlePlayerAction` と `advanceUntilHumanTurn` のみエクスポート。内部関数は非公開 |
| 循環依存 | なし |
| 呼び出しチェーン | OK — `onProgress` パラメータは `useGameController.ts` → `gameFlow.ts` → `processCpuTurnsAndPhases` まで正しく伝搬 |

### 指摘一覧

| finding_id | 状態 | 分類 | ファイル:行 | 概要 |
|---|---|---|---|---|
| AIR-001 | persists | REJECT | `useGameController.ts:30,53` | `.catch(console.error)` によるエラー握りつぶし |
| AIR-004 | persists | REJECT | `useGameController.ts:20-30` | `startGame` に `processingRef` ガードなし |
| AIR-002 | persists | REJECT | `useGameController.ts:68` | 説明コメント |
| AIR-003 | persists | REJECT | `gameFlow.test.ts:291` | 未使用の中間変数 `let state = fullState` |
| ARCH-001 | new | REJECT | `gameFlow.async.test.ts:146-207` | テストのアサーションが何も検証していない |
| ARCH-W01 | new | Warning | `gameFlow.test.ts` / `gameFlow.async.test.ts` | テストヘルパーの重複 |
| ARCH-W02 | new | Warning | `gameFlow.async.test.ts:322` | `vi.restoreAllMocks()` の呼び出し位置 |

---

## supervise
All tests pass (451/451), TypeScript type check passes, build succeeds. Now let me compile the full validation report.

The AI review (movement 4) identified 4 REJECT issues. These issues are **still present** in the current code — they were not fixed by subsequent movements. Let me verify each:

1. **AIR-001** — `useGameController.ts:30,53` — `.catch(console.error)` still present ✅ confirmed
2. **AIR-002** — `useGameController.ts:68` — What comment still present ✅ confirmed
3. **AIR-003** — `gameFlow.test.ts:291` — `let state = fullState` still present ✅ confirmed
4. **AIR-004** — `useGameController.ts:20-30` — `startGame` still lacks `processingRef` guard ✅ confirmed

---

# 最終検証結果

## 結果: REJECT

## 要件充足チェック

タスク指示書（Task 8）の要件を抽出し、各要件を実コードで個別に検証する。

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1 | CPUの連続ターン処理をメインスレッドを長時間ブロックしない形に変更する | ✅ | `gameFlow.ts:51-53` — `yieldToMainThread()` で `setTimeout(resolve, 0)` を使用。`gameFlow.ts:104` で各CPUアクション後に `await yieldToMainThread()` |
| 2 | 一定件数ごとにyieldする、または非同期で次のティックに回す | ✅ | `gameFlow.ts:102-104` — CPUアクション適用後（`applyAction` 後）に毎回 `await yieldToMainThread()` で次ティックに回す |
| 3 | 呼び出し側（useGameController）とのインターフェースに合わせて実装する | ✅ | `useGameController.ts:11-12` — `startGame: () => void`, `handleAction: (action) => void` の外部シグネチャ維持。内部を async IIFEで包む |
| 4 | 状態更新・再描画のサイクルが進むようにする | ✅ | `gameFlow.ts:103` — `onProgress?.(current)` で中間状態をコールバック。`useGameController.ts:26,46` で `setGameState` を `onProgress` として渡す |

**タスク本来の目的は達成されている。** ただし、AIレビューで指摘された4件のREJECT問題が未解決。

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` — 451 passed, 0 failed |
| 型チェック | ✅ | `npx tsc --noEmit` — エラーなし |
| ビルド | ✅ | `npx vite build` — 成功 |
| 動作確認 | ✅ | テスト経由で主要フロー確認済み |
| AIレビュー指摘対応 | ❌ | 4件のREJECT指摘が未修正 |

## 成果物

- 変更: `src/application/gameFlow.ts` — async化、yieldToMainThread、onProgressコールバック追加
- 変更: `src/application/useGameController.ts` — async IIFE化、gameStateRef/processingRef追加
- 変更: `src/application/gameFlow.test.ts` — async/await対応
- 変更: `src/application/useGameController.test.ts` — async act + waitForパターン対応
- 作成: `src/application/gameFlow.async.test.ts` — 非同期動作・onProgress専用テスト

## 未完了項目

| # | finding_id | 項目 | 理由 | ファイル:行 |
|---|------------|------|------|-------------|
| 1 | AIR-001 | `.catch(console.error)` によるエラー握りつぶし | `startGame` と `handleAction` の両方で、エラーを `console.error` に出力するだけで、UIフィードバックも状態復旧もない。ポリシー「エラーの握りつぶし（空の catch）」に該当 | `useGameController.ts:30,53` |
| 2 | AIR-002 | 説明コメント（What/How コメント） | `// Keep gameStateRef in sync with gameState` はコードから自明な内容の反復。ポリシー「説明コメント」に該当 | `useGameController.ts:68` |
| 3 | AIR-003 | 未使用中間変数 `let state = fullState` | `state` は再代入されず `fullState` を直接使えばよい。ポリシー「未使用コード」に該当 | `gameFlow.test.ts:291` |
| 4 | AIR-004 | `startGame` に `processingRef` ガード欠落 | `handleAction` には二重実行防止があるが `startGame` にはない。連打で競合する。また `startGame` には `try/finally` もなく、エラー時に `processingRef` がリセットされない | `useGameController.ts:20-30` |

## 補足（Warning — 非ブロッキング）

| finding_id | 項目 | ファイル:行 |
|------------|------|-------------|
| AIR-W02 | `gameFlow.async.test.ts:206` — `expect(onProgress).toBeDefined()` は `vi.fn()` の存在確認のみで、テスト名（「onProgressが呼ばれない」）の検証になっていない。テストとして無意味 | `gameFlow.async.test.ts:206` |