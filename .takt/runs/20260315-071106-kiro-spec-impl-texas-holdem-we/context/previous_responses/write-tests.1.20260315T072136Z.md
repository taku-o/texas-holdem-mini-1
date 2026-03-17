## 作業結果

計画レポートに基づき、`gameFlow.ts` の2つの公開関数（`handlePlayerAction`、`advanceUntilHumanTurn`）に対するテストを作成しました。

テストは以下の観点を網羅しています：

**`handlePlayerAction`:**
- 人間のアクション適用（fold / call / bet）
- CPU自動ターン処理（人間の番に戻るまでの自動進行）
- CPUターン中に全員フォールドした場合の非争ポット解決
- ベッティングラウンド完了時のフェーズ遷移
- ハンド終了 → 次ハンド開始 / ゲーム終了判定
- `gameOverReason` の設定（人間チップ0 / 全CPU脱落）
- チップ保存則（ゼロサム検証）
- CPU再レイズサイクルでの無限ループ防止

**`advanceUntilHumanTurn`:**
- 人間が最初のプレイヤーの場合の即時リターン
- CPUターン消化
- ショーダウン処理
- 全員all-in時のフェーズスキップ
- 非争ポット解決（1人残り）
- ゲーム開始直後のCPU自動進行

**統合テスト:**
- setupNewGame → advanceUntilHumanTurn → handlePlayerAction の完全なフロー
- 人間が毎回フォールドしてゲーム終了に至るシナリオ

## 変更内容
- 作成: `src/application/gameFlow.test.ts`（テストファイル、約400行）