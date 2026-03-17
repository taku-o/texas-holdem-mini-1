# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 10` — タスク10「結合・動作確認とテスト」の実装。

## 分析結果

### 目的
ゲーム開始〜1ハンド進行（プリフロップ〜ショーダウン）〜ポット配分〜次ハンド〜ゲーム終了までの一通りの動作を結合テスト・単体テストで検証する。

### スコープ

タスク10は3つのサブタスクで構成:
- **10.1**: 結合フロー検証（ゲーム開始→ハンド進行→ショーダウン→次ハンド→ゲーム終了）
- **10.2**: GameEngine・HandEvaluator・CPUStrategy の単体テスト追加
- **10.3***: E2E/UIテスト（任意）

#### 既存テストカバレッジ（21ファイル、約530テスト）

| 領域 | テストファイル | 状況 |
|------|-------------|------|
| 型・定数・デッキ・配布 | types, constants, deck, dealing | ✅ 完備 |
| ベッティング | `betting.test.ts` (14KB) | ✅ 完備 |
| フェーズ進行 | `handProgression.test.ts` | ✅ 完備 |
| 役判定 | `handEvaluator.test.ts` (16KB) | ✅ 全10カテゴリ+エッジケース |
| CPU戦略 | `cpuStrategy.test.ts` (24KB) | ✅ 完備 |
| ショーダウン | `showdown.test.ts` | ✅ 勝者判定+ポット分配+端数処理 |
| 結合（ドメイン層） | `gameEngine.integration.test.ts` | ✅ フルハンド+全フォールド+複数ハンド+チップ保存則 |
| ゲームフロー | `gameFlow.test.ts` (29KB) | ✅ handlePlayerAction+advanceUntilHumanTurn+統合テスト |
| コントローラ | `useGameController.test.ts` | ✅ 初期状態+startGame+handleAction+ゲーム終了+再開 |
| UIコンポーネント | 6ファイル | ✅ 完備 |

#### 未コミットの変更（+357行）
4つのテストファイルに追加テストが既に存在:
- `useGameController.test.ts`: ゲーム再開テスト2件
- `gameEngine.integration.test.ts`: 完全セッション+チップ保存則テスト3件
- `handProgression.test.ts`: チップ0プレイヤーのブラインドスキップ2件
- `showdown.test.ts`: ポット端数分配エッジケース3件

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| Playwright E2Eテスト追加（10.3*） | 不採用 | タスク指示書に「MVP後でも実施可能な場合は任意」と明記。既存UIコンポーネントテスト6ファイルで基本カバレッジ確保済み |
| 全テストファイルの書き直し | 不採用 | 既存テストは十分な品質。不足分の追加のみが適切 |
| 不足シナリオの追加テストのみ | 採用 | 既存の包括的テストスイートに対し、特定のギャップを埋める追加テストが最も効率的 |

### 実装アプローチ

既存テストスイートのギャップ分析に基づき、以下のテストを追加する。

#### 10.1: 結合フロー検証 — 追加テスト

**ファイル: `src/application/useGameController.test.ts`** (+約60行)

1. **複数ハンド混合アクション統合テスト**: startGame → 人間が call/fold を交互に実行 → 3ハンド以上進行 → 各ハンド間でチップ保存則・isHumanTurn・validActions の一貫性を検証
   - 不足根拠: 現在の「連続ハンド」テスト（464-484行目）は call 1回のみ。複数ハンドにわたる混合アクションの検証がない

2. **ショーダウン経由のポット配分検証**: handleAction で複数回 call し、ショーダウンまで到達 → pot === 0 かつ勝者チップ増加を検証
   - 不足根拠: 既存テストは `handlePlayerAction` の結果で pot=0 を明示検証していない

**ファイル: `src/domain/gameEngine.integration.test.ts`** (+約30行)

3. **ショーダウン後のポット完全消化検証**: フルハンドフロー完了後に `pot === 0` かつ `少なくとも1人の勝者のチップ > 初期値` を明示的に検証
   - 不足根拠: 既存フルハンドテスト（11-71行目）はチップ合計のゼロサムのみ検証。ポットが0に戻ることと勝者のチップ増加を個別に検証していない

#### 10.2: 単体テスト追加

