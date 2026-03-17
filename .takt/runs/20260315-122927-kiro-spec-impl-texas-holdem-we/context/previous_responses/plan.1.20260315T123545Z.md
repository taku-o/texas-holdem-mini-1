Now I have a complete understanding of the codebase. Let me create the plan.

---

## 計画レポート

### タスク概要

タスク10「結合・動作確認とテスト」は3つのサブタスクで構成される:
- **10.1**: ゲーム開始〜1ハンドの進行〜ゲーム終了の統合テスト
- **10.2**: ゲームエンジン・役判定・CPU行動決定の単体テスト追加
- **10.3***: E2E/UIテスト（任意）

### 現状分析

既存テストは **338テスト（21ファイル）** が全てパス。テストカバレッジは既に高い水準にある。

#### 要件ごとの「変更要/不要」判定

**10.1 の要件 (統合テスト)**:

| 要件 | 判定 | 根拠 |
|------|------|------|
| 1.1-1.2 (参加者6, 人間1+CPU4) | 不要 | `gameSetup.test.ts:14-44` で5人・人間1人を検証済み |
| 1.3 (人間席ランダム) | 不要 | `gameSetup.test.ts:78-95` でランダム性を検証済み |
| 1.4 (ディーラー自動) | 不要 | `gameEngine.integration.test.ts:11-71` で自動進行を検証済み |
| 2.1 (初期チップ1000) | 不要 | `constants.test.ts:8-14`, `gameSetup.test.ts:42-54` で検証済み |
| 2.2 (チップ増減) | 不要 | 複数テストでチップ保存則を検証済み |
| 2.3 (チップ0除外) | 不要 | `handProgression.test.ts:305-339` で `isGameOver` を検証済み |
| 5.1-5.2 (ブラインド・カード配布) | 不要 | `dealing.test.ts` 全17テストで検証済み |
| 5.3 (ベッティングアクション) | 不要 | `betting.test.ts` 全24テストで検証済み |
| 5.4-5.5 (役判定) | 不要 | `handEvaluator.test.ts` 全23テストで10カテゴリ全て検証済み |
| 6.1-6.3 (人間操作UI) | 不要 | `ActionBar.test.tsx` 26テスト + `gameFlow.test.ts` 20テストで検証済み |
| 7.1-7.3 (CPU行動) | 不要 | `cpuStrategy.test.ts` 24テスト + `gameFlow.test.ts` CPUターン消化テスト |
| 8.1-8.3 (開始・終了・再開) | 不要 | `GameScreen.test.tsx` 20テスト + `gameFlow.test.ts` ゲーム終了テスト |

**10.1 統合テストで不足している観点**:

| ギャップ | 説明 | 対応 |
|---------|------|------|
| 人間勝利シナリオ | 既存は人間がフォールドしてゲーム終了のみ。人間が積極的にプレイして全CPUを倒すシナリオがない | **追加が必要** |
| 複数ハンド連続 + 多様なアクション | 既存統合テストは call/check のみ。bet/raise を含む複数ハンドの連続テストがない | **追加が必要** |
| ゲーム再開フロー | ゲーム終了後に `startGame()` で再開する統合テストがない | **追加が必要** |

**10.2 の要件 (単体テスト)**:

| 要件 | 判定 | 根拠 |
|------|------|------|
| 5.4-5.5 (役判定) | 不要 | `handEvaluator.test.ts:1-514` で全10役＋エッジケース検証済み |
| 7.1 (CPU行動決定) | 不要 | `cpuStrategy.test.ts:1-770` でプリフロップ〜リバーの決定ロジック検証済み |

**10.2 単体テストで不足している観点**:

| ギャップ | 説明 | 対応 |
|---------|------|------|
| ショーダウン3人以上タイ | 3人以上が同スコアでポット分割する場合の端数処理テストがない | **追加が必要** |
| チップ0プレイヤーのハンド除外 | `startNextHand` でチップ0プレイヤーがブラインドをスキップされるか明示的テストがない | **追加が必要** |

**10.3* の要件 (E2E/UIテスト)**:

| 要件 | 判定 | 根拠 |
|------|------|------|
| 4.2 (視覚表示) | 不要 | `TableView.test.tsx` 7テスト + `CardView.test.tsx` 9テストで検証済み |
| 6.1 (アクションUI) | 不要 | `ActionBar.test.tsx` 26テストで検証済み |
| 8.1 (ゲーム開始) | 不要 | `GameScreen.test.tsx:20テスト` + `App.test.tsx:5テスト` で検証済み |

