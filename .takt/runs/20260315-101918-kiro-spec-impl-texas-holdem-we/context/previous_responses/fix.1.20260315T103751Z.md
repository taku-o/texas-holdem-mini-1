全254テストがパス（新規1テスト追加）。ビルドも型エラーなし。

## 作業結果
- ARCH-001: `gameFlow.test.ts` の未使用インポート4件（`applyAction`, `isBettingRoundComplete`, `advancePhase`, `preparePreflopRound`）を削除
- ARCH-002 + AIR-001（統合対応）: `useGameController.ts` の `computeIsHumanTurn` を `findIndex` パターンから `state.players[state.currentPlayerIndex].isHuman` の直接アクセスパターンに修正（`gameFlow.ts:90` と統一）
- `redundant-code` family_tag の再発防止テストを追加

## 変更内容
- **変更**: `src/application/gameFlow.test.ts` — 未使用インポート4件削除（行4-8）
- **変更**: `src/application/useGameController.ts` — `computeIsHumanTurn` を直接アクセスパターンに簡略化（行17-18 → 行17）
- **変更**: `src/application/useGameController.test.ts` — `isHumanTurn の一貫性` テスト1件追加

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし（成功）

## テスト結果
- `npx vitest run` — 全254テストパス（15ファイル）

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 2 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `gameFlow.test.ts` 行4-8: 未使用の `applyAction`, `isBettingRoundComplete`, `advancePhase`, `preparePreflopRound` インポートを削除
- `useGameController.ts` 行15-18: `computeIsHumanTurn` が `state.players[state.currentPlayerIndex].isHuman` に置換されていることを確認
- `gameFlow.ts:90` の `currentPlayer.isHuman` パターンとの整合性を確認
- Grep で `findIndex.*isHuman` をプロダクションコード内で検索 → 該当なし（テストファイルのみ）
- ビルド成功、254テスト全パス