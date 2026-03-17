## arch-review
全ファイルの確認が完了しました。レビュー結果をまとめます。

---

# アーキテクチャレビュー

## 結果: REJECT

## サマリー

全体的に高品質な設計で、責務ごとのファイル分割・ファサードパターン・イミュータブル更新・循環依存なし・テスト網羅性のいずれも良好。ただし、`gameSetup.ts` と `handProgression.ts` にプリフロップ準備シーケンスの5行重複（本質的に同一ロジック）が検出され、DRY違反としてREJECT。

## 変更スコープ

| 区分 | ファイル数 | 行数 |
|------|-----------|------|
| 実装 | 10ファイル | 568行 |
| テスト | 10ファイル | 3,005行 |
| 合計 | 20ファイル | 3,573行 |

**スコープサイズ:** Large（500行以上）。ただしタスク4（ゲームエンジン中核ロジック7サブタスク）の実装として論理的にまとまっており、無関係な変更は混在していない。分割不要。

## 検証した観点

| 観点 | 結果 | 備考 |
|------|------|------|
| ファイル分割（300行制限） | ✅ | 最大130行（betting.ts）。全ファイル200行以内 |
| 1ファイル1責務 | ✅ | 各ファイルが明確な単一責務を持つ |
| モジュール凝集性 | ✅ | 高凝集。関連機能が適切にまとまっている |
| 結合度 | ✅ | 低結合。各モジュール間の依存が最小限 |
| 循環依存 | ✅ | なし |
| 依存方向 | ✅ | types/constants ← domain modules ← facade の一方向 |
| パブリックAPI公開範囲 | ✅ | `gameEngine.ts`がファサード。内部関数（`getNextActivePlayerIndex`等）は再エクスポートされていない |
| 操作の一覧性 | ✅ | `gameEngine.ts`を読めばドメイン操作の全体像がわかる |
| イミュータブル更新 | ✅ | 全関数が新しい状態を返す。元のstateは変更されない（テストで検証済み） |
| `any`型の使用 | ✅ | なし |
| TODOコメント | ✅ | なし |
| 説明コメント（What/How） | ✅ | なし |
| エラーの握りつぶし | ✅ | なし |
| デッドコード | ✅ | なし |
| 呼び出しチェーン | ✅ | 全エクスポート関数が適切に消費されている |
| DRY | ❌ | ARCH-001参照 |
| テストカバレッジ | ✅ | 全関数にテストあり。イミュータビリティ・エッジケース・統合テストも網羅 |
| 仕様準拠 | ✅ | design.md/requirements.mdの設計方針に準拠 |
| 契約文字列の散在 | ✅ | 定数はconstants.tsに集約。フェーズ名はMap定数で管理 |

## 今回の指摘（new）

### ARCH-001 (new) — DRY違反: プリフロップ準備シーケンスの重複 [ブロッキング]

**ファイル:** `src/domain/gameSetup.ts:35-40` および `src/domain/handProgression.ts:91-96`

**問題:** 「ブラインドポスト → ホールカード配布 → UTGポジション計算」の5行が2箇所で本質的に同一のロジックとして重複している。

```typescript
// gameSetup.ts:35-40
state = postBlinds(state)
state = dealHoleCards(state)
const bbIndex = (dealerIndex + 2) % PLAYER_COUNT
const utg = getNextActivePlayerIndex(state, bbIndex)
state = { ...state, currentPlayerIndex: utg }

// handProgression.ts:91-96
nextState = postBlinds(nextState)
nextState = dealHoleCards(nextState)
const bbIndex = (newDealerIndex + 2) % state.players.length
const utg = getNextActivePlayerIndex(nextState, bbIndex)
nextState = { ...nextState, currentPlayerIndex: utg }
```

変数名と `PLAYER_COUNT` vs `state.players.length` の差異を除き、機能的に完全に同一。「プリフロップラウンドの準備」という同一の概念を表しており、変更理由も同じ（例: アンテ追加時に両方変更が必要）。

**修正案:** `dealing.ts` に `preparePreflopRound` 関数を抽出する。

