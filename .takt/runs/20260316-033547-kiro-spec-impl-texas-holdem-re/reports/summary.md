# タスク完了サマリー

## タスク
タスク1（サブタスク1.1〜1.4）— ベッティングのバリデーションとラウンド終了・有効アクション返却の修正。ベット/レイズ額の検証強化、レイズ可否判定、オールインaggressorのラウンド終了判定、getValidActionsのmin/max返却を実装する。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 変更 | `src/domain/betting.ts` | getValidActionsにチップベースのbet/raise可否判定・min/max返却を追加、applyActionにamountバリデーション追加、isBettingRoundCompleteにオールインaggressor対応追加 |
| 変更 | `src/domain/types.ts` | ValidAction型（type, min?, max?）を追加 |
| 変更 | `src/domain/gameEngine.ts` | ValidActionのimport追加 |
| 変更 | `src/application/useGameController.ts` | PlayerAction[] → ValidAction[] の型変更 |
| 変更 | `src/ui/ActionBar.tsx` | getMinBet/getMinRaise削除、ValidAction.min/max使用に変更、不要props削除 |
| 変更 | `src/ui/ActionBar.test.tsx` | ValidAction.min/maxをテストデータに追加、不要props削除 |
| 変更 | `src/ui/GameScreen.tsx` | ActionBarへの不要props削除 |
| 変更 | `src/ui/GameScreen.test.tsx` | ValidAction.min/maxをテストデータに追加 |
| 作成 | `src/domain/betting-validation.test.ts` | バリデーション・可否判定・min/max・ラウンド終了・回帰テスト計23テストケース |

## 確認コマンド
```bash
npx vitest run
npm run build
```