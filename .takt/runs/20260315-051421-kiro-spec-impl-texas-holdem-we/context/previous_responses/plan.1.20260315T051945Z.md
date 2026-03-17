Steeringも確認できました。全体像を把握した上で、計画をまとめます。

---

## 計画レポート

### タスク概要

**タスク4**: ゲームエンジンの中核ロジック（サブタスク 4.1〜4.7）

テキサスホールデムのゲーム進行を司るドメインロジックを実装する。ゲーム開始、ブラインド、カード配布、ベッティング、ショーダウン、ディーラーボタン移動、ゲーム終了条件を含む。

### 要件の変更要/不要判定

| 要件 | 対応サブタスク | 判定 | 根拠 |
|------|------------|------|------|
| 1.3 人間席ランダム決定 | 4.1 | **変更要** | GameEngine未実装 |
| 2.1 初期チップ1000 | 4.1 | **変更要** | 定数は定義済み（constants.ts:1）だが、セットアップロジック未実装 |
| 5.1 ブラインドポスト | 4.2 | **変更要** | SB/BB定数は定義済み（constants.ts:7-9）だが、適用ロジック未実装 |
| 5.2 ホールカード配布・フェーズ進行 | 4.2 | **変更要** | 未実装 |
| 5.3 ベッティングラウンド | 4.3 | **変更要** | 未実装 |
| 5.4 ショーダウン・勝者判定 | 4.4 | **変更要** | HandEvaluator（handEvaluator.ts）は実装済みだが、勝者判定・配分ロジック未実装 |
| 2.2 チップ増減 | 4.4 | **変更要** | 型はある（types.ts:25 `chips`）が増減ロジック未実装 |
| 2.3 チップ0除外 | 4.4 | **変更要** | 未実装 |
| 8.2 ディーラーボタン移動 | 4.5 | **変更要** | 未実装 |
| 8.3 ゲーム終了条件 | 4.6 | **変更要** | 未実装 |
| 1.4 ディーラー業務一連 | 4.7 | **変更要** | 未実装 |

### 型の追加（types.ts）

現在の `GameState` にベッティングラウンドの完了追跡用フィールドが不足している。

**追加フィールド:**

```typescript
// GameState に追加
lastAggressorIndex: number | null  // 最後にbet/raiseしたプレイヤーのindex（ラウンド完了判定用）
```

テキサスホールデムでは、最後にbet/raiseしたプレイヤーの手番に戻ったらラウンド終了となる。このフィールドがないと完了判定ができない。

### ファイル構成

ナレッジの制約（1ファイル200行超で分割検討、300行超でREJECT、1ファイル1責務）に従い、GameEngineを責務ごとに分割する。`gameEngine.ts` をファサードとし、操作の一覧性を確保する。

```
src/domain/
├── types.ts              (既存 - lastAggressorIndex 追加)
├── constants.ts          (既存 - 変更なし)
├── handEvaluator.ts      (既存 - 変更なし)
├── deck.ts               (新規 ~40行) デッキ生成・シャッフル
├── gameSetup.ts          (新規 ~60行) 4.1 ゲーム初期化
├── dealing.ts            (新規 ~80行) 4.2 ブラインド・カード配布
├── betting.ts            (新規 ~150行) 4.3 ベッティングラウンド
├── showdown.ts           (新規 ~100行) 4.4 ショーダウン・ポット配分
├── handProgression.ts    (新規 ~120行) 4.5, 4.6, 4.7 ハンド進行・終了判定
└── gameEngine.ts         (新規 ~50行) パブリックAPIファサード
```

### 各ファイルの設計

#### 1. `deck.ts` — デッキ操作（~40行）

**責務:** 52枚のデッキ生成とシャッフル

```typescript
createDeck(): Card[]
// 全Suit×全Rankの52枚のカード配列を返す

shuffleDeck(deck: Card[], randomFn?: () => number): Card[]
// Fisher-Yatesアルゴリズムでシャッフル
// randomFn注入でテスト時に再現可能にする（design.md記載の設計方針）
```

#### 2. `gameSetup.ts` — ゲーム初期化（~60行）【4.1】

**責務:** 新規ゲーム状態の生成

