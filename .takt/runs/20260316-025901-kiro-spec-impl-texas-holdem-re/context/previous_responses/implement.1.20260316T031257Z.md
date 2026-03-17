## 作業結果
- 計画のサブタスク 1.1〜1.4 に対応する実装を完了し、全23テストがパスするようになった
- 既存の全383テストも影響なくパス（合計406テスト全パス）

## 変更内容
- **変更**: `src/domain/types.ts` — `ValidAction` 型を追加（`type: ActionType`, `min?: number`, `max?: number`）
- **変更**: `src/domain/betting.ts` — 3つの関数を修正:
  - `getValidActions`: 返却型を `ValidAction[]` に変更、チップ残高による bet/raise フィルタリング追加、bet/raise に min/max 範囲を付与
  - `applyAction`: bet/raise の amount バリデーション追加（チップ超過・最小額未満のチェック、オールイン許可）
  - `isBettingRoundComplete`: lastAggressor がオールインの場合、全アクティブプレイヤーが currentBet に揃ったかで判定するよう修正
- **変更**: `src/domain/gameEngine.ts` — `ValidAction` 型の re-export を追加
- **変更**: `src/application/useGameController.ts` — `validActions` の型を `ValidAction[]` に変更
- **変更**: `src/ui/ActionBar.tsx` — `validActions` props の型を `ValidAction[]` に変更
- **変更**: `src/ui/GameScreen.tsx` — `validActions` props の型を `ValidAction[]` に変更
- **変更**: `src/ui/ActionBar.test.tsx` — 型アノテーションを `PlayerAction[]` から `ValidAction[]` に更新
- **変更**: `src/ui/GameScreen.test.tsx` — 型アノテーションを `PlayerAction[]` から `ValidAction[]` に更新

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし（正常完了）

## テスト結果
- `npx vitest run` — 24ファイル、406テスト全パス（Duration: 3.62s）