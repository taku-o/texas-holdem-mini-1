I now have all the information needed for a thorough review. Here is my AI Antipattern Review report.

---

## AI Antipattern Review — 判定: **REJECT**

### 検出した問題一覧

| finding_id | 状態 | 重大度 | ファイル | 概要 |
|---|---|---|---|---|
| AI-AR-001 | new | REJECT | `src/domain/betting.ts:59,69` | `action.amount!` 非nullアサーション — amountバリデーション欠如 |
| AI-AR-002 | new | REJECT | `src/domain/betting.ts:10-14` | `getValidActions` でBBプリフロップのレイズオプション欠如 |
| AI-AR-003 | new | REJECT | `src/domain/betting.ts:92-106` | `isBettingRoundComplete` がBBのプリフロップ「オプション」をスキップ |
| AI-AR-004 | new | REJECT | `src/domain/gameEngine.ts:6` | 内部実装 `getNextActivePlayerIndex` がパブリックAPIファサードにエクスポート |
| AI-AR-W01 | new | Warning | `src/domain/dealing.ts:28-31` | `dealHoleCards` で副作用を使った `deckIndex++` パターン |

---

### REJECT 詳細

#### AI-AR-001: `action.amount!` 非nullアサーション — amountバリデーション欠如

**ファイル:** `src/domain/betting.ts:59,69`

**問題:** `bet` と `raise` のケースで `action.amount!` を使っているが、`PlayerAction.amount` は `amount?: number`（optional）として型定義されている。`getValidActions` はアクションの **type** のみを検証し、`amount` の存在を検証していない。`applyAction(state, 0, { type: 'bet' })` と呼ばれた場合、`action.amount!` は `undefined` となり、`player.chips -= undefined` で `NaN` が伝播する。

**AI特有パターン:** 「もっともらしいが動かないコード」— 型的には `!` で黙らせているが、ランタイムで壊れる。AIはnon-null assertionを型チェックの回避手段として安易に使いがち。

**修正案:**
1. `applyAction` 内の `bet`/`raise` ケースの先頭で `action.amount` が `undefined` の場合に `throw` するバリデーションを追加する
2. または、`PlayerAction` の型を discriminated union に変更し、`bet`/`raise` のとき `amount: number` を必須にする（例: `{ type: 'bet'; amount: number } | { type: 'fold' }`）

---

#### AI-AR-002: `getValidActions` でBBプリフロップのレイズオプション欠如

**ファイル:** `src/domain/betting.ts:10-14`

**問題:** `player.currentBetInRound >= state.currentBet` の場合、`check` のみが返される。`currentBet > 0` のとき `raise` が選択肢に含まれない。

ポーカールール上、プレイヤーが現在のベットにマッチしている場合（例: プリフロップのBB）、`check` **と** `raise` の両方が有効なアクションである。現在の実装ではBBがプリフロップでレイズできない。

```typescript
// 現在のコード（betting.ts:10-14）
if (player.currentBetInRound >= state.currentBet) {
  actions.push({ type: 'check' })
  if (state.currentBet === 0) {
    actions.push({ type: 'bet' })
  }
  // ← currentBet > 0 のときに raise が欠落
}
```

**AI特有パターン:** 「構文は正しいが意味が間違っている」— ドメインルールの理解不足。AIはベッティングロジックの基本フローは実装できるが、BBのプリフロップオプションのような細かいルールを見落としがち。

**修正案:** `currentBet > 0` のとき `raise` を追加する:
```typescript
if (player.currentBetInRound >= state.currentBet) {
  actions.push({ type: 'check' })
  if (state.currentBet === 0) {
    actions.push({ type: 'bet' })
  } else {
    actions.push({ type: 'raise' })
  }
}
```

---

#### AI-AR-003: `isBettingRoundComplete` がBBのプリフロップ「オプション」をスキップ

**ファイル:** `src/domain/betting.ts:92-106`

**問題:** `lastAggressorIndex === null` の場合のフォールバックロジック:

```typescript
const activePlayers = state.players.filter(
  (p) => !p.folded && p.chips > 0,
)
return activePlayers.every(
  (p) => p.currentBetInRound >= state.currentBet,
)
```

