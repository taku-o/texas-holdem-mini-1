# Design Document: texas-holdem-review-fixes

---

**Purpose**: レビュー指摘対応の実装方針を定義する。既存の `texas-holdem-webapp` のアーキテクチャ・レイヤーを前提に、変更対象モジュール・インターフェース・データの変更点のみを記載する。

---

## Overview

本 spec は、`texas-holdem-webapp` に対するレビュー指摘を要件化したものであり、既存の `src/domain`・`src/application`・`src/ui` に対する修正を定義する。新規レイヤーや新規サービスは追加せず、既存コンポーネントの振る舞い・契約・データのみを変更する。

**Users**: 既存アプリの利用者（変更による影響を受ける対象）。

**Impact**: 既存の betting, dealing, showdown, handProgression, handEvaluator, cpuStrategy, gameSetup, gameFlow, useGameController, TableView, PlayerSeat, ActionBar の修正。新規ファイルは必要に応じて最小限（例: ユーティリティ）のみ。

### Goals

- 要件 1〜14 を満たすように、該当モジュールの仕様と実装を更新する。
- 既存のレイヤー分離（Domain / Application / UI）を維持する。
- 変更はテスト可能な境界で行い、既存テストの意図を満たしつつ必要ならテストを追加・更新する。

### Non-Goals

- サイドポットの本格実装（要件 4 は単一ポットの範囲での正当性・明示化にとどめる）。
- 新規フレームワーク・新規ライブラリの導入。
- 既存の texas-holdem-webapp 機能の仕様変更（本 spec の要件に直接関係しない部分）。

---

## Architecture

親 spec（texas-holdem-webapp）のアーキテクチャをそのまま使用する。変更は次のモジュールに限定する。

| レイヤー | 変更対象モジュール | 主な変更内容 |
|----------|---------------------|--------------|
| Domain | betting.ts | バリデーション強化、ラウンド終了判定の修正、getValidActions の返却形式 |
| Domain | dealing.ts | currentBet の設定、脱落プレイヤーへのブラインド不課金 |
| Domain | showdown.ts | オールイン時の配分仕様の明示（単一ポットの範囲） |
| Domain | handProgression.ts | チップ 0 プレイヤーの次ハンド除外 |
| Domain | cpuStrategy.ts | レイズ額の下限保証 |
| Domain | handEvaluator.ts | ロイヤルフラッシュ判定のライブラリ依存の整理 |
| Domain | gameSetup.ts | 乱数関数の注入（既存の randomFn 引数で充足する場合はインターフェースの明示のみ） |
| Application | gameFlow.ts | CPU 連続処理の非同期化（yield / 非同期） |
| Application | useGameController.ts | startGame 時の setState の扱い |
| UI | TableView.tsx, CardView | コミュニティカードの key、カード裏の alt |
| UI | PlayerSeats.tsx, PlayerSeat.tsx | 席の key（既に player.id の場合は確認のみ）、必要ならカード key |
| UI | ActionBar.tsx | チップ額のクライアント側検証、スライダー/入力の label・aria |

---

## Requirements Traceability

| Req | Summary | Components | Interfaces / 変更点 |
|-----|---------|------------|----------------------|
| 1 | ベッティングのバリデーション | betting.ts | applyAction: amount ≤ chips、レイズ額・最低レイズ・レイズ可否のチェック |
| 2 | ベッティングラウンド終了判定 | betting.ts | isBettingRoundComplete: last aggressor オールイン時も終了する条件 |
| 3 | ブラインド・ショートスタック | dealing.ts | postBlinds: currentBet=実際のBB額、脱落者にブラインドを課さない |
| 4 | ショーダウン・ポット配分 | showdown.ts | 単一ポット・オールイン時の配分ルールの明示と不整合防止 |
| 5 | チップ 0 と次ハンド | handProgression.ts | startNextHand: チップ 0 を除外して進行、getNextDealerIndex 等の一貫性 |
| 6 | CPU のレイズ額 | cpuStrategy.ts | decideAction / レイズ額計算: currentBet 以上を保証 |
| 7 | 役判定の依存 | handEvaluator.ts | ロイヤルフラッシュをライブラリ内部定数に直接依存しない形で判定 |
| 8 | 有効アクションの返却形式 | betting.ts | getValidActions: bet/raise に min/max または amount 範囲を付与 |
| 9 | 乱数関数の結合 | gameSetup.ts | setupNewGame(randomFn): 既存引数で注入可能であることを契約で明示 |
| 10 | CPU 処理の非同期化 | gameFlow.ts | processCpuTurnsAndPhases: チャンクまたは requestAnimationFrame/setTimeout で yield |
| 11 | リスト表示の key | TableView, PlayerSeats, CardView | key に card の一意識別子・player.id を使用（index 禁止） |
| 12 | チップ額のクライアント側バリデーション | ActionBar.tsx | 送信前に min/max/chips の範囲チェック、無効時は送信無効化またはエラー表示 |
| 13 | アクセシビリティ | ActionBar, CardView | スライダー/入力に label または aria-label、カード裏に alt |
| 14 | ゲーム開始時の setState | useGameController.ts | startGame: setState を関数形式で初期状態を返す形に統一 |

