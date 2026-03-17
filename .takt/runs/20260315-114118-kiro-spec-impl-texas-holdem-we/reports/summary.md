# タスク完了サマリー

## タスク
タスク8「人間用アクションバーの実装」— Fold/Check/Call/Bet/Raiseの5アクションボタン表示、Bet/Raise時のチップ数入力UI（スライダー・数値入力・All-inクイックベット）、validActionsに基づくボタンの有効/無効制御を持つActionBarコンポーネントを実装する。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 作成 | `src/ui/ActionBar.tsx` | ActionBarコンポーネント（5アクションボタン + ChipInput内部コンポーネント + getMinBet/getMinRaise共通関数） |
| 作成 | `src/ui/ActionBar.test.tsx` | ActionBarのテスト（26テスト: 8.1/8.2/8.3の全要件カバー + DRY違反再発防止テスト2件） |
| 作成 | `src/test-setup.ts` | @testing-library/jest-dom/vitestのセットアップ |
| 変更 | `package.json` | @testing-library/jest-dom 依存追加 |
| 変更 | `vite.config.ts` | test.setupFiles に src/test-setup.ts を追加 |

## 確認コマンド
```bash
npm test
npm run build
```