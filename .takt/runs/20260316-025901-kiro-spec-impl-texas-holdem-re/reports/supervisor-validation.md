# 最終検証結果

## 結果: REJECT

## 要件充足チェック

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1.1 | ベット・レイズ時に action.amount がプレイヤー所持チップ以下であることを検証し、違反時は状態を更新せずエラーを返す。レイズ額が最低レイズ額以上かも検証する | ✅ | `src/domain/betting.ts:77-86`（bet: amount > chips → throw、amount < BIG_BLIND かつ非オールイン → throw）、`src/domain/betting.ts:96-107`（raise: raiseAmount > chips → throw、raiseTotal < minRaise かつ非オールイン → throw）。テスト: `src/domain/betting-validation.test.ts:258-437` 全パス |
| 1.2 | レイズ選択可能条件に「コール額＋最低レイズ額を支払えるか」を追加し、支払えない場合はレイズを無効にする | ✅ | `src/domain/betting.ts:18-23, 27-32`（`minRaiseCost = minRaiseTotal - player.currentBetInRound` → `player.chips >= minRaiseCost` でフィルタ）。テスト: `src/domain/betting-validation.test.ts:116-140` 全パス |
| 1.3 | lastAggressorがオールインでアクティブでない場合でもベッティングラウンドが正しく終了するように変更する | ✅ | `src/domain/betting.ts:133-141`（aggressor の `!folded && chips > 0` を確認し、オールイン時は `nonFolded.every(p => p.chips === 0 \|\| p.currentBetInRound >= currentBet)` にフォールバック）。テスト: `src/domain/betting-validation.test.ts:440-555` 全パス |
| 1.4 | 有効アクション取得時にベット/レイズのmin/max範囲を返し、UIがチップ入力の範囲として利用できるようにする | ❌ | ドメイン側: `src/domain/betting.ts:15`（`{ type: 'bet', min: BIG_BLIND, max: player.chips }`）、`src/domain/betting.ts:22`（`{ type: 'raise', min: minRaiseTotal, max: maxRaiseTotal }`）は実装済み。**しかし** `src/ui/ActionBar.tsx:29-35,73-78` が `validActions` の min/max を無視し、`getMinBet()`/`getMinRaise()`/`getSliderProps()` で独自計算している。最低レイズ額がドメイン（`currentBet + BIG_BLIND`）とUI（`currentBet * 2`）で乖離する実バグがある |

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npm test` — 406 passed, 0 failed (24 test files) |
| ビルド | ✅ | `npm run build` — tsc + vite build 成功 |
| 動作確認 | ❌ | ActionBarのmin raise値がドメインと乖離（例: currentBet=30, BIG_BLIND=10 → ドメイン min=40, UI min=60） |

## 今回の指摘（new）

| # | finding_id | 項目 | 根拠 | 理由 | 必要アクション |
|---|------------|------|------|------|----------------|
| 1 | VAL-NEW-ActionBar-wiring-L29 | タスク1.4未達成: ActionBarがValidAction.min/maxを使用していない | `src/ui/ActionBar.tsx:29-35,73-78` | 計画書に「ActionBar の `getMinBet`/`getMinRaise` を削除し `validActions` から取得」と明記されているが未実施。ドメインの最低レイズ額（`currentBet + BIG_BLIND`）とUIの独自計算（`currentBet * 2`）が乖離し、スライダーの min 値が不正になる実バグ | `getMinBet()`/`getMinRaise()`/`getSliderProps()` を削除し、`validActions.find(a => a.type === 'bet')?.min` / `validActions.find(a => a.type === 'raise')?.min` 等でドメインから渡された min/max を使用する。`BIG_BLIND` の import も不要になる |

## 継続指摘（persists）

AI Review で検出され未対応のまま残っている指摘:

| # | finding_id | 前回根拠 | 今回根拠 | 理由 | 必要アクション |
|---|------------|----------|----------|------|----------------|
| 1 | AI-COMMENT-01 | `src/domain/betting.ts:43` | `src/domain/betting.ts:43` | 説明コメント `// bet/raise は個別のバリデーションで検証するため…` が残存。ポリシーのREJECT基準「説明コメント（What/How）」に該当 | コメントを削除する |
| 2 | AI-COMMENT-02 | `src/domain/betting.ts:138` | `src/domain/betting.ts:138` | 説明コメント `// lastAggressor がオールイン → …` が残存。同上 | コメントを削除する |
| 3 | AI-DRY-01 | `src/domain/betting.ts:139-141, 144-146` | `src/domain/betting.ts:139-141, 144-146` | `nonFolded.every((p) => p.chips === 0 \|\| p.currentBetInRound >= state.currentBet)` が完全同一で2箇所に重複。ポリシーのREJECT基準「本質的に同じロジックの重複（DRY違反）」に該当 | lastAggressorがアクティブな場合のみ早期returnし、それ以外は関数末尾の1箇所に統一する |
| 4 | AI-VALIDATION-GAP-01 | `src/domain/betting.ts:44` | `src/domain/betting.ts:44` | bet/raiseがgetValidActionsのアクション種別チェックをバイパスしている。currentBet > 0時にbet送信が通る等の不整合が発生しうる | 全アクション種別でgetValidActionsチェックを通し、bet/raiseは追加でamountバリデーションを行う。オールインbet（chips < BIG_BLIND）は getValidActions 側で対応するか、applyAction のamount検証で十分にカバーする |

## 解消済み（resolved）

なし

## 成果物

- 作成: `src/domain/betting-validation.test.ts`（バリデーション・ラウンド終了・min/maxテスト 20ケース）
- 変更: `src/domain/types.ts`（ValidAction型追加）
- 変更: `src/domain/betting.ts`（getValidActions min/max返却、applyAction バリデーション追加、isBettingRoundComplete オールインaggressor対応）
- 変更: `src/domain/gameEngine.ts`（ValidAction re-export追加）
- 変更: `src/application/useGameController.ts`（ValidAction型に更新）
- 変更: `src/ui/ActionBar.tsx`（型のみValidAction[]に更新、ロジック未変更）
- 変更: `src/ui/ActionBar.test.tsx`（型更新）
- 変更: `src/ui/GameScreen.tsx`（型更新）
- 変更: `src/ui/GameScreen.test.tsx`（型更新）

## REJECT判定条件

- `new` が 1 件（VAL-NEW-ActionBar-wiring-L29: タスク1.4の要件未達成 + 実バグ）
- `persists` が 4 件（AI-COMMENT-01, AI-COMMENT-02, AI-DRY-01, AI-VALIDATION-GAP-01: AI Review指摘が全て未対応）