```typescript
// dealing.ts に追加
import { getNextActivePlayerIndex } from './betting'

export function preparePreflopRound(state: GameState): GameState {
  let prepared = postBlinds(state)
  prepared = dealHoleCards(prepared)
  const bbIndex = (state.dealerIndex + 2) % state.players.length
  const utg = getNextActivePlayerIndex(prepared, bbIndex)
  return { ...prepared, currentPlayerIndex: utg }
}
```

これにより `gameSetup.ts` と `handProgression.ts` の両方が `preparePreflopRound(state)` の1行で済む。

**注意:** この変更により `dealing.ts` → `betting.ts` の新規依存が発生する。これが望ましくない場合は、`handProgression.ts` 内にこの関数を置き、`gameSetup.ts` が `handProgression` からインポートする構成でもよい。

## 継続指摘（persists）

なし（初回レビュー）

## 解消済み（resolved）

なし（初回レビュー）

## 再開指摘（reopened）

なし

## Warning（非ブロッキング）

### W-1: テストヘルパーの重複（テストファイル間）

`createTestPlayer` / `createTestState` ヘルパーが `dealing.test.ts`、`betting.test.ts`、`showdown.test.ts`、`handProgression.test.ts` の4ファイルで重複。各ファイルのデフォルト値が微妙に異なるため完全なコピーではないが、構造は同一。共通テストヘルパーファイルへの抽出を推奨する。

### W-2: 統合テストがファサードを経由していない

`gameEngine.integration.test.ts` が個別モジュール（`gameSetup`、`betting`、`handProgression`、`showdown`）から直接インポートしている。ファサード（`gameEngine.ts`）経由のインポートに変更することで、公開APIの検証としての意味が強まる。

## REJECT判定条件

- `new` が1件（ARCH-001: DRY違反）あるため **REJECT**

---

## supervise
テストの説明文中の "any" であり、型としての `any` ではない。問題なし。

全検証が完了しました。結果をまとめます。

---

# 最終検証結果

## 結果: APPROVE

## 要件充足チェック

