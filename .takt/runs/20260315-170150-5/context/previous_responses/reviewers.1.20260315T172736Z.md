## arch-review
All facts verified. Now I can compile the architecture review.

---

# Architecture Review Report

## 判定: ❌ REJECT

ブロッキング問題が1件あるため差し戻します。

---

## 前回指摘の追跡

| finding_id | 前回状態 | 今回状態 | 根拠 |
|---|---|---|---|
| UNUSED_IMPORT_1 | new | **persists** | debug_game.ts:3 に未使用の `isBettingRoundComplete` が残存 |
| SCOPE_SHRINK_1 | new | **resolved** | coder-decisions.md に記録された設計判断を評価し、妥当と判断（後述） |
| WARN_CALCCHIPS_TEST_1 | new (warning) | **persists** | debug_common.test.ts:32,39 でインラインパターンが残存 |
| WARN_INLINE_LOOP_1 | new (warning) | **persists** | gameEngine.integration.test.ts:59-84 のインラインループが残存 |

---

## ブロッキング問題

### 1. `finding_id: UNUSED_IMPORT_1` [persists]
**debug_game.ts:3 — 未使用インポート `isBettingRoundComplete`**

`debug_game.ts` は `executeBettingRound`（debug_common.ts）に処理を委譲しており、`isBettingRoundComplete` を直接参照していない。import 文のみが残っている。

```typescript
// debug_game.ts:3 — この import は不要
import { isBettingRoundComplete } from './src/domain/betting'
```

ファイル内の全39行を確認済み。`isBettingRoundComplete` は3行目の import 以外に出現しない。

**修正方法:** この import 行を削除する。

---

## 設計判断の評価

### SCOPE_SHRINK_1 — debug_game3.ts のベッティングループ手動実装

coder-decisions.md に記録された判断:
> debug_game3.ts はステップごとに詳細ログを出力しており、executeBettingRound を使うとログが出なくなる。計画でも「シンプルさを優先するなら手動ループを残してもよい」と記載。

**アーキテクチャ観点での評価: 妥当**

理由:
1. `debug_game3.ts` はステップごとのログ出力を含む**診断用スクリプト**であり、プロダクションコードではない
2. `executeBettingRound` にロガーコールバックを追加すると、たった1つの消費者のためにAPIサーフェスが増大する
3. `debug_common.ts` は現在の4つのエクスポート（`executeBettingRound`, `setupCpuChips`, `callCheckSelector`, `cpuFoldHumanCallSelector`）で高凝集・低結合を維持している
4. ループの差分（12行）はロギングという完全に異なる関心事であり、debug_game3.ts のチップ設定も一律設定ではなく個別設定パターンのため、共通化の利得が限定的

---

## 警告（非ブロッキング）

### 2. `finding_id: WARN_CALCCHIPS_TEST_1` [persists]
**debug_common.test.ts:32,39 — calcTotalChips ヘルパー未使用**

タスク5で `calcTotalChips` を `src/domain/testHelpers.ts` に抽出したが、新規作成された `debug_common.test.ts` の2箇所でインラインパターンが使われている:

- 32行: `state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot`
- 39行: `result.players.reduce((sum, p) => sum + p.chips, 0) + result.pot`

同ファイル内で `./src/domain/...` パスを使用済みのため、`calcTotalChips` のインポートは可能。テストファイルの重複のため非ブロッキング。

### 3. `finding_id: WARN_INLINE_LOOP_1` [persists]
**gameEngine.integration.test.ts:59-84 — 最初のテストのベッティングラウンドインラインループ**

「should complete a full hand from setup through showdown」テストのフロップ・ターン・リバーで同じベッティングラウンドループが3回繰り返されている。`advanceAndCheckAll` ヘルパー（10-17行）が同ファイル内に存在するが、各フェーズでコミュニティカード枚数のアサーションを挟んでいるため完全な置換には設計判断が必要。テストファイルの重複のため非ブロッキング。

### 4. `finding_id: WARN_TESTFILE_SIZE_1` [new]
**src/application/gameFlow.test.ts — 880行（300行超）**

