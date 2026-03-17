## 作業結果
- `GameState`型に`gameOverReason?: string`フィールドを追加
- `src/application/gameFlow.ts`を新規作成し、`handlePlayerAction`と`advanceUntilHumanTurn`の2つの公開関数を実装
- `handlePlayerAction`: 人間のアクションを適用 → CPUターン自動処理 → フェーズ遷移 → ハンド解決 → ゲーム終了判定 → 次ハンド開始の一連の流れを処理
- `advanceUntilHumanTurn`: CPUターンを消化して人間の番まで進める
- テストファイルの修正（デッキ不足、humanIndex前提の誤り、フロー全体処理に伴うアサーション調整）
- 無限ループ防止: アクション可能なプレイヤーが1人以下の場合にショーダウンへスキップするガードを追加

## 変更内容
- 変更: `src/domain/types.ts` - `GameState`に`gameOverReason?: string`追加
- 作成: `src/application/gameFlow.ts` - ゲームコントローラー実装（約100行）
- 変更: `src/application/gameFlow.test.ts` - デッキ設定修正、アサーション調整（9箇所）

## ビルド結果
- TypeScript型チェック: エラーなし（`npx tsc --noEmit` 成功）

## テスト結果
- `npx vitest run` - 全14ファイル・232テストがパス
- `src/application/gameFlow.test.ts` - 19テスト全パス