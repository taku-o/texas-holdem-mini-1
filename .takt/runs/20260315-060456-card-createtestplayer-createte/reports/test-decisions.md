# 決定ログ

## 1. テスト対象を testHelpers.ts の公開関数4つに限定
- **背景**: testHelpers.ts は card, createSimpleDeck, createTestPlayer, createTestState の4関数をエクスポートする予定。全てユーティリティ的な関数で、テストファクトリとしての正しい振る舞いを検証する必要がある
- **検討した選択肢**: (a) 4関数全てをテスト (b) card と createSimpleDeck のみ（シンプルなため省略可能）
- **理由**: デフォルト値やoverridesの正しさが他のテストファイルの移行成否に直結するため、全関数を網羅的にテストする

## 2. インテグレーションテストは不要と判断
- **背景**: testHelpers.ts は domain の型のみに依存する純粋なファクトリ関数群。他のモジュールを横断するデータフローは存在しない
- **検討した選択肢**: (a) インテグレーションテスト作成 (b) ユニットテストのみ
- **理由**: 3つ以上のモジュールを横断するデータフローがなく、ユニットテストで十分にカバーできる

## 3. createTestPlayer のデフォルト holeCards をダミー手札付きに設定
- **背景**: 既存の5テストファイルで createTestPlayer のデフォルト holeCards が異なっていた（dealing.test.ts は空、他3ファイルは手札付き）
- **検討した選択肢**: (a) holeCards: [] をデフォルト (b) holeCards: [card('A', 'spades'), card('K', 'hearts')] をデフォルト
- **理由**: 4ファイル中3ファイルが手札付きをデフォルトとしており多数派。dealing.test.ts のみ holeCards: [] を overrides で明示的に渡せばよい

## 4. createTestState のデフォルト値を最もニュートラルなパターンに設定
- **背景**: 既存4テストファイルで createTestState のデフォルト値（pot, currentBet, deck 等）が異なっていた
- **検討した選択肢**: (a) dealing.test.ts パターン（pot:0, currentBet:0, deck:createSimpleDeck()） (b) betting.test.ts パターン（pot:15, currentBet:BIG_BLIND）
- **理由**: 計画レポートの方針に従い、最もシンプルでニュートラルな初期値（pot:0, currentBet:0, deck:createSimpleDeck()）を基本とし、各テストが文脈に合った値を overrides で明示する設計が最も明確