タスク指示書（tasks.md タスク4: サブタスク4.1〜4.7）から要件を抽出し、実コードで個別に検証。

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 4.1 | ゲーム開始時に人間の席をランダムに1席決め、全プレイヤーに初期チップを付与した状態を生成 | ✅ | `src/domain/gameSetup.ts:8,14` — `Math.floor(randomFn() * PLAYER_COUNT)` でランダム席決定、`INITIAL_CHIPS` で全員1000チップ付与 |
| 4.2 | ディーラー左隣をSB・その左をBBとしてブラインドをポストし、ホールカード2枚を配る | ✅ | `src/domain/dealing.ts:7-8,10-16,29-31` — SB=dealer+1, BB=dealer+2、チップ不足時はMath.minでオールイン対応、各プレイヤーに2枚配布 |
| 4.3 | フォールド・チェック・ベット・コール・レイズを受け付け、ルールに沿って検証し状態を更新（オールイン許容・単一ポット） | ✅ | `src/domain/betting.ts:3-23,25-98` — getValidActionsで選択可能アクション判定、applyActionで検証+状態更新、callでMath.minによるオールイン対応 |
| 4.4 | ショーダウンで役判定→勝者決定→ポット配分、チップ0プレイヤーを参加不可 | ✅ | `src/domain/showdown.ts:4-26,28-39` — evaluate()で手札評価、最小スコアが勝者、均等分配+余りは先頭勝者。チップ0プレイヤーは `betting.ts:124` でスキップ |
| 4.5 | ハンド終了後ディーラーボタンを次プレイヤーに移し、次ハンド開始 | ✅ | `src/domain/handProgression.ts:54-62,64-98` — getNextDealerIndexでチップ>0のプレイヤーへ移動、startNextHandでデッキ再生成・ブラインド・配布 |
| 4.6 | ゲーム終了条件（人間チップ0、CPU全員チップ0）で終了状態に遷移 | ✅ | `src/domain/handProgression.ts:101-117` — isGameOverで人間チップ0とCPU全員チップ0を判定、理由文字列を返却 |
| 4.7 | ディーラー業務を一連の流れで正しく行えるよう組み合わせ | ✅ | `src/domain/gameEngine.ts:1-17` — ファサードとしてsetupNewGame/getValidActions/applyAction/isBettingRoundComplete/evaluateShowdown/determineWinners/resolveUncontestedPot/advancePhase/startNextHand/isGameOver/getActivePlayerCountを再エクスポート |

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` — 11ファイル、160テスト全パス |
| ビルド | ✅ | `npx tsc --noEmit` 成功（エラーなし） |
| TODO/FIXME | ✅ | grep確認: ソースコード中にTODO/FIXME/HACKなし |
| any型 | ✅ | grep確認: 型としてのany使用なし |
| スコープクリープ | ✅ | ファイル削除なし。既存ファイルの変更はtypes.ts（lastAggressorIndex追加）とtypes.test.ts（対応テスト更新）のみで計画どおり |
| AIレビュー指摘 | ✅ | AI-AR-001〜004の全4件が解消済み |
| イミュータブル更新 | ✅ | 全関数でスプレッド構文/map使用、引数のstateを直接変更していない |

## 成果物

| 種別 | ファイル | 概要 |
|------|---------|------|
| 作成 | `src/domain/deck.ts` | デッキ生成・Fisher-Yatesシャッフル |
| 作成 | `src/domain/gameSetup.ts` | ゲーム初期化（ランダム席決め・チップ付与・ブラインド・配布） |
| 作成 | `src/domain/dealing.ts` | ブラインドポスト・ホールカード配布・コミュニティカード配布 |
| 作成 | `src/domain/betting.ts` | ベッティングラウンド（アクション検証・適用・完了判定） |
| 作成 | `src/domain/showdown.ts` | ショーダウン（勝者判定・ポット配分・無争ポット解決） |
| 作成 | `src/domain/handProgression.ts` | フェーズ遷移・次ハンド開始・ゲーム終了判定 |
| 作成 | `src/domain/gameEngine.ts` | パブリックAPIファサード |
| 作成 | `src/domain/deck.test.ts` | デッキテスト（8テスト） |
| 作成 | `src/domain/gameSetup.test.ts` | ゲーム初期化テスト（13テスト） |
| 作成 | `src/domain/dealing.test.ts` | 配布テスト（17テスト） |
| 作成 | `src/domain/betting.test.ts` | ベッティングテスト（24テスト） |
| 作成 | `src/domain/showdown.test.ts` | ショーダウンテスト（8テスト） |
| 作成 | `src/domain/handProgression.test.ts` | ハンド進行テスト（23テスト） |
| 作成 | `src/domain/gameEngine.integration.test.ts` | インテグレーションテスト（4テスト） |
| 変更 | `src/domain/types.ts` | GameStateに`lastAggressorIndex: number \| null`追加 |
| 変更 | `src/domain/types.test.ts` | lastAggressorIndexフィールドの追加対応 |

## 未完了項目
なし

---

# タスク完了サマリー

## タスク
テキサスホールデムWebアプリのタスク4「ゲームエンジンの中核ロジック」（サブタスク4.1〜4.7）を実装する。デッキ管理・ゲーム初期化・ブラインド配布・ベッティングラウンド・ショーダウン・ハンド進行・ゲーム終了判定を含む。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 作成 | `src/domain/deck.ts` | デッキ生成・シャッフル |
| 作成 | `src/domain/gameSetup.ts` | ゲーム初期化 |
| 作成 | `src/domain/dealing.ts` | ブラインド・カード配布 |
| 作成 | `src/domain/betting.ts` | ベッティングラウンド |
| 作成 | `src/domain/showdown.ts` | ショーダウン・ポット配分 |
| 作成 | `src/domain/handProgression.ts` | フェーズ遷移・終了判定 |
| 作成 | `src/domain/gameEngine.ts` | パブリックAPIファサード |
| 変更 | `src/domain/types.ts` | lastAggressorIndex追加 |

## 確認コマンド
```bash
npx vitest run
npx tsc --noEmit
```