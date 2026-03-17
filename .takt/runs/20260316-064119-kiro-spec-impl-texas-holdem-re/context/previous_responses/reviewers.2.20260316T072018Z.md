## arch-review
All checks complete. Here is my review:

---

# アーキテクチャレビュー

## 結果: APPROVE

## サマリー
前回指摘した5件（AIR-001〜AIR-004, ARCH-001）はすべて適切に修正され、新たな構造・設計上の問題は検出されなかった。

## 確認した観点
- [x] 構造・設計
- [x] コード品質
- [x] 変更スコープ
- [x] テストカバレッジ
- [x] デッドコード
- [x] 呼び出しチェーン検証

## 今回の指摘（new）

なし

## 継続指摘（persists）

なし

## 解消済み（resolved）
| finding_id | 解消根拠 |
|------------|----------|
| AIR-001 | `useGameController.ts:33-36` — `.catch(console.error)` 削除、`catch(e)` で `setGameState(null)` + `throw e` による適切なエラー復旧を確認 |
| AIR-004 | `useGameController.ts:21-22` — `startGame` 先頭に `if (processingRef.current) return` + `processingRef.current = true` 追加、`finally` でリセットを確認。`useGameController.test.ts:391-406` に二重実行防止テスト追加 |
| AIR-002 | `useGameController.ts:78` — 説明コメント削除を確認 |
| AIR-003 | `gameFlow.test.ts:291` — `let state = fullState` 削除、`fullState` を直接使用に変更を確認 |
| ARCH-001 | `gameFlow.async.test.ts:204-205` — `expect(result.phase).toBe('idle')` + `expect(onProgress).not.toHaveBeenCalled()` に変更、意味のあるアサーションを確認 |

---

## supervise
Now I have a complete picture. Let me verify the previous findings resolution and the new regression.

**Previous REJECT findings verification:**
- **AIR-002** (what comment at line 68): ✅ RESOLVED — comment removed, line 78 is just `gameStateRef.current = gameState`
- **AIR-003** (unused variable at test line 291): ✅ RESOLVED — `fullState` used directly at line 291
- **AIR-004** (missing guard): ✅ RESOLVED — `startGame` now has `if (processingRef.current) return` at line 21 + `processingRef.current = true` at line 22 + `try/catch/finally`
- **AIR-001** (error swallowing): ⚠️ Partially resolved — `.catch(console.error)` removed, state recovery added in `startGame`, BUT `throw e` at line 36 creates **unhandled promise rejection** causing `vitest` to exit with code 1

**New regression**: `npx vitest run src/App.test.tsx` exits with **code 1** (2 unhandled rejections). The `throw e` at `useGameController.ts:36` inside an async IIFE whose promise is never caught causes `ReferenceError: window is not defined` after test teardown → `setGameState(null)` in catch → another failure → `throw e` → unhandled rejection. Additionally, `handleAction` (line 50-63) has `try/finally` with **no catch at all** — errors from `handlePlayerAction` propagate as unhandled rejections without state recovery.

---

# 最終検証結果

## 結果: REJECT

## 要件充足チェック

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1 | CPUの連続ターン処理をメインスレッドを長時間ブロックしない形に変更する | ✅ | `gameFlow.ts:51-53` — `yieldToMainThread()` が `setTimeout(resolve, 0)` で実装。`:104` で各CPUアクション後に `await yieldToMainThread()` |
| 2 | 一定件数ごとにyieldする、または非同期で次のティックに回す | ✅ | `gameFlow.ts:102-104` — CPUアクション適用後に毎回 `onProgress?.(current)` → `await yieldToMainThread()` |
| 3 | 状態更新・再描画のサイクルが進むようにする | ✅ | `gameFlow.ts:58,103` — `onProgress` コールバックで中間状態を通知。`useGameController.ts:29,56` — `setGameState` を `onProgress` として渡す |
| 4 | 呼び出し側（useGameController）とのインターフェースに合わせて実装する | ✅ | `useGameController.ts:11-12` — `startGame: () => void`, `handleAction: (action: PlayerAction) => void` の外部シグネチャ維持 |