プリフロップで全員がコールした後（レイズなし）、BBの `currentBetInRound` はブラインドポスト時点で既に `BIG_BLIND` に設定されている。したがって `activePlayers.every(p => p.currentBetInRound >= currentBet)` は、BBがまだアクションしていないのに `true` を返す。

**実際のフロー（D=0, SB=1, BB=2, UTG=3 の場合）:**
1. UTG(3)コール → player[3].currentBetInRound = 10
2. Player(4)コール → currentBetInRound = 10
3. Dealer(0)コール → currentBetInRound = 10
4. SB(1)コール → currentBetInRound = 10
5. `isBettingRoundComplete` チェック → BB(2)の `currentBetInRound = 10 >= 10` → **true を返す** → BBが行動する機会なし

ポーカールール上、プリフロップのBBはブラインドを投じていても必ず「オプション」（チェックまたはレイズ）の機会が与えられる。

**AI特有パターン:** AI-AR-002と連動するドメインロジックの見落とし。AIはプリフロップのBBオプションという「例外的ルール」を実装しないまま、テストも「全員コール→即ラウンド終了」で書いてしまい、バグが検出されない。

**修正案:** プリフロップ時にBBが未行動かどうかを追跡する仕組みが必要。以下のいずれかのアプローチ:
1. `GameState` に `actedThisRound: Set<number>` や `bbHasActed: boolean` フラグを追加する
2. プリフロップのBBを `lastAggressorIndex` として設定し、BBに到達するまでラウンドが終了しないようにする（最もシンプル）

---

#### AI-AR-004: 内部実装 `getNextActivePlayerIndex` がパブリックAPIファサードにエクスポート

**ファイル:** `src/domain/gameEngine.ts:6`

**問題:** `getNextActivePlayerIndex` は `applyAction` 内部および `advancePhase`/`startNextHand` 内部で使われる低レベルヘルパーである。ゲームコントローラー（タスク6）から直接呼ぶ必要はない（`applyAction` が内部で次プレイヤーへの遷移を行う）。パブリックAPIファサードからこの関数をエクスポートすることは、内部実装の漏洩にあたる。

**grep確認結果:**
- 使用箇所: `betting.ts`（applyAction内）, `handProgression.ts`（advancePhase/startNextHand内）, `gameSetup.ts`（setupNewGame内） — すべてドメイン内部
- `gameEngine.integration.test.ts` は `gameEngine.ts` からインポートしていない（各モジュールから直接インポート）

**修正案:** `gameEngine.ts` から `getNextActivePlayerIndex` のエクスポートを削除する:
```typescript
export {
  getValidActions,
  applyAction,
  isBettingRoundComplete,
  // getNextActivePlayerIndex を削除
} from './betting'
```

---

### Warning 詳細

#### AI-AR-W01: `dealHoleCards` で副作用を使った `deckIndex++` パターン

**ファイル:** `src/domain/dealing.ts:28-31`

```typescript
let deckIndex = 0
const players = state.players.map((p) => ({
  ...p,
  holeCards: [state.deck[deckIndex++], state.deck[deckIndex++]],
}))
```

`.map()` コールバック内で外部変数 `deckIndex` を副作用で変更している。JSの評価順序により正しく動作するが、関数型スタイルのmap内での副作用は可読性を損なう。明示的なforループやreduce、またはsliceベースの実装のほうが意図が明確。

---

### 非ブロッキング（参考情報）

| 項目 | ファイル | 内容 |
|------|---------|------|
| 未使用定数 | `src/domain/constants.ts:5` | `CPU_COUNT` はテスト以外の本番コードで使用されていない。ただしこのファイルは今回の変更対象外のため非ブロッキング。 |
| `determineWinners` エクスポート | `src/domain/gameEngine.ts:10` | `evaluateShowdown` の内部で使用されるヘルパー。UIで勝者情報を表示する用途の可能性もあるが、現時点では内部のみ。AI-AR-004ほど明確ではないため参考情報とする。 |

---

### 判定根拠

REJECT 基準に該当する問題が4件（AI-AR-001〜AI-AR-004）あるため、**REJECT** とします。

特にAI-AR-002とAI-AR-003は連動しており、プリフロップにおけるBBの「オプション」（チェックまたはレイズの権利）が完全に欠落しています。これはポーカーの基本ルールの見落としであり、タスク4.3の要件「ルールに沿って検証し状態を更新する」を満たしていません。