10.3* は任意タスクかつ既存UIテストがクリティカルパスを十分にカバーしているため、**スキップする**。

---

### 実装方針

#### ファイル構成

| ファイル | 操作 | 内容 |
|---------|------|------|
| `src/domain/gameEngine.integration.test.ts` | **変更** | 10.1用の統合テストを追加 |
| `src/domain/showdown.test.ts` | **変更** | 10.2用のエッジケーステストを追加 |
| `src/domain/handProgression.test.ts` | **変更** | 10.2用のチップ0プレイヤー除外テストを追加 |
| `src/application/useGameController.test.ts` | **変更** | 10.1用のゲーム再開フローテストを追加 |

#### 追加テスト詳細

**1. `gameEngine.integration.test.ts` への追加（10.1）**

```
describe('完全なゲームセッション')
  - test: 人間がbet/raiseを含むアクションで複数ハンドをプレイし、チップ保存則が保たれる
  - test: 人間がコールし続けて全CPUのチップが0になりゲーム終了（人間勝利シナリオ）
  - test: 各フェーズ（preflop→flop→turn→river→showdown）でポットが正しく配分され次ハンドが開始される
```

参照パターン: `src/application/gameFlow.test.ts:811-881`（既存の統合テストパターンを参照。`setupNewGame` + `advanceUntilHumanTurn` + `handlePlayerAction` の組み合わせ）

**2. `showdown.test.ts` への追加（10.2）**

```
describe('evaluateShowdown 追加エッジケース')
  - test: 3人以上が同スコアでタイの場合、端数が最初の勝者に加算される
  - test: ポットが奇数で2人タイの場合、端数処理が正しい
```

参照パターン: `src/domain/showdown.test.ts:170-194`（既存のタイテストを拡張）

**3. `handProgression.test.ts` への追加（10.2）**

```
describe('startNextHand チップ0プレイヤーの扱い')
  - test: チップ0のプレイヤーがブラインド位置にいる場合、スキップされる
```

参照パターン: `src/domain/handProgression.test.ts:207-222`（既存のskip eliminatedテスト）

**4. `useGameController.test.ts` への追加（10.1）**

```
describe('ゲーム再開')
  - test: ゲーム終了後にstartGameを再度呼ぶと新しいゲームが開始される
```

参照パターン: `src/application/useGameController.test.ts` の既存 `renderHook` + `act` パターン

---

### Coder向け実装ガイドライン

1. **参照すべき既存実装パターン**:
   - 統合テストの書き方: `src/application/gameFlow.test.ts:811-881`（`setupNewGame` → `advanceUntilHumanTurn` → `handlePlayerAction` ループ）
   - テストヘルパー: `src/domain/testHelpers.ts`（`card()`, `createTestPlayer()`, `createTestState()`）
   - ショーダウンテスト: `src/domain/showdown.test.ts:170-194`（ポット分割パターン）
   - React Hook テスト: `src/application/useGameController.test.ts`（`renderHook`, `act` パターン）

2. **変更の影響範囲**:
   - テストファイルのみの変更。プロダクションコードへの変更は不要
   - 新規ファイルの作成は不要（既存テストファイルに追加）

3. **注意すべきアンチパターン**:
   - **テスト内の無限ループ**: `while` ループには必ず `maxIterations` ガードを設ける（`gameFlow.test.ts:821-843` の既存パターンに従う）
   - **非決定的テスト**: `randomFn` は必ず固定値（`() => 0.5` 等）を渡してテストを決定的にする
   - **チップ保存則の検証漏れ**: 統合テストでは必ず `players.reduce((sum, p) => sum + p.chips, 0) + pot === INITIAL_CHIPS * PLAYER_COUNT` を検証する
   - **テスト間の状態共有**: 各テストは独立した状態を作成する。テスト間で `GameState` を共有しない

4. **テストフレームワーク**: Vitest（`import { describe, expect, test } from 'vitest'`）

5. **ファイル行数の目安**:
   - `gameEngine.integration.test.ts`: 現在168行 → 追加後約280行（300行以内に収まる）
   - `showdown.test.ts`: 現在250行 → 追加後約300行（制限内）
   - `handProgression.test.ts`: 現在438行 → 追加後約480行（**300行超過のため注意**。ただしテストファイルであるため、テストケースを削除するのは不適切。現状維持で追加）
   - `useGameController.test.ts`: 追加後も制限内