**タスク本来の目的は達成されている。** ただし、AIR-001の修正が新たな回帰（unhandled promise rejection → テスト exit code 1）を生んでいる。

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ❌ | `npx vitest run` — 452 passed, **Errors: 1 error**（exit code 1） |
| テスト（単体） | ❌ | `npx vitest run src/App.test.tsx` — 5 passed, **Errors: 2 errors**（exit code 1） |
| 型チェック | ✅ | `npx tsc --noEmit` — エラーなし |
| ビルド | ✅ | `npx vite build` — 成功 |

## 今回の指摘（new）

| # | finding_id | 項目 | 根拠 | 理由 | 必要アクション |
|---|------------|------|------|------|----------------|
| 1 | VAL-001 | `startGame` の `throw e` が unhandled promise rejection を生成 | `useGameController.ts:36` | async IIFE `(async () => { ... })()` の promise は誰もキャッチしない。`catch` ブロック内の `throw e` は unhandled rejection となり、`npx vitest run src/App.test.tsx` が exit code 1 で失敗する。`App.test.tsx` がゲーム開始後にテスト環境を破棄 → `setTimeout` コールバック実行 → `setGameState` が `window is not defined` で失敗 → `catch` で `setGameState(null)` がさらに失敗 → `throw e` → unhandled rejection | `throw e` を削除する。async IIFE 内の `catch` は最終的なエラーハンドラであり、再 throw しても受け取り手がいない。状態復旧（`setGameState(null)`, `gameStateRef.current = null`）は維持し、`console.error(e)` で記録するのみとする（IIFE 最外殻の catch は「握りつぶし」ではなく「最終ハンドラ」として機能する） |
| 2 | VAL-002 | `handleAction` のエラーハンドリング欠落 | `useGameController.ts:50-63` | `.catch(console.error)` 削除後、`try/finally` のみで `catch` がない。`handlePlayerAction` が例外を投げた場合、`processingRef` はリセットされるが、状態復旧もエラー記録もなく unhandled rejection になる | `startGame` と同様に `catch (e)` ブロックを追加し、エラー時の状態復旧（例: `gameStateRef` と `gameState` を直前の値に保持するだけなら何もしなくてよいが、最低限 `console.error(e)` でログ記録）を行う。再 throw しないこと |

## 継続指摘（persists）

なし

## 解消済み（resolved）

| finding_id | 解消根拠 |
|------------|----------|
| AIR-001 | `useGameController.ts:30,53` — `.catch(console.error)` は削除済み。`startGame` に `try/catch/finally` と状態復旧あり（ただし `throw e` が新問題 VAL-001 を生成） |
| AIR-002 | `useGameController.ts:78` — コメント削除済み。`gameStateRef.current = gameState` のみ |
| AIR-003 | `gameFlow.test.ts:291` — `let state = fullState` 削除済み。`fullState` を直接使用 |
| AIR-004 | `useGameController.ts:21-22` — `if (processingRef.current) return` + `processingRef.current = true` 追加済み。`try/finally` で `processingRef` リセット |

## 成果物

- 変更: `src/application/gameFlow.ts` — async化、yieldToMainThread、onProgressコールバック
- 変更: `src/application/useGameController.ts` — async IIFE化、gameStateRef/processingRef追加
- 変更: `src/application/gameFlow.test.ts` — async/await対応
- 変更: `src/application/useGameController.test.ts` — async act + waitForパターン対応
- 作成: `src/application/gameFlow.async.test.ts` — 非同期動作・onProgress専用テスト

## REJECT判定条件

- `new` が2件（VAL-001, VAL-002）あるため REJECT
- VAL-001 は `npx vitest run` で exit code 1 を発生させる回帰であり、CI を破壊する