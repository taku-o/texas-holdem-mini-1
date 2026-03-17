## 作業結果
- **GameScreen.tsx（新規作成）**: ゲーム画面ルートコンポーネントを実装。3つの表示モード（未開始・ゲーム中・ゲーム終了）を切り替える
  - 未開始時: タイトル「Texas Hold'em」と「ゲーム開始」ボタンを表示
  - ゲーム中: TableView、PlayerSeats、ActionBar（人間ターン時のみ）を表示。humanPlayerIdからプレイヤーを特定してchips等をActionBarに渡す
  - ゲーム終了: gameOverReasonと「新しいゲームを始める」ボタンを表示
- **App.tsx（変更）**: useGameControllerフックを統合し、GameScreenコンポーネントに全stateとコールバックを接続

## 変更内容
- `src/ui/GameScreen.tsx` — 新規作成（90行）
- `src/App.tsx` — 変更（useGameController統合、GameScreen使用）

## ビルド結果
- `npm run build` — 成功（型エラーなし）

## テスト結果
- `npm run test` — 全21ファイル、338テストがパス（GameScreen.test.tsx: 20テスト、App.test.tsx: 5テスト含む）