テストファイルの行数基準（300行超）を超過。テスト対象の `handlePlayerAction` と `advanceUntilHumanTurn` の2つの関数に対する包括的なテストであり、テストケース自体は論理的にまとまっているため、即座の分割は不要。ただし、今後テストが増加する場合は `handlePlayerAction.test.ts` と `advanceUntilHumanTurn.test.ts` への分割を検討すべき。テストファイルのため非ブロッキング。

---

## 確認済み（問題なし）

### モジュール設計
- **debug_common.ts（59行）:** 高凝集・低結合。4つのエクスポートは全てデバッグスクリプトのベッティングラウンド操作に関連。型定義（`ActionSelector`）も適切にエクスポート。
- **依存方向:** `debug_common.ts` → `src/domain/*`（下位層への依存のみ）。逆方向依存なし。循環依存なし。
- **calcTotalChips の配置:** `src/domain/testHelpers.ts` に配置。テスト用ユーティリティとして7ファイルから参照されており、配置は適切。

### コード品質
- **不変性:** `executeBettingRound`, `setupCpuChips` ともに入力の `GameState` を変更せず新しいオブジェクトを返す。テスト（debug_common.test.ts:67-79, 127-137）で検証済み。
- **any型の使用:** なし
- **TODOコメント:** なし
- **エラー握りつぶし:** なし
- **マジックナンバー:** デバッグスクリプトの定数（ループ回数20/30、CPUチップ30）は引数化不要なスクリプト固有値として許容

### 変更スコープ
- **サイズ:** Large（差分 +1263/-91行）。新規テストファイル（GameScreen.test.tsx: +342行）と既存テストの拡張が大部分を占め、論理的にまとまっている。
- **タスクとの整合:** 5つのタスク（debug共通化、expectedExports定数化、advanceAndCheckAllヘルパー、waitForGameEndヘルパー、calcTotalChips抽出）の変更スコープに整合している。

### 呼び出しチェーン
- `executeBettingRound` → `debug_game.ts`, `debug_game2.ts` から呼び出し確認済み
- `setupCpuChips` → `debug_game.ts`, `debug_game2.ts` から呼び出し確認済み
- `callCheckSelector` → `debug_game.ts` から呼び出し確認済み
- `cpuFoldHumanCallSelector` → `debug_game2.ts`, `debug_game3.ts` から呼び出し確認済み
- `calcTotalChips` → 5つのテストファイルから呼び出し確認済み（配線漏れなし）

---

## supervise
検証が完了しました。レポートを出力します。

# 最終検証結果

## 結果: REJECT

AIレビューで指摘された2件のブロッキング問題が未解決のまま残存しています。