---

## Component-Level Design（変更点のみ）

### Domain: betting.ts

**要件**: 1, 2, 8

- **applyAction**
  - 事前条件: `action.type` が bet/raise の場合、`action.amount` は必須。
  - 検証追加: (1) `action.amount <= player.chips`（ベット/レイズで使う額がチップを超えないこと）、(2) ベット時は amount が有効範囲（例: 最小ベット以上）、(3) レイズ時は `amount >= currentBet + 最低レイズ` かつ `amount - player.currentBetInRound <= player.chips`。違反時は状態を更新せずエラー（throw または Result 型で返す）。
  - 既存の「validActions に type が含まれるか」に加え、bet/raise の amount の範囲検証を行う。
- **getValidActions**
  - レイズを返す条件: 当該プレイヤーが「コール額 + 最低レイズ額」を支払える場合のみ `raise` を追加する。
  - 返却型: bet/raise には選択可能な額の範囲（例: `minBet`, `maxBet`, `minRaise`, `maxRaise` など、既存の `PlayerAction` を拡張するか、別型で返す）を含め、UI がそのまま min/max として使えるようにする。
- **isBettingRoundComplete**
  - 終了条件: 「last aggressor がオールインでアクティブでない」場合は、そのプレイヤーが currentPlayer に戻ることを待たずに終了する。
  - 具体案: 「アクティブなプレイヤーが全員 currentBet に揃った」または「last aggressor 以外のアクティブプレイヤーが全員フォールドまたはオールインで currentBet に揃った」など、last aggressor をスキップしても有限回で true になる条件に変更する。

**Interfaces**

- `PlayerAction`: bet/raise 時に `amount` 必須。必要なら `ValidBetRange` のような型を追加し、getValidActions の返却で利用する。
- エラー: 無効なアクション時は `ApplyActionError` のような型で理由を返すか、既存どおり `throw new Error(...)` とする。設計では「状態を更新せずエラーを返す」ことを満たすこと。

---

### Domain: dealing.ts

**要件**: 3

- **postBlinds**
  - SB/BB をポストするプレイヤーは「チップ > 0」のアクティブなプレイヤーに限定する。チップ 0 のプレイヤーは SB/BB の対象から外し、その席はスキップする（または SB/BB の席決めを「次のアクティブ」で行う）。
  - BB がショートスタックの場合: 実際にポストした額を `currentBet` に設定する。つまり `currentBet = bbAmount`（`bbAmount = Math.min(BIG_BLIND, players[bbIndex].chips)`）。戻り値の `currentBet` を `BIG_BLIND` 固定にしない。

**Interfaces**

- 既存の `GameState` の `currentBet` の意味を「このラウンドで現在求められているベット額（ショートスタック時は実際の BB 額）」とし、postBlinds の戻りでそれを満たすようにする。

---

### Domain: showdown.ts

**要件**: 4

- **evaluateShowdown**
  - 単一ポットの前提で、配分後いかなるプレイヤーの chips も負にならないようにする。オールインが複数いる場合は、既存の「全員に share を配り remainder を 1 人に」で、share + remainder が pot を超えないことを保証する。
  - 仕様として「本バージョンではサイドポットは行わず、単一ポットで均等配分（または remainder を 1 人に）」と design またはコメントで明記する。不正なマイナスチップが発生するケースがあれば、そのケースを禁止するか、配分ロジックで防ぐ。

**Interfaces**

- 変更なし。振る舞いの仕様明示と不変条件（chips >= 0）の維持のみ。

---

