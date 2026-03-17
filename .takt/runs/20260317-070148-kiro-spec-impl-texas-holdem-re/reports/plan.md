# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 12` — 結合・動作確認とテストの追加（タスク12）

## 分析結果

### 目的
タスク1〜11で実装した修正が正しく連携して動作することを結合テストで確認し、各モジュールの単体テストを補強して仕様準拠を検証する。

### スコープ

**サブタスク構成:**
- **12.1**: 結合動作確認テスト（Req 1,2,3,4,5,6）
- **12.2**: ドメイン層の単体テスト追加/更新（Req 1,2,3,4,5,6,7）
- **12.3***: UIテスト追加（Req 12,13）— 任意

**変更対象:** テストファイルのみ。プロダクションコードの変更なし。

### 既存テストカバレッジの調査結果

| 要件 | 既存テストファイル | 状況 |
|------|-------------------|------|
| Req 1 ベッティングバリデーション | `betting-validation.test.ts`(555行), `betting.test.ts`(459行) | 十分: amount検証・min/max・レイズ不可判定が網羅的 |
| Req 2 ラウンド終了判定 | `betting-validation.test.ts`(391-505行) | 十分: all-in aggressor 5ケース |
| Req 3 ブラインド・ショートスタック | `dealing.test.ts`(487行) | 十分: ショートスタックBB・脱落スキップ |
| Req 4 ショーダウン配分 | `showdown.test.ts`(493行) | 十分: chips>=0保証・オールイン配分 |
| Req 5 チップ0除外 | `handProgression.test.ts`(616行) | 十分: chips=0スキップ・ディーラー移動 |
| Req 6 CPUレイズ額 | `cpuStrategy.test.ts`(1094行) | 十分: レイズ額下限保証 |
| Req 7 ロイヤルフラッシュ | `handEvaluator.test.ts`(200行+) | 十分: ライブラリ非依存判定 |
| Req 12 クライアント側バリデーション | `ActionBar.test.tsx`(433-548行) | 十分: min/max範囲外無効化7件 |
| Req 13 アクセシビリティ | `ActionBar.test.tsx`(550-649行), `CardView.test.tsx` | 十分: aria-label 5件、カード裏面4件 |
| 結合テスト | `gameEngine.integration.test.ts`(330行), `gameFlow.async.test.ts`(356行) | **不足**: ショートスタック・オールイン・チップ0除外の結合シナリオなし |

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| 全テストを新規ファイルに集約 | 不採用 | 既存テストファイルの分割方針に反する |
| 既存テストファイルに追加 | 採用 | 既存のdescribe構造・ヘルパーを活用でき、一貫性を保てる |
| 12.3* UIテストの追加 | 不要 | `ActionBar.test.tsx`(バリデーション7件・アクセシビリティ5件)、`CardView.test.tsx`(裏面4件)で十分カバー済み |

### 実装アプローチ

#### 12.1: 結合テスト — `src/domain/gameEngine.integration.test.ts` に追加

新しいdescribeブロック「ショートスタック・オールイン・チップ0除外の結合シナリオ」を追加。

**テストシナリオ1: ショートスタックBBポスト → オールイン → チップ0除外 → 次ハンド**
1. `createTestState` でプレイヤー1名をショートスタック（BB未満のチップ）に設定
2. `postBlinds` → `currentBet` が実際のBB額であることを確認
3. ハンド進行 → ショーダウン → `evaluateShowdown`
4. チップ0プレイヤー発生 → `startNextHand`
5. 次ハンドでチップ0プレイヤーがスキップされることを確認（ディーラー・ブラインド）
6. 全工程で `calcTotalChips` が一定

**テストシナリオ2: 複数オールイン → ポット配分 → チップ保存則**
1. 2名以上がオールインする状態を構築
2. ショーダウン → ポット配分
3. `calcTotalChips` 一定、全プレイヤー `chips >= 0`

**テストシナリオ3: 人間アクション（bet/raise）→ CPU応答 → ショーダウンまで**
1. 人間がbet/raise → CPU側がcall/fold
2. フェーズ進行 → ショーダウン
3. チップ保存則

#### 12.2: 単体テスト補強

**`src/domain/betting-validation.test.ts` または `betting.test.ts` に追加:**
- オールイン正常系: `applyAction(state, idx, { type: 'bet', amount: player.chips })` が成功する
- オールインレイズ正常系: `applyAction(state, idx, { type: 'raise', amount: currentBetInRound + player.chips })` が成功する

**`src/domain/handProgression.test.ts` に追加:**
- dealing連携テスト: チップ0除外後の `startNextHand` → `preparePreflopRound` で `postBlinds` が正しく動作する（chips=0プレイヤーがSB/BBに割り当てられない）

**`src/domain/cpuStrategy.test.ts` に追加:**
- `decideAction` が返すamountが `getValidActions` のbet/raiseのmin/max範囲内であることの検証

## 実装ガイドライン

### 参照すべき既存実装パターン

1. **結合テストの構築パターン**: `src/domain/gameEngine.integration.test.ts:28-128` — `setupNewGame → executeAllCallCheck → advancePhase → evaluateShowdown` のフローと `calcTotalChips` でのチップ保存則検証
2. **テスト状態の構築**: `src/domain/testHelpers.ts:55-71` — `createTestState` の使い方。chips, folded, currentBetInRound を個別指定
3. **ショートスタック状態の作成**: `src/domain/dealing.test.ts` — postBlindsのショートスタック系テスト
4. **チップ0除外テスト**: `src/domain/handProgression.test.ts` — startNextHandでchips=0プレイヤーがスキップされるテスト
5. **CPUテストパターン**: `src/domain/cpuStrategy.test.ts` — decideActionの呼び出しとamount検証（固定randomFn使用）
6. **テストヘルパー**: `src/domain/testHelpers.ts` — `card()`, `createTestPlayer()`, `createTestState()`, `executeAllCallCheck()`, `executeAllCheck()`, `calcTotalChips()`
7. **gameFlow テストヘルパー**: `src/application/gameFlow.testHelpers.ts` — `fixedRandom`, `createGameState`, `createHumanTurnState`

### 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/domain/gameEngine.integration.test.ts` | ショートスタック・オールイン・チップ0除外の結合テストシナリオ3件追加 |
| `src/domain/betting-validation.test.ts` | オールイン正常系テスト2件追加 |
| `src/domain/handProgression.test.ts` | dealing連携テスト1件追加 |
| `src/domain/cpuStrategy.test.ts` | getValidActionsのmin/max範囲内選択テスト1件追加 |

### 注意すべきアンチパターン

- **マジックナンバー禁止**: チップ額は `INITIAL_CHIPS`, `BIG_BLIND`, `SMALL_BLIND` を使用。ハードコードしない
- **固定乱数の使用**: テストの再現性のため `() => 0.5` を使用（既存パターンに従う）
- **1テスト1検証**: 結合テストでも各テストは明確に1つのシナリオを検証する
- **既存テストとの重複回避**: 既に十分なカバレッジがある箇所（12.3* UIテスト含む）を再テストしない
- **import**: 必要な関数は `./gameEngine`（facade）経由ではなく、テスト対象モジュールから直接importする（既存パターンに従う）

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| 12.3* UIテスト追加 | `ActionBar.test.tsx`にバリデーション7件・アクセシビリティ5件、`CardView.test.tsx`にカード裏面4件が既存。要件12,13のUIテスト要件を十分カバー済み |
| プロダクションコードの変更 | タスク12はテスト追加のみ。ロジック変更はタスク1〜11で完了済み |