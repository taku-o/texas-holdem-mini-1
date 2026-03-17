## arch-review
全ファイルの実コード確認が完了しました。レビュー結果をまとめます。

---

# アーキテクチャレビュー

## 結果: REJECT

## サマリー

ARCH-001（DRY違反）は `preparePreflopRound` 関数抽出により適切に解消された。しかし、このリファクタリングの結果、`gameSetup.ts:21` と `handProgression.ts:87` で `let` 宣言の再代入が不要になったにもかかわらず `const` に変更されておらず、冗長な宣言が残存している。

## 確認した観点
- [x] 構造・設計
- [x] コード品質
- [x] 変更スコープ
- [x] テストカバレッジ
- [x] デッドコード
- [x] 呼び出しチェーン検証

## 今回の指摘（new）

| # | finding_id | family_tag | スコープ | 場所 | 問題 | 修正案 |
|---|------------|------------|---------|------|------|--------|
| 1 | ARCH-002-let-to-const | refactoring-artifact | スコープ内 | `src/domain/gameSetup.ts:21`, `src/domain/handProgression.ts:87` | `preparePreflopRound` 抽出により `state` / `nextState` への再代入が不要になったが、`let` 宣言が `const` に変更されていない。リファクタリング起因の冗長な宣言 | 両ファイルの `let` を `const` に変更する（`gameSetup.ts:21` `let state` → `const state`、`handProgression.ts:87` `let nextState` → `const nextState`） |

## 継続指摘（persists）

なし

## 解消済み（resolved）

| finding_id | 解消根拠 |
|------------|----------|
| ARCH-001-dry-preflop-setup | `src/domain/handProgression.ts:19-26` に `preparePreflopRound` を抽出。`gameSetup.ts:34` と `handProgression.ts:100` の両方がこの関数を呼び出しており、重複コードは完全に排除されている。テスト2件追加済み（`handProgression.test.ts:53-87`）。ファサード（`gameEngine.ts`）は `preparePreflopRound` を公開していない（内部ユーティリティとして適切）。循環依存なし |

## 再開指摘（reopened）

なし

## REJECT判定条件

- `new` が1件（ARCH-002-let-to-const）あるため REJECT

---

## supervise
全検証完了。ARCH-001（DRY違反）の修正を確認済み：

- `gameSetup.ts:34` → `return preparePreflopRound(state)` に統合 ✅
- `handProgression.ts:100` → `return preparePreflopRound(nextState)` に統合 ✅  
- `gameSetup.ts` から旧import（postBlinds/dealHoleCards/getNextActivePlayerIndex）が除去済み ✅
- `preparePreflopRound` は `gameEngine.ts` のファサードに再エクスポートされていない（内部API適切） ✅
- 11ファイル・162テスト全パス ✅

---

# 最終検証結果

## 結果: APPROVE

## 要件充足チェック

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 4.1 | ゲーム開始時に人間の席をランダムに1席決め、全プレイヤーに初期チップを付与した状態を生成 | ✅ | `src/domain/gameSetup.ts:7-8` — randomFnでランダム席・ディーラー決定、`:13` — INITIAL_CHIPSで全員1000チップ |
| 4.2 | ディーラー左隣をSB・その左をBBとしてブラインドをポストし、ホールカード2枚を配る | ✅ | `src/domain/dealing.ts:7-8` — SB=dealer+1, BB=dealer+2、`:10-16` — チップ不足時Math.min対応、`:29-31` — 各プレイヤーに2枚配布 |
| 4.3 | ベッティングラウンドでfold/check/bet/call/raiseを受け付け、検証し状態更新（オールイン許容・単一ポット） | ✅ | `src/domain/betting.ts:3-23` — getValidActionsで判定、`:25-98` — applyActionで検証+更新、`:50-51` — Math.minでオールイン |
| 4.4 | ショーダウンで役判定→勝者決定→ポット配分、チップ0プレイヤーを参加不可 | ✅ | `src/domain/showdown.ts:14` — evaluate()、`:16-22` — 最小スコアが勝者、`:30-31` — 均等分配。`betting.ts:124` でチップ0スキップ |
| 4.5 | ハンド終了後ディーラーボタンを次プレイヤーに移し、次ハンド開始 | ✅ | `src/domain/handProgression.ts:63-70` — getNextDealerIndex、`:73-101` — startNextHand |
| 4.6 | ゲーム終了条件（人間チップ0、CPU全員チップ0）で終了状態に遷移 | ✅ | `src/domain/handProgression.ts:103-118` — isGameOverで2条件判定 |
| 4.7 | ディーラー業務を一連の流れで正しく行えるよう組み合わせ | ✅ | `src/domain/gameEngine.ts:1-17` — ファサードで全パブリック関数を再エクスポート |

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` — 11ファイル、162テスト全パス |
| ビルド | ✅ | TypeScriptエラーなし |
| DRY違反修正 | ✅ | ARCH-001解消確認（preparePreflopRound抽出、旧import除去） |
| AIレビュー指摘 | ✅ | AI-AR-001〜004全解消 |
| スコープクリープ | ✅ | ファイル削除なし、変更は計画どおり |

## 今回の指摘（new）
なし

## 継続指摘（persists）
なし

## 解消済み（resolved）

| finding_id | 解消根拠 |
|------------|----------|
| ARCH-001-dry-preflop-setup | `handProgression.ts:19-26` に `preparePreflopRound` を抽出。`gameSetup.ts:34` と `handProgression.ts:100` の両方から呼び出し、重複コード解消。旧import（postBlinds/dealHoleCards/getNextActivePlayerIndex）はgrepで0件確認 |

## 成果物
- 作成: `src/domain/deck.ts`, `src/domain/gameSetup.ts`, `src/domain/dealing.ts`, `src/domain/betting.ts`, `src/domain/showdown.ts`, `src/domain/handProgression.ts`, `src/domain/gameEngine.ts`
- 作成（テスト）: `src/domain/deck.test.ts`, `src/domain/gameSetup.test.ts`, `src/domain/dealing.test.ts`, `src/domain/betting.test.ts`, `src/domain/showdown.test.ts`, `src/domain/handProgression.test.ts`, `src/domain/gameEngine.integration.test.ts`
- 変更: `src/domain/types.ts`, `src/domain/types.test.ts`