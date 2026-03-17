# 変更スコープ宣言

## タスク
ゲームコントローラー（gameFlow.ts）の公開関数 handlePlayerAction / advanceUntilHumanTurn に対するテスト作成

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/application/gameFlow.test.ts` |

## 推定規模
Medium

## 影響範囲
- `src/application/gameFlow.ts`（テスト対象、未実装）
- `src/domain/gameEngine.ts`（依存する Domain 層バレルエクスポート）
- `src/domain/cpuStrategy.ts`（gameFlow 内部で使用する `decideAction`）
- `src/domain/betting.ts`（`applyAction`, `isBettingRoundComplete`, `getValidActions`）
- `src/domain/handProgression.ts`（`advancePhase`, `startNextHand`, `isGameOver`）
- `src/domain/showdown.ts`（`evaluateShowdown`, `resolveUncontestedPot`）
- `src/domain/types.ts`（`GameState` に `gameOverReason?: string` 追加予定）

## テストカバレッジ

### handlePlayerAction（10テスト）
- 人間アクション適用: fold / call / bet
- CPU自動ターン処理（人間の番に戻るまで）
- CPU全員フォールド時の非争ポット解決
- ベッティングラウンド完了時のフェーズ遷移
- ハンド終了 → 次ハンド開始
- ゲーム終了判定（人間チップ0 / 全CPU脱落）と gameOverReason 設定
- チップ保存則（ゼロサム）
- CPU再レイズサイクルでの無限ループ防止

### advanceUntilHumanTurn（6テスト）
- 人間が現在プレイヤーの場合の即時リターン
- CPUターン消化
- ショーダウン到達時の評価・分配
- 全員all-in時のフェーズ自動スキップ
- 非争ポット解決（1人残り）
- setupNewGame直後のCPU自動進行

### 統合テスト（2テスト）
- setupNewGame → advanceUntilHumanTurn → handlePlayerAction の完全フロー＋チップ保存則
- 人間が毎回フォールドしてゲーム終了に至るシナリオ

## 決定事項
- useGameController（React フック）のテストは見送り（useState の薄いラッパーでロジックなし）
- インテグレーションテストを追加（3モジュール以上を横断するデータフローのため、ポリシー準拠）
- テストファイル配置は既存プロジェクトのコロケーションパターンに従い `src/application/gameFlow.test.ts`