### Domain: handProgression.ts

**要件**: 5

- **startNextHand**
  - チップが 0 のプレイヤーは「次のハンドに参加させない」。実装方針の例: (A) プレイヤー配列から削除しないが、`folded` を true のままにする、または (B) 参加可能フラグ（例: `isEligibleForNextHand`）を導入し、ブラインド・ディーラー・アクティブプレイヤー計算では `chips > 0` または `isEligibleForNextHand` のプレイヤーのみを対象にする。
  - 席順・ディーラーボタン・ブラインド: 次ハンドの dealerIndex や SB/BB の決定で「チップ 0 のプレイヤーをスキップする」ようにする。既存の `getNextDealerIndex` は `chips > 0` を見ているため、startNextHand の前に「チップ 0 を除外してから dealer を決める」か、getNextDealerIndex の定義を「参加可能なプレイヤーのみ」に合わせる。
- **preparePreflopRound**（postBlinds を呼ぶ側）
  - dealing の変更（脱落者にブラインドを課さない・currentBet を実際の BB 額にする）と整合させる。

**Interfaces**

- 必要なら `Player` に `isEligibleForNextHand` や `isSittingOut` を追加する。既存の `chips > 0` で判定する場合は型変更なしでよい。

---

### Domain: cpuStrategy.ts

**要件**: 6

- **decideAction** / レイズ額の計算
  - レイズを選んだ場合、返す `amount` は「コールに必要な額 + レイズ追加額」として、`amount >= currentBet`（または現ルールの最小レイズ）を満たすようにする。ショートスタックでオールインする場合は、`amount = player.currentBetInRound + player.chips` のようにし、結果としての実質ベット額が currentBet 未満にならないようにする（＝「レイズ」として有効な最小額以上にする）。

**Interfaces**

- `PlayerAction` の `amount` を、既存の applyAction 側の検証（要件 1）と合わせて解釈する。CPU が返すレイズ額が常に検証を通過するようにする。

---

### Domain: handEvaluator.ts

**要件**: 7

- **evaluate** / ロイヤルフラッシュ
  - ライブラリの内部定数（数値 0 や特定のスコア）に直接依存しないようにする。方針例: (A) ライブラリが返すランク・スコアを「ストレートフラッシュの最強」としてアプリ側で定義した定数と比較する、(B) または「ストレートフラッシュかつ A が含まれる」などアプリ側の条件でロイヤルフラッシュと判定する。いずれにせよ、ライブラリの内部実装が変わってもロイヤルフラッシュ判定が壊れないようにする。

**Interfaces**

- 既存の `HandRank` はそのまま。判定ロジックの内部のみ変更。

---

### Domain: gameSetup.ts

**要件**: 9

- **setupNewGame**
  - 既に `randomFn: () => number` を引数で受けているため、乱数は差し替え可能。設計上は「ゲーム開始時の乱数はすべてこの引数で賄う」ことを明記し、テストでは固定シードやモックを渡せることを契約とする。実装の変更が不要な場合は、コメントまたは design の記載のみでよい。

---

### Application: gameFlow.ts

**要件**: 10

- **processCpuTurnsAndPhases**（および CPU を連続で回す処理）
  - 現在の同期的ループ（MAX_CPU_ITERATIONS）を、メインスレッドを長時間ブロックしない形に変更する。
  - 方針例: (1) 1 ターンまたは N ターン処理したら `setTimeout(..., 0)` または `queueMicrotask` で次のチャンクを実行する、(2) または `async/await` と `requestAnimationFrame` を組み合わせ、フレーム間に yield する。いずれも「状態更新 → 再描画 → 次の CPU 処理」のサイクルが進むようにする。
  - インターフェース: `handlePlayerAction` や `advanceUntilHumanTurn` が同期的に `GameState` を返す現状を、非同期で返す形に変えると useGameController 側の setState のタイミングが変わる。そのため、「gameFlow が同期的に 1 回分の状態を返し、呼び出し側（useGameController）で複数回 setState を呼ぶ」か、「gameFlow が Promise を返し、resolve するたびに setState する」のいずれかで設計する。後者の場合、useGameController は async な handleAction を受け入れる形になる。

**Interfaces**

