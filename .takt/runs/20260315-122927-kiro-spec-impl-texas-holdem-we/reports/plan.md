# タスク計画

## 元の要求
/kiro:spec-impl texas-holdem-webapp 10

タスク10「結合・動作確認とテスト」の実装。サブタスクは以下の3つ:
- 10.1: ゲーム開始〜1ハンド進行〜ゲーム終了の統合動作確認テスト
- 10.2: ゲームエンジン・役判定・CPU行動決定の単体テスト追加
- 10.3*: E2E/UIテスト（任意）

## 分析結果

### 目的
ゲーム全体が仕様どおりに動作することを、統合テスト・単体テストで検証する。既存338テスト（21ファイル）に対して不足している観点を補完する。

### スコープ
テストファイルのみの変更。プロダクションコードへの変更は不要。

#### 要件ごとの変更要/不要判定

**10.1 統合テスト — 既に検証済みの要件（変更不要）**:

| 要件 | 根拠（ファイル:行） |
|------|---------------------|
| 1.1-1.2 (参加者構成) | `gameSetup.test.ts:14-44` で5人・人間1人を検証済み |
| 1.3 (人間席ランダム) | `gameSetup.test.ts:78-95` でランダム性を検証済み |
| 1.4 (ディーラー自動) | `gameEngine.integration.test.ts:11-71` で自動進行を検証済み |
| 2.1 (初期チップ1000) | `constants.test.ts:8-14` + `gameSetup.test.ts:42-54` |
| 2.2 (チップ増減) | 複数テストでチップ保存則を検証済み |
| 2.3 (チップ0除外) | `handProgression.test.ts:305-339` で `isGameOver` を検証済み |
| 5.1-5.2 (ブラインド・カード配布) | `dealing.test.ts` 全17テスト |
| 5.3 (ベッティングアクション) | `betting.test.ts` 全24テスト |
| 5.4-5.5 (役判定) | `handEvaluator.test.ts` 全23テスト（10カテゴリ全て） |
| 6.1-6.3 (人間操作UI) | `ActionBar.test.tsx` 26テスト + `gameFlow.test.ts` 20テスト |
| 7.1-7.3 (CPU行動) | `cpuStrategy.test.ts` 24テスト + `gameFlow.test.ts` CPUターン消化テスト |
| 8.1-8.3 (開始・終了・再開) | `GameScreen.test.tsx` 20テスト + `gameFlow.test.ts` ゲーム終了テスト |

**10.1 統合テスト — 不足している観点（追加が必要）**:

| ギャップ | 説明 |
|---------|------|
| 人間勝利シナリオ | 既存は人間がフォールドしてゲーム終了のみ。人間がbet/raiseで勝ち続けてCPU全員チップ0になるシナリオがない |
| 複数ハンド＋多様なアクション | 既存統合テストはcall/foldのみ。bet/raiseを含む複数ハンドの連続テストがない |
| ゲーム再開フロー | ゲーム終了後に`startGame()`で再開する統合テストがない |

**10.2 単体テスト — 既に検証済みの要件（変更不要）**:

| 要件 | 根拠 |
|------|------|
| 5.4-5.5 (役判定) | `handEvaluator.test.ts:1-514` で全10役＋エッジケース検証済み |
| 7.1 (CPU行動決定) | `cpuStrategy.test.ts:1-770` でプリフロップ〜リバーの決定ロジック検証済み |

**10.2 単体テスト — 不足している観点（追加が必要）**:

| ギャップ | 説明 |
|---------|------|
| ショーダウン3人以上タイ | 3人以上が同スコアでポット分割する場合の端数処理テストがない |
| チップ0プレイヤーのブラインドスキップ | `startNextHand`でチップ0プレイヤーがブラインド位置にいる場合の明示的テストがない |

### 実装アプローチ

既存テストファイル4つに追加する。新規ファイルは作らない。

