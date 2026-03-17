# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 4` — タスク4「ゲームエンジンの中核ロジック」（サブタスク4.1〜4.7）の実装

## 分析結果

### 目的
テキサスホールデムのゲーム進行を司るドメインロジックを実装する。ゲーム開始（席決め・チップ付与）、ブラインド・カード配布、ベッティングラウンド、ショーダウン・ポット配分、ディーラーボタン移動、ゲーム終了条件判定、およびこれらを組み合わせた一連のディーラー業務フローを含む。

### スコープ

**変更対象ファイル:**

| ファイル | 変更内容 | 根拠 |
|---------|---------|------|
| `src/domain/types.ts` | GameStateに`lastAggressorIndex: number \| null`追加 | ベッティングラウンド完了判定に必要 |
| `src/domain/deck.ts` | **新規** デッキ生成・シャッフル | 4.1, 4.2 |
| `src/domain/gameSetup.ts` | **新規** ゲーム初期化 | 4.1 |
| `src/domain/dealing.ts` | **新規** ブラインド・カード配布 | 4.2 |
| `src/domain/betting.ts` | **新規** ベッティングラウンド | 4.3 |
| `src/domain/showdown.ts` | **新規** ショーダウン・ポット配分 | 4.4 |
| `src/domain/handProgression.ts` | **新規** ハンド進行・終了判定 | 4.5, 4.6, 4.7 |
| `src/domain/gameEngine.ts` | **新規** パブリックAPIファサード | 4.7（操作一覧性の確保） |

**変更しないファイル:**
- `src/domain/constants.ts` — SB/BB/INITIAL_CHIPS等は定義済み（constants.ts:1-9）
- `src/domain/handEvaluator.ts` — showdown.tsからimportして使用するのみ
- `src/App.tsx`, `src/main.tsx` — UI層はタスク7-9のスコープ

**既存テストへの影響:**
- `src/domain/types.test.ts` — GameState生成箇所に`lastAggressorIndex`フィールドの追加が必要

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| GameEngine全体を1ファイルに実装 | ❌ | 推定500行超でナレッジの300行制限に違反。複数責務が同居する |
| 責務ごとに分割＋ファサード | ✅ | 各ファイル40〜150行。1ファイル1責務。ファサードで操作の一覧性を確保 |
| GameEngineをクラスで実装 | ❌ | design.mdが「純粋関数またはイミュータブルな状態更新」と明記。クラスは不要 |
| ベッティング完了判定にactedフラグ配列を使用 | ❌ | Player型への侵食が大きい。lastAggressorIndex1つで十分 |
| lastAggressorIndexをGameStateに追加 | ✅ | 最後にbet/raiseしたプレイヤーを追跡。手番が戻ったらラウンド終了。最小限の型変更 |

### 実装アプローチ

**ファイル構成と各ファイルの責務:**

#### 1. `deck.ts`（~40行）
- `createDeck(): Card[]` — 4スート×13ランクの52枚生成
- `shuffleDeck(deck: Card[], randomFn?: () => number): Card[]` — Fisher-Yatesシャッフル。randomFn注入でテスト再現性確保

#### 2. `gameSetup.ts`（~60行）【4.1】
- `setupNewGame(randomFn?: () => number): GameState` — 5人のプレイヤー生成（人間1+CPU4）、人間席ランダム決定、初期チップ1000付与、ディーラーindex決定、デッキ生成・シャッフル、ブラインドポスト、ホールカード配布、phase='preflop'の初期状態を返す
- 内部でdealing.tsの`postBlinds`と`dealHoleCards`を呼ぶ

#### 3. `dealing.ts`（~80行）【4.2】
- `postBlinds(state: GameState): GameState` — ディーラー左隣をSB(5)、その左をBB(10)としてポットに移動。チップ不足はオールイン。currentBet=BIG_BLIND設定
- `dealHoleCards(state: GameState): GameState` — 各プレイヤーに2枚配布
- `dealCommunityCards(state: GameState, count: number): GameState` — フロップ(3)/ターン(1)/リバー(1)用

#### 4. `betting.ts`（~150行）【4.3】
- `getValidActions(state: GameState, playerIndex: number): PlayerAction[]` — 選択可能アクション一覧
- `applyAction(state: GameState, playerIndex: number, action: PlayerAction): GameState` — アクション検証・状態更新
- `isBettingRoundComplete(state: GameState): boolean` — ラウンド完了判定
- `getNextActivePlayerIndex(state: GameState, fromIndex: number): number` — 次のアクティブプレイヤー

