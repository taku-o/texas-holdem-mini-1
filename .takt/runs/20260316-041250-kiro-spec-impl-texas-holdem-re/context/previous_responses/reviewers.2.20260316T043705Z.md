## arch-review
修正が正しく行われていることを確認。全ファイルが行数基準内。DRY違反は解消済み。新たなブロッキング問題なし。

## Architecture Review — タスク2: ブラインド・ショートスタック修正（Iteration 2）

### 判定: **APPROVE**

### サマリー
前回指摘の ARCH-001（DRY違反）が適切に解消された。`findNextEligibleIndex` が `dealing.ts` から export され、`handProgression.ts` の `getNextDealerIndex` が共通ヘルパーを再利用する3行の関数に簡素化されている。単体テスト4件も追加済み。新たなブロッキング問題はない。

### 確認した観点
- [x] 構造・設計
- [x] コード品質
- [x] 変更スコープ
- [x] テストカバレッジ
- [x] デッドコード
- [x] 呼び出しチェーン検証

### 解消済み（resolved）

| finding_id | 解消根拠 |
|------------|----------|
| ARCH-001-dry-eligible-index | `src/domain/handProgression.ts:68-70` — `getNextDealerIndex` が `findNextEligibleIndex` を呼び出す3行に簡素化。重複ロジック削除。`src/domain/dealing.test.ts:385-420` に単体テスト4件追加 |

---

## supervise
前回のアーキテクトレビューで指摘された ARCH-001-dry-eligible-index は解消済みであることを確認しました。

検証結果をまとめます：

**要件充足検証（実コード照合済み）:**

| # | 要件 | 根拠 |
|---|------|------|
| 2.1 | `currentBet` に実際のBB額を設定 | `dealing.ts:27` `bbAmount = Math.min(BIG_BLIND, players[bbIndex].chips)` → `dealing.ts:35` `currentBet: bbAmount` ✅ |
| 2.2 | チップ0プレイヤーのブラインドスキップ | `dealing.ts:4-16` `findNextEligibleIndex` で `chips > 0` 探索、`dealing.ts:20-21` SB/BBに使用 ✅ |
| 2.2補 | preparePreflopRoundのBBインデックス | `handProgression.ts:28` `nextState.lastAggressorIndex!` ✅ |

**修正指摘の解消検証:**
- ARCH-001-dry-eligible-index: `handProgression.ts:68-71` — `getNextDealerIndex` が `findNextEligibleIndex` を再利用する3行に簡素化 ✅
- `dealing.test.ts:385-421` — `findNextEligibleIndex` の単体テスト4件追加 ✅

**テスト・ビルド:**
- 418テスト全パス ✅
- `npx tsc --noEmit` 型エラーなし ✅

すべての要件充足、指摘解消、テスト・型チェック通過を確認。APPROVE とします。

---

# 最終検証結果

## 結果: APPROVE

## 要件充足チェック

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 2.1 | `currentBet` に実際にポストしたBB額を設定する（`BIG_BLIND` 固定にしない） | ✅ | `src/domain/dealing.ts:27` — `Math.min(BIG_BLIND, players[bbIndex].chips)` で実BB額算出、`src/domain/dealing.ts:35` — `currentBet: bbAmount` で設定 |
| 2.2 | チップ0のプレイヤーにはブラインドをポストさせず、アクティブなプレイヤーのみからSB/BBを徴収する | ✅ | `src/domain/dealing.ts:4-16` — `findNextEligibleIndex` で `chips > 0` を探索、`src/domain/dealing.ts:20-21` — SB/BB決定に使用 |
| 2.2補 | `preparePreflopRound` のBBインデックスが実際のBB位置を使用する | ✅ | `src/domain/handProgression.ts:28` — `nextState.lastAggressorIndex!` で実際のBBインデックスを取得 |

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` — 24ファイル 418テスト全パス |
| 型チェック | ✅ | `npx tsc --noEmit` エラーなし |
| 要件2.1 動作確認 | ✅ | テスト: BB=7→currentBet=7, BB=4→currentBet=4, preparePreflopRound経由でcurrentBet=7 |
| 要件2.2 動作確認 | ✅ | テスト: SBスキップ、BBスキップ、連続スキップ、lastAggressorIndex、UTG位置 |
| DRY修正 | ✅ | `getNextDealerIndex` が `findNextEligibleIndex` を再利用（3行に簡素化） |
| リグレッション | ✅ | 418テスト全パス |

## 今回の指摘（new）

なし

## 継続指摘（persists）

なし

## 解消済み（resolved）

| finding_id | 解消根拠 |
|------------|----------|
| ARCH-001-dry-eligible-index | `src/domain/handProgression.ts:68-71` — `getNextDealerIndex` が `findNextEligibleIndex(state.players, state.dealerIndex)` を呼び出す3行に簡素化。重複do-whileループ削除。`src/domain/dealing.test.ts:385-421` に `findNextEligibleIndex` の単体テスト4件追加 |

## 成果物

- 変更: `src/domain/dealing.ts` — `findNextEligibleIndex` を export 化、SB/BBスキップロジック、`currentBet: bbAmount`
- 変更: `src/domain/handProgression.ts` — `getNextDealerIndex` を `findNextEligibleIndex` 再利用に簡素化、BBインデックスを `lastAggressorIndex!` に変更
- 変更: `src/domain/dealing.test.ts` — 新テスト11件追加（ショートスタック7件 + findNextEligibleIndex 4件）
- 変更: `src/domain/handProgression.test.ts` — 新テスト2件追加、既存テスト1件修正
- 変更: `src/application/gameFlow.test.ts` — 既存テスト2件のアサーションをチップ保存則に変更