## 要件充足チェック

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1-a | 共通部分を共有モジュール（debug_common.ts）に抽出する | ✅ | `debug_common.ts:1-59` — `executeBettingRound`, `setupCpuChips`, `callCheckSelector`, `cpuFoldHumanCallSelector` が定義 |
| 1-b | 差分部分はパラメータまたはコールバックとして注入できる設計にする | ❌ | `debug_common.ts:11-27` — `executeBettingRound` にロガーコールバック機構がなく、debug_game3.ts のログ差分を注入できない |
| 1-c | debug_game.ts は共有モジュールを利用する形にリファクタリング | ❌ | `debug_game.ts:3` — リファクタリングで不要になった `isBettingRoundComplete` のインポートが残存（未使用コード） |
| 1-d | debug_game2.ts は共有モジュールを利用する形にリファクタリング | ✅ | `debug_game2.ts:5` — `executeBettingRound`, `setupCpuChips`, `cpuFoldHumanCallSelector` をインポートして使用 |
| 1-e | debug_game3.ts は共有モジュールを利用する形にリファクタリング | ❌ | `debug_game3.ts:29-41` — ベッティングループがインラインのまま。`executeBettingRound` を使用していない。`cpuFoldHumanCallSelector` のみ共有 |
| 2 | expectedExports を1箇所で定義する共通定数に抽出 | ✅ | `src/domain/gameEngine.integration.test.ts:19-31` — `EXPECTED_EXPORTS` 定数化済み、L350,L363から参照 |
| 3 | ベッティングラウンド処理をヘルパー関数に抽出し3箇所を置換 | ✅ | `src/domain/gameEngine.integration.test.ts:10-17` — `advanceAndCheckAll` が定義、L141-143,L282,L286,L290で使用 |
| 4 | ゲーム終了待ちループをヘルパー関数に抽出し3箇所以上を置換 | ✅ | `src/application/useGameController.test.ts:9-21` — `waitForGameEnd` が定義、6箇所（L290,L307,L321,L388,L410,L487）で使用 |
| 5 | チップ保存則チェックをヘルパー関数に抽出し全使用箇所を置換 | ✅ | `src/domain/testHelpers.ts:9-11` — `calcTotalChips` 定義済み。5テストファイル全て（gameEngine 12箇所, gameFlow 11箇所, useGameController 4箇所, gameSetup 1箇所, showdown 3箇所）でインラインパターンが `calcTotalChips` に置換済み。src配下にインラインパターンの残存なし（定義箇所のみ） |

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` — 23ファイル 381テスト全パス |
| ビルド | ✅ | `npx tsc --noEmit` エラーなし |
| debug_game.ts 動作 | ✅ | `npx tsx debug_game.ts` — 20ハンド正常出力 |
| debug_game2.ts 動作 | ✅ | `npx tsx debug_game2.ts` — 30ハンド正常出力 |
| debug_game3.ts 動作 | ✅ | `npx tsx debug_game3.ts` — 1ハンド詳細ログ正常出力 |

## 成果物

- 作成: `debug_common.ts`, `debug_common.test.ts`, `src/domain/testHelpers.calcTotalChips.test.ts`
- 変更: `debug_game.ts`, `debug_game2.ts`, `debug_game3.ts`, `src/domain/testHelpers.ts`, `src/domain/gameEngine.integration.test.ts`, `src/application/useGameController.test.ts`, `src/application/gameFlow.test.ts`, `src/domain/gameSetup.test.ts`, `src/domain/showdown.test.ts`

## 未完了項目（REJECT理由）

| # | finding_id | 項目 | 理由 |
|---|------------|------|------|
| 1 | AI-UNUSED-IMPORT-debug_game-L3 [persists] | `debug_game.ts:3` — 未使用インポート `isBettingRoundComplete` | リファクタリングで `executeBettingRound` に処理を委譲した結果、直接使用されなくなったが import が残存。grepで確認済み：ファイル内の使用箇所はインポート行のみ。ポリシー「今回の変更により未使用になったコード → REJECT」に該当 |
| 2 | AI-SCOPE-SHRINK-debug_game3 [persists] | `debug_game3.ts:29-41` — タスク1の要件未充足 | タスク指示書は「3つのデバッグスクリプトは共有モジュールを利用する形にリファクタリングする」「差分部分はパラメータまたはコールバックとして注入できる設計にする」と明記。debug_game3.ts のベッティングループ（29-41行）はインラインのまま残り、`executeBettingRound` を使用していない。ログ出力が差分であるなら、タスク指示通りコールバックで注入可能にすべき |

### 修正方法

**問題1:** `debug_game.ts:3` の `import { isBettingRoundComplete } from './src/domain/betting'` を削除する。

**問題2:** `debug_common.ts` の `executeBettingRound` にオプショナルなロガーコールバックを追加し、`debug_game3.ts` から利用する：

```typescript
// debug_common.ts
export type ActionLogger = (state: GameState, playerIdx: number, action: PlayerAction) => void

export function executeBettingRound(
  state: GameState,
  selector: ActionSelector,
  maxActions: number,
  logger?: ActionLogger,
): GameState {
  let current = state
  let guard = 0
  while (!isBettingRoundComplete(current) && guard < maxActions) {
    const playerIdx = current.currentPlayerIndex
    const actions = getValidActions(current, playerIdx)
    const action = selector(current, playerIdx, actions)
    if (!action) break
    if (logger) logger(current, playerIdx, action)
    current = applyAction(current, playerIdx, action)
    guard++
  }
  return current
}
```

```typescript
// debug_game3.ts — ベッティングループを executeBettingRound に置換
const logger: ActionLogger = (state, playerIdx, action) => {
  const player = state.players[playerIdx]
  console.log(`\nTurn: player-${playerIdx}(${player.isHuman?'H':'C'}) chips=${player.chips}, actions=[${getValidActions(state, playerIdx).map(a=>a.type).join(',')}]`)
  console.log(`  -> ${action.type}`)
}
current = executeBettingRound(current, cpuFoldHumanCallSelector, 20, logger)
```