```typescript
setupNewGame(randomFn?: () => number): GameState
// - PLAYER_COUNT(5)人のプレイヤーを生成（1人human, 4人CPU）
// - 人間の席をランダムに決定（要件1.3）
// - 全員にINITIAL_CHIPS(1000)を付与（要件2.1）
// - ディーラーindexをランダムに決定
// - デッキ生成・シャッフル
// - phase: 'preflop' でブラインド・配布済みの状態を返す
//   → dealing.tsのpostBlinds, dealHoleCardsを内部で呼ぶ
```

**参照パターン:** constants.ts の `PLAYER_COUNT`, `INITIAL_CHIPS`, `CPU_COUNT`

#### 3. `dealing.ts` — カード配布・ブラインド（~80行）【4.2】

**責務:** ブラインドのポスト、ホールカード・コミュニティカードの配布

```typescript
postBlinds(state: GameState): GameState
// ディーラー左隣をSB、その左をBBとしてチップをポットに移動
// SB=5, BB=10（constants.ts）
// currentBetをBIG_BLINDに設定

dealHoleCards(state: GameState): GameState
// 各プレイヤーに2枚ずつデッキからカードを配る

dealCommunityCards(state: GameState, count: number): GameState
// フロップ(3枚)、ターン(1枚)、リバー(1枚)用
```

**注意点:**
- ブラインドポスト時、チップがSB/BB未満のプレイヤーはオールイン扱い
- ディーラー左隣の計算は、除外済みプレイヤーをスキップする必要あり

#### 4. `betting.ts` — ベッティングラウンド（~150行）【4.3】

**責務:** アクションの検証・適用・ラウンド完了判定

```typescript
getValidActions(state: GameState, playerIndex: number): PlayerAction[]
// 現在の状態から、そのプレイヤーが選択可能なアクションを返す
// - currentBet === player.currentBetInRound → check可能
// - currentBet > player.currentBetInRound → call/raise可能
// - フォールドは常に可能
// - bet: currentBet === 0のとき
// - raise: currentBet > 0のとき

applyAction(state: GameState, playerIndex: number, action: PlayerAction): GameState
// アクション検証後、状態を更新
// fold: player.folded = true
// check: 何もしない、次のプレイヤーへ
// call: currentBetとの差額をポットに
// bet/raise: 指定額をポットに、currentBet更新、lastAggressorIndex更新

isBettingRoundComplete(state: GameState): boolean
// 全非フォールド非オールインプレイヤーのベット額が一致し、
// lastAggressorIndexに戻った（またはaggressor無しで全員acted）

getNextActivePlayerIndex(state: GameState, fromIndex: number): number
// 次のフォールドしていない・オールインでないプレイヤーを返す
```

**アンチパターン注意:**
- 状態のミュータブル変更禁止（ナレッジ記載）。全操作でスプレッド構文による新オブジェクト返却
- オールイン: チップが足りない場合のcall/raiseはオールインになる。ポットは単一（サイドポットなし、Non-Goals記載）

#### 5. `showdown.ts` — ショーダウン・ポット配分（~100行）【4.4】

**責務:** 役判定による勝者決定とポット配分、プレイヤー除外

```typescript
evaluateShowdown(state: GameState): GameState
// 1. フォールドしていないプレイヤーの手札+コミュニティカードでhandEvaluator.evaluate()
// 2. scoreが最小のプレイヤーが勝者（handEvaluator.tsのscoreは低いほど強い）
// 3. 同スコアの場合はポットを均等分配
// 4. ポットを勝者に配分
// 5. チップ0のプレイヤーを除外対象にする
// 6. phase を次の状態へ

determineWinners(players: Player[], communityCards: Card[]): number[]
// フォールドしていないプレイヤーの中から勝者のindexを返す

resolveUncontestedPot(state: GameState): GameState
// 1人以外全員フォールドした場合、残った1人にポットを配分
```

**参照:** handEvaluator.ts:45-57（evaluate関数、scoreは低いほど強い）

#### 6. `handProgression.ts` — ハンド進行制御（~120行）【4.5, 4.6, 4.7】

**責務:** フェーズ遷移、ディーラーボタン移動、ゲーム終了判定

