## 作業結果
- **GameScreen.test.tsx（新規作成）**: GameScreenコンポーネントの3つの表示モードを網羅する17件のテストを作成
  - 未開始時: ゲーム開始ボタン表示、onStartGameコールバック、タイトル表示、ゲーム中UIの非表示
  - ゲーム中: TableView（コミュニティカード・ポット）、PlayerSeats（5人表示・ディーラーマーカー）、ActionBar（人間ターン時のみ表示・onAction配線・playerChips配線）
  - ゲーム終了: 終了理由表示、「新しいゲームを始める」ボタン、onStartGameコールバック、ゲーム中UIの非表示
  - 境界値: 各フェーズでの表示モード切り替え、idle+gameOverReasonの組み合わせ判定
- **App.test.tsx（変更）**: 既存スモークテスト2件を維持しつつ、useGameController統合後のインテグレーションテスト3件を追加
  - ゲーム開始ボタンの初期表示、ボタンクリック後のゲーム画面表示（PlayerSeats確認）、ゲーム中のボタン非表示

## 変更内容
- `src/ui/GameScreen.test.tsx` — 新規作成（17テスト）
- `src/App.test.tsx` — 変更（2テスト → 5テスト）