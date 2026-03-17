# 決定ログ

## 1. テストファイルの配置場所
- **背景**: 既存テストは `src/domain/` にソースファイルと同じディレクトリにコロケーション（`*.test.ts`）で配置されている。gameFlow は新規ディレクトリ `src/application/` に作成予定のため、テストの配置先を決める必要があった
- **検討した選択肢**: `src/application/gameFlow.test.ts`（コロケーション） / `src/__tests__/gameFlow.test.ts`（別ディレクトリ）
- **理由**: 既存プロジェクトのコロケーションパターンに統一。ソースとテストが同じディレクトリにあることで関連性が明確になる

## 2. useGameController のテスト作成を見送り
- **背景**: 計画では `useGameController.ts`（React フック）も実装対象だが、テスト対象としての優先度を判断する必要があった
- **検討した選択肢**: gameFlow + useGameController の両方をテスト / gameFlow のみをテスト
- **理由**: useGameController は useState による状態保持の薄いラッパー（30〜50行、ロジックなし）。ゲームフロー制御の全ロジックは gameFlow.ts の純粋関数に集約されるため、テスト価値はそちらに集中する。useGameController のテストには React Testing Library が必要で、テストの複雑度に対する効果が低い

## 3. インテグレーションテストの包含
- **背景**: gameFlow は gameEngine（betting, handProgression, showdown）と cpuStrategy を横断するデータフローを持ち、3モジュール以上をまたぐ
- **検討した選択肢**: ユニットテストのみ / ユニットテスト + インテグレーションテスト
- **理由**: テストポリシーに「3つ以上のモジュールを横断するデータフロー → インテグレーションテスト必須」と明記されている。setupNewGame → advanceUntilHumanTurn → handlePlayerAction の一連のフローを検証する統合テストを2件追加した

## 4. Domain層関数のモックを使用しない方針
- **背景**: gameFlow は Domain 層の多数の関数（applyAction, isBettingRoundComplete, advancePhase, decideAction 等）を内部で使用する。これらをモックするかどうかの判断が必要だった
- **検討した選択肢**: Domain 層関数をモックして gameFlow のロジックのみ検証 / Domain 層関数をそのまま使用して結合的に検証
- **理由**: gameFlow は Domain 層の純粋関数を組み合わせるオーケストレーション層であり、内部実装のモックはテストポリシーで REJECT 対象。代わりに `randomFn` の注入（`() => 0.5` 等の固定値）で決定的な結果を得るパターンを採用し、既存テスト（cpuStrategy.test.ts）と同じアプローチに統一した