```typescript
advancePhase(state: GameState): GameState
// preflop → flop（3枚配布）→ turn（1枚配布）→ river（1枚配布）→ showdown
// 各遷移時にベッティングラウンドをリセット（currentBet=0, 各player.currentBetInRound=0）
// currentPlayerIndexをディーラー左隣（ポストフロップ以降の開始位置）に設定

startNextHand(state: GameState): GameState
// 1. ディーラーボタンを次のアクティブプレイヤーに移動（4.5）
// 2. デッキ再生成・シャッフル
// 3. 全プレイヤーのholeCards, folded, currentBetInRoundをリセット
// 4. communityCards, pot, currentBetをリセット
// 5. ブラインドポスト・ホールカード配布
// 6. phase: 'preflop'

isGameOver(state: GameState): { over: boolean; reason?: string }
// 以下のいずれかでtrue:
// - 人間プレイヤーのチップが0（要件8.3-1）
// - CPU全員のチップが0（要件8.3-3）
// ※「ユーザーが終了を選択」はUI側の責務（4.6スコープ外）

getActivePlayerCount(state: GameState): number
// チップ > 0 のプレイヤー数
```

#### 7. `gameEngine.ts` — パブリックAPIファサード（~50行）

**責務:** GameEngineの全操作を1モジュールから公開する（操作の一覧性確保）

```typescript
// ゲーム初期化
export { setupNewGame } from './gameSetup'

// ベッティング
export { applyAction, getValidActions, isBettingRoundComplete } from './betting'

// フェーズ進行
export { advancePhase, startNextHand, isGameOver } from './handProgression'

// ショーダウン
export { evaluateShowdown, resolveUncontestedPot } from './showdown'
```

外部（GameController等）はこのファサード経由でのみGameEngineにアクセスする。内部モジュール（deck.ts, dealing.ts等）は直接公開しない。

### 実装アプローチ

1. **イミュータブル更新**: 全関数は新しいGameStateオブジェクトを返す。引数のstateを変更しない（ナレッジの状態直接変更禁止に準拠）
2. **純粋関数**: 乱数は `randomFn` パラメータで注入し、テスト時に再現可能にする（design.md記載）
3. **単一ポット**: サイドポットは扱わない（design.md Non-Goals）。オールインプレイヤーがいても1つのポットで処理
4. **エラーハンドリング**: 無効なアクションは例外をスローする（design.md: "無効なアクション → 状態は変更しない"）

### 注意すべきアンチパターン

| パターン | 対策 |
|---------|------|
| 配列/オブジェクトの直接変更 | スプレッド構文・map/filterで新オブジェクト返却 |
| God Module | 責務ごとに6ファイルに分割 |
| マジックナンバー | constants.tsの定数を使用 |
| TODOコメント | 書かない。今やるか、やらないか |
| 過度な汎用化 | 必要な機能のみ実装。将来拡張不要 |

### 配線の影響範囲

- **types.ts**: `GameState` に `lastAggressorIndex: number | null` を追加 → 既存テスト(types.test.ts)でGameState生成箇所の更新が必要
- **handEvaluator.ts**: 変更なし。showdown.tsから `evaluate` を呼び出すのみ
- **constants.ts**: 変更なし。gameSetup.ts, dealing.ts から参照
- **既存テスト**: types.test.ts のGameState生成箇所に `lastAggressorIndex` の追加が必要

### Coder向け実装ガイドライン

1. **参照すべき既存パターン:**
   - handEvaluator.ts:45-57 — 純粋関数の設計パターン。引数→戻り値のみ
   - types.ts:47-57 — GameState型定義。ここに`lastAggressorIndex`を追加
   - constants.ts:1-9 — INITIAL_CHIPS, PLAYER_COUNT, SMALL_BLIND, BIG_BLIND

2. **プレイヤーindex計算のエッジケース:**
   - ディーラー左隣の計算で、チップ0のプレイヤー（除外済み）をスキップする
   - 2人以下になった場合のヘッズアップルール（SB=ディーラー）は初版では非対応でよい（要件に明記なし）

3. **ベッティングラウンド完了判定のロジック:**
   - lastAggressorIndex === null（誰もbet/raiseしていない）: 全員がcheck/foldしたら終了
   - lastAggressorIndex !== null: 手番が lastAggressorIndex に戻ったら終了
   - 全員フォールド（残り1人）: 即座にポット配分→次のハンド

4. **テスト戦略:**
   - 各ファイルごとに `*.test.ts` を作成
   - `randomFn` を固定値で注入し、決定論的テスト
   - エッジケース: オールイン、全員フォールド、2人残り、同スコア引き分け