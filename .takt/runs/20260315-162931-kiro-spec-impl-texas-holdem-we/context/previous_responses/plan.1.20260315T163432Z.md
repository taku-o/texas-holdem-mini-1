Now I have a comprehensive understanding of the codebase. Let me compile the implementation plan.

---

## 計画レポート

### タスク概要

**タスク 10: 結合・動作確認とテスト** — 3つのサブタスクで構成:
- **10.1**: ゲーム開始〜1ハンド進行〜ショーダウン〜次ハンド〜ゲーム終了の結合動作確認
- **10.2**: GameEngine・HandEvaluator・CPUStrategy の単体テスト追加
- **10.3***: E2E/UIテスト（任意）

### 現状分析

#### 既存テストカバレッジ（348テスト、21ファイル、全パス）

| 領域 | テストファイル | カバレッジ状況 |
|------|-------------|-------------|
| 型・定数 | `types.test.ts`, `constants.test.ts` | ✅ 完備 |
| デッキ | `deck.test.ts` | ✅ 完備 |
| カード配布 | `dealing.test.ts` | ✅ 完備 |
| ベッティング | `betting.test.ts` (14KB) | ✅ 完備 |
| フェーズ進行 | `handProgression.test.ts` | ✅ 完備 |
| 役判定 | `handEvaluator.test.ts` (16KB) | ✅ 全10カテゴリ + エッジケース |
| CPU戦略 | `cpuStrategy.test.ts` (24KB) | ✅ 完備 |
| ショーダウン | `showdown.test.ts` | ✅ 勝者判定 + ポット分配 + エッジケース |
| ゲームセットアップ | `gameSetup.test.ts` | ✅ 完備 |
| テストヘルパー | `testHelpers.test.ts` | ✅ 完備 |
| 結合（ドメイン層） | `gameEngine.integration.test.ts` | ✅ フルハンド + 全フォールド + 複数ハンド + チップ保存則 |
| ゲームフロー | `gameFlow.test.ts` (29KB) | ✅ handlePlayerAction + advanceUntilHumanTurn + 統合テスト |
| コントローラ | `useGameController.test.ts` | ✅ 初期状態 + startGame + handleAction + validActions + isHumanTurn + ゲーム終了 + 再開 |
| UIコンポーネント | 6ファイル (GameScreen, ActionBar, PlayerSeats, PlayerSeat, TableView, CardView) | ✅ 完備 |

#### 未コミットの変更（+357行）

4つのテストファイルに追加テストが既にある:
- `useGameController.test.ts`: ゲーム再開テスト2件
- `gameEngine.integration.test.ts`: 完全セッション + チップ保存則テスト3件
- `handProgression.test.ts`: チップ0プレイヤーのブラインドスキップ2件
- `showdown.test.ts`: ポット端数分配エッジケース3件

### 要件ごとの変更要/不要判定

#### 10.1: 結合・動作確認

**変更要** — 以下のシナリオテストが不足している:

1. **useGameControllerを通した複数ハンドの混合戦略テスト**: 現在のコントローラテストは「fold繰り返し→ゲーム終了」か「call 1回」のみ。人間が call → call → fold と**複数のアクション種別を交えて複数ハンドを進行**し、各ハンド間でディーラー回転・チップ保存則を検証するテストがない
   - 現行: `useGameController.test.ts:464-484` の「連続ハンド」テストは call 1回のみ
   - 必要: 複数ハンドにわたり混合アクションを実行して一通りの動作確認

2. **ゲーム開始→人間アクション→ショーダウン→ポット配分→次ハンドの一貫フロー**: `gameFlow.test.ts:811-849` の統合テストは存在するが、**ショーダウンでの実際の勝者判定とポット配分が正しいことの検証**が弱い（handlePlayerAction結果のpot=0確認がない）

3. **CPU全員脱落によるゲーム終了**: `gameFlow.test.ts:370-434` にCPU全員脱落テストはあるが、**useGameControllerを通した**テストは存在しない

#### 10.2: 単体テスト追加

**変更要（追加のみ）** — 既存の単体テストは十分だが、以下の追加が必要:

1. **GameEngine facade のエクスポート検証**: `gameEngine.ts` は再エクスポートのみのファサードだが、パブリックAPIの一覧テストがない。追加は軽微だが、リファクタリング時の安全ネットとして有用
   - 現行: `gameEngine.ts:1-18` — re-export のみ、テストなし