- `handlePlayerAction(state, action, randomFn): GameState` を `handlePlayerAction(state, action, randomFn): Promise<GameState>` にするか、または「次の人間ターンまで進めた状態」を同期的に返すが、その過程で CPU ターンごとにコールバックで state を返して UI を更新する API にするか、を決める。設計では「CPU 連続処理がメインスレッドをブロックしすぎない」ことを満たすこととする。

---

### Application: useGameController.ts

**要件**: 14

- **startGame**
  - 初期状態を設定する際、`setState(advanced)` ではなく、前回状態に依存しない形で設定する。例: `setState(() => advanced)`。React の推奨に従い、初期状態の算出結果をそのまま渡す場合は関数形式 `setState(() => newState)` で渡して、確実にその値が使われるようにする。

**Interfaces**

- 変更なし。setState の呼び出し方のみ。

---

### UI: TableView.tsx, CardView

**要件**: 11, 13

- **TableView**
  - コミュニティカードのリストで `key={index}` を使わない。カードの一意識別子（例: `card.suit + '-' + card.rank`、または Card に id を持たせるならそれ）を key に使う。
- **CardView**（カード裏面）
  - 裏面表示時に `alt` テキスト（または aria-label）で「伏せたカード」などアクセシブルな説明を付与する。

**Interfaces**

- 既存の `Card` 型に id がなければ、key 用の文字列は `suit` と `rank` から生成する関数でよい。

---

### UI: PlayerSeats.tsx, PlayerSeat.tsx

**要件**: 11

- **PlayerSeats**
  - 既に `key={player.id}` を使用しているため、変更不要。他リストで index を key にしている箇所があれば、player.id や card の一意 ID に変更する。
- **PlayerSeat** 内でカードを並べている場合
  - カードの key を index から card の一意 ID に変更する。

---

### UI: ActionBar.tsx

**要件**: 12, 13

- **チップ額入力**
  - ベット/レイズの確定前に、min/max（getValidActions や props で渡される範囲）および所持チップを超えないことをクライアント側で検証する。範囲外の値では「送信しない」か「エラーメッセージを表示して送信を無効化」する。
- **アクセシビリティ**
  - スライダーおよび数値入力に、`<label>` の関連付け、または `aria-label` で意味が分かるラベルを付与する。

**Interfaces**

- ActionBar の props で、有効なベット/レイズの min/max を渡す（getValidActions の返却型を拡張した内容を渡す想定）。

---

## Data Model Changes

- **PlayerAction**  
  bet/raise 時に `amount` を必須とする。getValidActions の返却で「選択可能な額の範囲」を表す型（例: `{ type: 'bet', min: number, max: number }` / `{ type: 'raise', min: number, max: number }`）を追加するか、既存の `PlayerAction[]` に付随して `ValidActionDetails` のような形で min/max を渡す。
- **GameState.currentBet**  
  意味を「このラウンドで現在求められているベット額」とし、ショートスタック BB の場合は実際にポストされた額になる（dealing の変更で保証）。
- **Player**  
  必要に応じて `isEligibleForNextHand` や `isSittingOut` を追加。必須ではなく、`chips > 0` で判定する場合は追加しない。

---

## Error Handling

- **betting.applyAction**  
  無効な amount（チップ超過、レイズ額不足など）の場合は throw または Result 型でエラーを返し、状態を更新しない。UI はエラーメッセージを表示するか、クライアント側検証で送信前に防ぐ。
- その他  
  既存のエラーハンドリング方針を維持する。本 spec で新規に「キャッチして別処理」を追加する必要はない。

---

## Testing Strategy

- **単体テスト**  
  betting（applyAction のバリデーション、isBettingRoundComplete のオールイン時）、dealing（postBlinds の currentBet・脱落者）、showdown（配分後の chips >= 0）、handProgression（チップ 0 の次ハンド除外）、cpuStrategy（レイズ額）、handEvaluator（ロイヤルフラッシュ）を、期待する状態・エラーになるケースで検証する。
- **結合テスト**  
  gameFlow の非同期化後は、handlePlayerAction が Promise を返す場合、useGameController の setState が正しいタイミングで呼ばれることを検証する。
- **UI テスト**  
  ActionBar のチップ範囲外入力で送信が無効になること、スライダー/入力にラベルや aria が付与されていることを必要に応じてテストする。

---

## Supporting References

- 親 spec の設計: `.kiro/specs/texas-holdem-webapp/design.md`
- 既存型定義: `src/domain/types.ts`、`src/domain/constants.ts`