**ファイル: `src/domain/handProgression.test.ts`** (+約20行)

4. **advancePhase エラーハンドリング**: `phase: 'idle'` および `phase: 'showdown'` で `advancePhase` を呼ぶと `Error` がスローされることを検証
   - 不足根拠: `handProgression.ts:30-31` で `throw new Error` しているがテスト未実施
   - ソースコード: `const nextPhase = NEXT_PHASE[state.phase]; if (!nextPhase) { throw new Error(...) }`

**ファイル: `src/domain/cpuStrategy.test.ts`** (+約30行)

5. **bet/raise アクションの amount 有効性検証**: CPUが bet/raise を返す場合、amount が BIG_BLIND 以上かつプレイヤーの chips 以下であることを検証
   - 不足根拠: 既存テストはアクション種別の選択ロジックを検証するが、amount の妥当性（ゲームルール準拠）を直接検証するテストがない

**ファイル: `src/domain/gameEngine.integration.test.ts`** (+約15行)

6. **GameEngine facade エクスポート検証**: `gameEngine.ts` から `setupNewGame`, `getValidActions`, `applyAction`, `isBettingRoundComplete`, `evaluateShowdown`, `determineWinners`, `resolveUncontestedPot`, `advancePhase`, `startNextHand`, `isGameOver`, `getActivePlayerCount` がエクスポートされていることを検証
   - 不足根拠: `gameEngine.ts` は再エクスポートファサード（1-18行目）だがテストなし

#### 10.3*: E2E/UIテスト — スキップ

タスク指示書の「MVP 後でも実施可能な場合は任意とする」に従い、本タスクスコープから除外。

## 実装ガイドライン

- **テストパターン**: 全テストで Given-When-Then コメント構造を使用する（既存パターン: `gameFlow.test.ts:54-71`）
- **テストヘルパー**: `src/domain/testHelpers.ts` の `card()`, `createTestPlayer()`, `createTestState()` を活用する
- **チップ保存則検証**: `players.reduce((sum, p) => sum + p.chips, 0) + pot === INITIAL_CHIPS * PLAYER_COUNT` パターンを使用する（既存パターン: `gameEngine.integration.test.ts:68-70`）
- **deterministic random**: `const fixedRandom = () => 0.5` を使用する（既存パターン: `gameFlow.test.ts:12`）
- **useController テスト**: `renderHook` + `act` パターンを使用する（既存パターン: `useGameController.test.ts:42-53`）
- **ループの安全弁**: while ループには必ず `maxIterations` ガードを設ける（既存パターン: `gameFlow.test.ts:858`）。統合テストのハンド繰り返しは `maxIterations = 500`
- **テストの独立性**: 各テストは独立して実行可能であること。テスト間で状態を共有しない
- **非決定的テスト禁止**: `Math.random()` を直接使わず、必ず `fixedRandom` を注入する

### 変更ファイルと影響範囲のまとめ

| ファイル | 変更種別 | 追加行数目安 | サブタスク |
|---------|---------|------------|----------|
| `src/application/useGameController.test.ts` | テスト追加 | +60行 | 10.1 |
| `src/domain/gameEngine.integration.test.ts` | テスト追加 | +45行 | 10.1, 10.2 |
| `src/domain/handProgression.test.ts` | テスト追加 | +20行 | 10.2 |
| `src/domain/cpuStrategy.test.ts` | テスト追加 | +30行 | 10.2 |

**プロダクションコードの変更: なし**（テストファイルのみ）

### 注意すべきアンチパターン

- **テストの実装依存**: 内部ステップを逐一追わず、入力と出力の振る舞いのみを検証する
- **過度に脆いテスト**: 特定の手札やチップ額に依存しすぎない。チップ保存則やフェーズ遷移の正しさなど、不変条件で検証する
- **テストの重複**: 既存テストと同じシナリオを書かない。既存テストが検証済みのパスは新テストで繰り返さない

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| 10.3* E2E/UIテスト（Playwright） | タスク指示書に「MVP後でも実施可能な場合は任意」と明記 |
| プロダクションコードの変更 | タスク10はテスト追加のみ。バグ発見時は別タスクとして対応 |
| パフォーマンステスト | タスク指示書に記載なし |

## 確認事項

なし。全ての不明点はコード調査で解決済み。