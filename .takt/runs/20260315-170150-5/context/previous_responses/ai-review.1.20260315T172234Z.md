All imports in debug_game2.ts are used. Now let me compile the final review.

---

# AI Antipattern Review Report

## 判定: ❌ REJECT

ブロッキング問題が2件あるため差し戻します。

---

## ブロッキング問題

### 1. `finding_id: UNUSED_IMPORT_1` [new]
**debug_game.ts:3 — 未使用インポート `isBettingRoundComplete`**

リファクタリングで `executeBettingRound` に処理を委譲した結果、`isBettingRoundComplete` のインポートが未使用になっている。変更起因の未使用コード。

```typescript
// debug_game.ts:3 — この行を削除
import { isBettingRoundComplete } from './src/domain/betting'
```

**修正方法:** この import 文を削除する。

---

### 2. `finding_id: SCOPE_SHRINK_1` [new]
**debug_game3.ts:29-41 — タスク1の要件取りこぼし（スコープ縮小）**

タスク指示は「3つのデバッグスクリプトは共有モジュールを利用する形にリファクタリングする」「差分部分はパラメータまたはコールバックとして注入できる設計にする」と明記している。しかし `debug_game3.ts` は `cpuFoldHumanCallSelector` のみを共有し、ベッティングループ（29-41行）はインラインのまま残っている。

`debug_game3.ts` にはアクションごとのログ出力（34行、39行）があるため現在の `executeBettingRound` をそのまま使えないが、これはタスク指示の「差分部分はパラメータまたはコールバックとして注入できる設計にする」に該当する。

**修正方法（2案のいずれか）:**

**案A:** `executeBettingRound` にオプショナルなログコールバックを追加し、`debug_game3.ts` から利用する:
```typescript
// debug_common.ts
export type ActionLogger = (state: GameState, playerIdx: number, action: PlayerAction) => void

export function executeBettingRound(
  state: GameState,
  selector: ActionSelector,
  maxActions: number,
  logger?: ActionLogger,
): GameState {
  // ... 既存ロジック + logger呼び出し
}
```

**案B:** `debug_game3.ts` は意図的に詳細デバッグスクリプトとして独立させ、共通化の対象外とする正当な理由がある場合は、その判断をコメントで明記する。ただし `debug_game3.ts` にも `debug_common.ts` の `setupCpuChips` に相当するチップ設定があるが、こちらは設定パターンが異なる（CPU個別設定 vs 一律設定）ため除外は妥当。ベッティングループ部分のみが問題。

---

## 警告（非ブロッキング）

### 3. `finding_id: WARN_CALCCHIPS_TEST_1` [new]
**debug_common.test.ts:32,39 — 新規テストファイルで `calcTotalChips` 未使用**

タスク5で `calcTotalChips` を抽出した目的は、`state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot` パターンを統一することだった。しかし新規作成された `debug_common.test.ts` の32行、39行で同じインラインパターンが使われている。`./src/domain/testHelpers` からのインポートは同ファイル内で既に `./src/domain/...` パスを使用しているため可能。

テストファイルの重複は原則 Warning のため非ブロッキングとするが、改善を推奨する。

### 4. `finding_id: WARN_INLINE_LOOP_1` [new]
**gameEngine.integration.test.ts:59-84 — 最初のテストのフロップ/ターン/リバーのインラインループ**

「should complete a full hand from setup through showdown」テストで、フロップ・ターン・リバーの各フェーズで同じベッティングラウンドループ（`while (!isBettingRoundComplete) { ... check }` ）が3回繰り返されている。`advanceAndCheckAll` ヘルパーが既に存在するため、このテストでも利用可能。ただし各フェーズでコミュニティカード枚数のアサーションを挟んでいるため、完全な置換は設計判断が必要。テストファイルの重複のため非ブロッキング。

---

## 確認済み（問題なし）

- **タスク2（EXPECTED_EXPORTS定数化）:** 正しく実装されている。19-31行に定数化され、2つのテスト（343行, 356行）から参照。
- **タスク3（advanceAndCheckAllヘルパー）:** ヘルパー関数が抽出され、6箇所で使用されている。
- **タスク4（waitForGameEndヘルパー）:** ヘルパー関数が抽出され、6箇所で使用されている。
- **タスク5（calcTotalChips）:** `testHelpers.ts` に抽出され、5つのテストファイルで適用済み。テスト（`testHelpers.calcTotalChips.test.ts`）も追加されている。
- **debug_common.ts:** 型安全、不変性を保持、フォールバック乱用なし。
- **debug_game.ts, debug_game2.ts:** 正しく共有モジュールを利用している。
- **幻覚API・存在しないメソッド:** 検出なし。全インポートは実在するモジュールとエクスポートを参照。
- **過剰エンジニアリング:** 検出なし。`debug_common.ts` の抽象化レベルは適切。
- **any型の使用:** なし。
- **TODOコメント:** なし。
- **エラー握りつぶし:** なし。