| ファイル | 操作 | 追加内容 |
|---------|------|---------|
| `src/domain/gameEngine.integration.test.ts` | 変更 | 10.1: 人間勝利シナリオ、bet/raise含む複数ハンド統合テスト |
| `src/domain/showdown.test.ts` | 変更 | 10.2: 3人以上タイのポット端数処理テスト |
| `src/domain/handProgression.test.ts` | 変更 | 10.2: チップ0プレイヤーがブラインド位置にいる場合のテスト |
| `src/application/useGameController.test.ts` | 変更 | 10.1: ゲーム終了後の再開フローテスト |

## 実装ガイドライン

### 参照すべき既存実装パターン

- **統合テストの書き方**: `src/application/gameFlow.test.ts:811-881` — `setupNewGame` → `advanceUntilHumanTurn` → `handlePlayerAction` ループパターン
- **テストヘルパー**: `src/domain/testHelpers.ts` — `card()`, `createTestPlayer()`, `createTestState()`
- **ショーダウンテスト**: `src/domain/showdown.test.ts:170-194` — ポット分割テストパターン
- **React Hookテスト**: `src/application/useGameController.test.ts` — `renderHook`, `act` パターン

### 追加テスト詳細

**1. `gameEngine.integration.test.ts` への追加**

```
describe('完全なゲームセッション: 人間勝利シナリオ')
  - test: 人間がbet/raiseを含むアクションで複数ハンドをプレイし、チップ保存則が保たれる
  - test: CPU全員のチップが0になったらゲーム終了（phase='idle', gameOverReason定義済み）
  - test: 各フェーズ(preflop→flop→turn→river→showdown)でポット配分され次ハンドが開始される
```

**2. `showdown.test.ts` への追加**

```
describe('evaluateShowdown 追加エッジケース')
  - test: 3人が同スコアでタイの場合、potをfloor(pot/3)ずつ配分し端数は最初の勝者に加算される
  - test: ポットが奇数(例:101)で2人タイの場合、50+51に正しく分割される
```

**3. `handProgression.test.ts` への追加**

```
describe('startNextHand チップ0プレイヤーの扱い')
  - test: SB位置のプレイヤーがチップ0の場合、次のチップ保有プレイヤーがSBを担当する
```

**4. `useGameController.test.ts` への追加**

```
describe('ゲーム再開')
  - test: ゲーム終了後にstartGameを再度呼ぶと新しいゲーム状態が設定される
```

### 注意すべきアンチパターン

- **テスト内の無限ループ**: `while`ループには必ず `maxIterations` ガードを設ける（`gameFlow.test.ts:821-843`の既存パターンに従う）
- **非決定的テスト**: `randomFn`は必ず固定値（`() => 0.5`等）を渡してテストを決定的にする
- **チップ保存則の検証漏れ**: 統合テストでは必ず `players.reduce((sum, p) => sum + p.chips, 0) + pot === INITIAL_CHIPS * PLAYER_COUNT` を検証する
- **テスト間の状態共有**: 各テストは独立した状態を作成する。テスト間で`GameState`を共有しない

### ファイル行数の見込み

| ファイル | 現在 | 追加後見込み | 備考 |
|---------|------|------------|------|
| `gameEngine.integration.test.ts` | ~168行 | ~280行 | 300行以内 |
| `showdown.test.ts` | ~250行 | ~300行 | 制限内 |
| `handProgression.test.ts` | ~438行 | ~480行 | テストファイルのため許容 |
| `useGameController.test.ts` | ~200行 | ~230行 | 制限内 |

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| 10.3* E2E/UIテスト | 任意タスク。既存UIテスト（`GameScreen.test.tsx` 20テスト、`ActionBar.test.tsx` 26テスト、`TableView.test.tsx` 7テスト等）がクリティカルパスを十分にカバーしている |
| プロダクションコードの変更 | テストで不具合が見つかった場合のみ対応。現時点では不要と判断 |