**ベッティングルール:**
- fold: player.folded = true
- check: currentBet === player.currentBetInRound のとき可能。何もせず次へ
- call: currentBetとの差額をポットに投入
- bet: currentBet === 0 のとき可能。指定額をポットに投入、currentBet更新
- raise: currentBet > 0 のとき可能。上乗せ額をポットに投入、currentBet更新
- bet/raise時に `lastAggressorIndex` を更新

#### 5. `showdown.ts`（~100行）【4.4】
- `evaluateShowdown(state: GameState): GameState` — フォールドしていないプレイヤーの手札+コミュニティカードでevaluate()実行、勝者判定、ポット配分
- `determineWinners(players: Player[], communityCards: Card[]): number[]` — scoreが最小のプレイヤーを勝者として返す（handEvaluator.tsのscoreは低いほど強い: handEvaluator.ts:46-48）。同スコアは均等分配
- `resolveUncontestedPot(state: GameState): GameState` — 1人残りの場合のポット配分

#### 6. `handProgression.ts`（~120行）【4.5, 4.6, 4.7】
- `advancePhase(state: GameState): GameState` — preflop→flop→turn→river→showdown。各遷移でベッティング状態リセット、コミュニティカード配布、currentPlayerIndexをディーラー左隣に設定
- `startNextHand(state: GameState): GameState` — ディーラーボタン移動、デッキ再生成、全プレイヤーリセット、ブラインド・配布、phase='preflop'
- `isGameOver(state: GameState): { over: boolean; reason?: string }` — 人間チップ0 / CPU全員チップ0 で終了判定
- `getActivePlayerCount(state: GameState): number` — チップ>0のプレイヤー数

#### 7. `gameEngine.ts`（~50行）【4.7】
- 上記モジュールからパブリック関数を再エクスポートするファサード
- 外部（GameController等）はこのファサード経由でのみアクセス
- deck.ts, dealing.tsの内部関数は公開しない（パブリックAPI公開範囲の制約に準拠）

## 実装ガイドライン

- **イミュータブル更新必須**: 全関数は新しいオブジェクトを返す。スプレッド構文・map/filterを使用。引数のstateを変更しない（ナレッジ「状態の直接変更の検出基準」に準拠）
- **純粋関数設計**: 乱数は`randomFn?: () => number`で注入。デフォルトは`Math.random`。テスト時に固定値を渡せる構造にする（design.md: 「日付・乱数は引数で渡すか、開始時にシードして再現可能にする」）
- **参照すべき既存パターン**:
  - `handEvaluator.ts:45-57` — 純粋関数の設計パターン（引数→戻り値のみ、副作用なし）
  - `types.ts:47-57` — GameState型定義。ここに`lastAggressorIndex: number | null`を追加する
  - `constants.ts:1-9` — INITIAL_CHIPS(1000), PLAYER_COUNT(5), CPU_COUNT(4), SMALL_BLIND(5), BIG_BLIND(10)
- **単一ポット**: サイドポットは扱わない（design.md Non-Goals）。オールインプレイヤーがいても1つのポットで処理する
- **エラーハンドリング**: 無効なアクションは例外をスロー。状態は変更しない（design.md: "無効なアクション → 状態は変更しない"）
- **プレイヤーindex計算の注意**: ディーラー左隣やSB/BB位置の計算で、チップ0（除外済み）のプレイヤーをスキップする。`getNextActivePlayerIndex`を共通利用して散在を防ぐ
- **ベッティングラウンド完了判定ロジック**:
  - `lastAggressorIndex === null`（誰もbet/raiseしていない）: 全非フォールド・非オールインプレイヤーが1回ずつ行動したら終了
  - `lastAggressorIndex !== null`: 手番が`lastAggressorIndex`に戻ったら終了
  - 残り1人（全員フォールド）: 即座に`resolveUncontestedPot`→次のハンド
- **TODOコメント禁止**: ナレッジに明記。今やるか、やらないか
- **ファイル行数制限**: 各ファイル200行以内。超える場合は責務を再分割する

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| CPUの行動決定ロジック | タスク5のスコープ。GameEngineはCPUStrategyに依存しない |
| GameController（状態管理・フロー制御） | タスク6のスコープ |
| UIコンポーネント | タスク7-9のスコープ |
| ユーザーによるゲーム終了選択 | UI側の操作。isGameOverでは人間チップ0/CPU全員チップ0のみ判定 |
| ヘッズアップ特殊ルール（SB=ディーラー） | 要件に明記なし。初版では通常ルールで処理 |
| サイドポット | design.md Non-Goalsに明記 |

## 確認事項

なし。全ての不明点はコード調査と仕様書（requirements.md, design.md, tasks.md）で解決済み。