2. **handProgression の状態遷移網羅**: `advancePhase` の不正フェーズ入力（idle, showdown）のエラーハンドリングテストが不足
   - 現行: `handProgression.test.ts` にはフェーズ遷移の正常系テストはあるが、`idle` からの `advancePhase` 呼び出しエラーテストがない
   - `handProgression.ts:30-31` で `throw new Error` しているがテストされていない

3. **CPUStrategy の全アクション種別テスト**: 既存テストは十分だが、タスク要件（7.1）で「ベット・レイズ時はチップ数も返す」の検証として、返されたアクションの `amount` が有効範囲内かの検証を追加

#### 10.3*: E2E/UIテスト

**変更不要（任意）** — タスク指示書に「MVP 後でも実施可能な場合は任意とする」と記載あり。既存UIコンポーネントテスト6ファイルでクリティカルパスの基本カバレッジは確保されている。Playwright E2Eは本タスクスコープでは割愛する。

### 実装アプローチ

#### 変更対象ファイル

| ファイル | 変更内容 | 行数目安 |
|---------|---------|---------|
| `src/application/useGameController.test.ts` | 10.1: 複数ハンド混合戦略テスト、CPU全員脱落テスト追加 | +60行 |
| `src/domain/gameEngine.integration.test.ts` | 10.1: フルフロー検証（ショーダウンのポット配分確認強化）、10.2: facade エクスポート検証 | +50行 |
| `src/domain/handProgression.test.ts` | 10.2: advancePhaseのエラーハンドリングテスト追加 | +20行 |
| `src/domain/cpuStrategy.test.ts` | 10.2: bet/raiseアクションのamount有効性検証テスト追加 | +30行 |

#### 参照すべき既存実装パターン

1. **テスト構造**: 全テストが `describe` / `test` + Given-When-Then コメントパターンを使用（例: `gameFlow.test.ts:54-71`）
2. **テストヘルパー**: `src/domain/testHelpers.ts` の `card()`, `createTestPlayer()`, `createTestState()` を活用
3. **チップ保存則検証**: 全結合テストで `players.reduce((sum, p) => sum + p.chips, 0) + pot === INITIAL_CHIPS * PLAYER_COUNT` パターンを使用（例: `gameEngine.integration.test.ts:68-70`）
4. **fixedRandom**: `() => 0.5` をデフォルトのdeterministic random関数として使用（例: `gameFlow.test.ts:12`）
5. **useControllerテスト**: `renderHook` + `act` パターン（例: `useGameController.test.ts:42-53`）

#### 具体的なテストシナリオ

**10.1 テスト追加:**

1. **`useGameController.test.ts` — 複数ハンド混合アクション統合テスト**:
   - startGame → 人間call → 次の人間ターンでcall → ... → 3ハンド以上進行
   - 各ハンド間でチップ保存則を検証
   - isHumanTurn / validActions の一貫性を検証

2. **`useGameController.test.ts` — CPU全員脱落によるゲーム終了**:
   - 人間がcallを繰り返して有利にゲームを進め、CPU全員チップ0でゲーム終了
   - `gameOverReason` が 'All CPU players eliminated' を含むことを検証

3. **`gameEngine.integration.test.ts` — ショーダウン後のポット配分検証強化**:
   - ショーダウン完了後に `pot === 0` かつ勝者のチップが増加していることを明示的に検証

**10.2 テスト追加:**

4. **`handProgression.test.ts` — advancePhase エラーケース**:
   - `phase: 'idle'` で `advancePhase` を呼ぶとエラーがスローされることを検証
   - `phase: 'showdown'` で `advancePhase` を呼ぶとエラーがスローされることを検証

5. **`gameEngine.integration.test.ts` — facade エクスポート検証**:
   - `gameEngine.ts` から期待する全関数がエクスポートされていることを検証

6. **`cpuStrategy.test.ts` — bet/raise の amount 有効性**:
   - CPUがbet/raiseを選択した場合、amount がゲーム状態の最小ベット以上であることを検証

### 注意すべきアンチパターン

1. **テストの過度な実装依存**: テストは**振る舞い**を検証し、内部実装のステップを逐一追わない。`handlePlayerAction` の結果の状態のみを検証すること
2. **非決定的テスト**: 必ず `fixedRandom` を注入し、テスト結果が再現可能であることを保証する
3. **テストの相互依存**: 各テストは独立して実行可能であること。共有状態を使わない

### 確認事項

なし。全ての不明点はコード調査で解決済み。