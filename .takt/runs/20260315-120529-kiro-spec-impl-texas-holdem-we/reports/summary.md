# タスク完了サマリー

## タスク
タスク9「ゲーム画面ルートと開始・終了・再開のUI」の実装。ゲーム未開始時の開始入口、ゲーム中のテーブル・席・アクションバー配置、ゲーム終了時の再開手段を提供するGameScreenコンポーネントを作成し、App.tsxと統合する。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 作成 | `src/ui/GameScreen.tsx` | ゲーム画面ルートコンポーネント — 未開始（ゲーム開始ボタン）・ゲーム中（TableView/PlayerSeats/ActionBar配置）・終了（終了理由表示+新しいゲームを始めるボタン）の3モード切替 |
| 作成 | `src/ui/GameScreen.test.tsx` | GameScreen単体テスト20件（未開始表示、ゲーム中の子コンポーネント配線、終了表示、モード切替境界値） |
| 変更 | `src/App.tsx` | useGameController統合、GameScreenへの全props配線（旧プレースホルダー削除） |
| 変更 | `src/App.test.tsx` | 統合テスト3件追加（開始ボタン表示、クリックでゲーム中遷移、ゲーム中は開始ボタン非表示） |

## 確認コマンド
```bash
npx vitest run
npm run build
```