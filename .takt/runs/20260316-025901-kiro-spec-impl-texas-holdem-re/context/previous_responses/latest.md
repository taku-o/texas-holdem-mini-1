## arch-review
Now I have all the information to produce the review.

---

## Architecture Review — 判定: **REJECT**

### 概要

タスク 1.1〜1.4 の実装を、構造・設計の観点からレビューしました。変更は betting.ts を中心にバリデーション強化・ラウンド終了判定修正・ValidAction 型導入を行っています。変更スコープは Small（87行差分）で論理的にまとまっていますが、**DRY違反**（2箇所）、**説明コメント**（2箇所）、**単一真実源の違反**（ActionBar）、**アクション種別のバリデーションギャップ**を検出しました。

### 前回指摘の追跡

Movement Iteration 1 のため、前回のアーキテクチャレビュー指摘はありません。

---

### ブロッキング問題

#### `finding_id: ARCH-DRY-01` [new] — getValidActions 内の raise ロジック完全重複

**ファイル:** `src/domain/betting.ts:18-23` と `src/domain/betting.ts:27-32`

**問題:** 2つの分岐（`player.currentBetInRound >= state.currentBet` の true/false）で raise のロジック（minRaiseTotal, minRaiseCost, maxRaiseTotal の計算とアクション追加）が完全に同一のコードとして重複している。

```typescript
// lines 18-23 (if 分岐側)
const minRaiseTotal = state.currentBet + BIG_BLIND
const minRaiseCost = minRaiseTotal - player.currentBetInRound
if (player.chips >= minRaiseCost) {
  const maxRaiseTotal = player.currentBetInRound + player.chips
  actions.push({ type: 'raise', min: minRaiseTotal, max: maxRaiseTotal })
}

// lines 27-32 (else 分岐側) — 完全に同一
const minRaiseTotal = state.currentBet + BIG_BLIND
const minRaiseCost = minRaiseTotal - player.currentBetInRound
if (player.chips >= minRaiseCost) {
  const maxRaiseTotal = player.currentBetInRound + player.chips
  actions.push({ type: 'raise', min: minRaiseTotal, max: maxRaiseTotal })
}
```

**修正案:** raise の判定とアクション追加を if/else の外に出す。check/call の判定のみ分岐で決め、raise は共通パスで処理する:

```typescript
export function getValidActions(
  state: GameState,
  playerIndex: number,
): ValidAction[] {
  const player = state.players[playerIndex]
  const actions: ValidAction[] = [{ type: 'fold' }]

  if (player.currentBetInRound >= state.currentBet) {
    actions.push({ type: 'check' })
    if (state.currentBet === 0 && player.chips >= BIG_BLIND) {
      actions.push({ type: 'bet', min: BIG_BLIND, max: player.chips })
    }
  } else {
    actions.push({ type: 'call' })
  }

  // raise は両分岐共通
  if (state.currentBet > 0) {
    const minRaiseTotal = state.currentBet + BIG_BLIND
    const minRaiseCost = minRaiseTotal - player.currentBetInRound
    if (player.chips >= minRaiseCost) {
      const maxRaiseTotal = player.currentBetInRound + player.chips
      actions.push({ type: 'raise', min: minRaiseTotal, max: maxRaiseTotal })
    }
  }

  return actions
}
```

---

#### `finding_id: ARCH-DRY-02` [new] — isBettingRoundComplete 内の nonFolded.every 完全重複

**ファイル:** `src/domain/betting.ts:139-141` と `src/domain/betting.ts:144-146`

**問題:** 完全に同一の式 `nonFolded.every((p) => p.chips === 0 || p.currentBetInRound >= state.currentBet)` が 2 箇所に存在する。

**修正案:** 条件分岐を整理し、aggressor がアクティブ（folded でなく chips > 0）で currentPlayer が aggressor に戻った場合のみ `true` を返し、それ以外は共通の `nonFolded.every(...)` に統一する:

```typescript
export function isBettingRoundComplete(state: GameState): boolean {
  const nonFolded = state.players.filter((p) => !p.folded)
  if (nonFolded.length <= 1) return true

  if (state.lastAggressorIndex !== null) {
    const aggressor = state.players[state.lastAggressorIndex]
    if (!aggressor.folded && aggressor.chips > 0) {
      return state.currentPlayerIndex === state.lastAggressorIndex
    }
  }

  return nonFolded.every(
    (p) => p.chips === 0 || p.currentBetInRound >= state.currentBet,
  )
}
```

---

#### `finding_id: ARCH-WIRING-01` [new] — ActionBar が ValidAction.min/max を無視し、独自計算で min/max を決定（単一真実源の違反 + 計算式の乖離）

**ファイル:** `src/ui/ActionBar.tsx:29-35` および `src/ui/ActionBar.tsx:73-78`

**問題:** タスク 1.4 で `ValidAction` に `min`/`max` を追加した目的は「UI がチップ入力の範囲として利用できるようにする」こと。しかし ActionBar は `validActions` に含まれる `min`/`max` を一切参照せず、独自の `getMinBet()`、`getMinRaise()`、`getSliderProps()` で値を計算している。

さらに、最低レイズ額の計算式がドメインとUIで乖離している:
- ドメイン（betting.ts:18）: `minRaiseTotal = state.currentBet + BIG_BLIND`
- UI（ActionBar.tsx:34）: `getMinRaise = currentBet * 2`

例: `currentBet = 30, BIG_BLIND = 10` → ドメイン: min = 40、UI: min = 60（**20 の乖離**）

これはUIに **不正確なスライダー範囲** を提示し、ドメインが許可する最小レイズ額でレイズできない状態を引き起こす。

**修正案:** `getMinBet()`、`getMinRaise()`、`getSliderProps()` を削除し、`validActions` から取得した `min`/`max` を使用する:

```typescript
function handleButtonClick(actionType: ActionType) {
  if (!validActionTypes.has(actionType)) return

  if (actionType === 'bet' || actionType === 'raise') {
    const action = validActions.find((a) => a.type === actionType)
    setChipAmount(action?.min ?? 0)
    setChipInputMode(actionType as 'bet' | 'raise')
    return
  }

  onAction({ type: actionType })
}

function getSliderProps(): { min: number; max: number } {
  const action = validActions.find((a) => a.type === chipInputMode)
  return { min: action?.min ?? 0, max: action?.max ?? 0 }
}
```

これにより `playerChips`、`currentBet`、`playerCurrentBetInRound` を ActionBarProps から除去可能か検討する（AllIn ボタンに `playerChips` が必要な場合は残す）。

---

#### `finding_id: ARCH-COMMENT-01` [new] — 説明コメント（What/How）

**ファイル:** `src/domain/betting.ts:43`

```typescript
// bet/raise は個別のバリデーションで検証するため、ここでは fold/check/call のみチェック
```

**問題:** 直後の `if (action.type !== 'bet' && action.type !== 'raise')` の動作をそのまま日本語で言い換えたコメント。ナレッジの検出基準「コードの動作をそのまま自然言語で言い換えている」に該当。

**修正案:** コメントを削除する。条件式と後続の switch 内バリデーションから意図は読み取れる。

---

#### `finding_id: ARCH-COMMENT-02` [new] — 説明コメント（What/How）

**ファイル:** `src/domain/betting.ts:138`

```typescript
// lastAggressor がオールイン → 全アクティブプレイヤーが currentBet に揃ったか
```

**問題:** 直後の `return nonFolded.every(...)` の動作を日本語で繰り返しているだけの What コメント。

**修正案:** コメントを削除する。

---

#### `finding_id: ARCH-VALIDATION-01` [new] — applyAction が bet/raise のアクション種別の妥当性を検証しない

**ファイル:** `src/domain/betting.ts:44`

**問題:** `applyAction` は `action.type` が `'bet'` または `'raise'` の場合、`getValidActions` によるアクション種別チェックを完全にバイパスする。amount のバリデーションのみが行われるため、以下のように不正なアクション種別が通過する:

- `currentBet > 0` のとき `{ type: 'bet', amount: 20 }` を送信 → bet case（line 76-93）が実行され `player.currentBetInRound = betAmount` と**セットされる**（raise のように `raiseTotal - player.currentBetInRound` ではない）。これは `currentBetInRound` が既に正の値の場合に金額計算が狂う

**設計決定 #1 の評価:** coder-decisions.md に記録された判断（getValidActions がUI表示用にオールインbet を除外するため、applyAction ではbet/raiseを除外して個別検証）は動機は妥当だが、アプローチに問題がある。種別チェックと金額チェックは独立した検証であり、金額チェックのために種別チェックを丸ごとスキップする必要はない。

**修正案:** 全アクション種別で `getValidActions` による種別チェックを行い、bet/raise については追加で金額バリデーションを実施する。ただし、オールインbet（chips < BIG_BLIND）を許可するには、`getValidActions` にオールインbet を含めるか、applyAction 側で種別の妥当性を別途検証する（`currentBet === 0` なら bet 可、`currentBet > 0` なら raise 可、という条件を直接チェック）:

```typescript
// 種別の妥当性チェック（全アクション共通）
if (action.type === 'bet' && state.currentBet > 0) {
  throw new Error('Cannot bet when there is already a bet')
}
if (action.type === 'raise' && state.currentBet === 0) {
  throw new Error('Cannot raise when there is no bet')
}
// 金額バリデーション（bet/raise のみ、既存のswitchブロック内で実施）
```

---

### 非ブロッキング（参考情報）

#### `finding_id: ARCH-INFO-01` [new] — cpuStrategy が ValidAction.min/max を無視して独自に金額計算

**ファイル:** `src/domain/cpuStrategy.ts:84-85`、`src/domain/cpuStrategy.ts:100-102`（変更対象外ファイル）

`cpuStrategy.decideAction` は `getValidActions` を呼び出すが `.type` のみ使用し、`calculateBetAmount` で独自に金額を計算する。ActionBar と同じ構造の問題だが、変更対象外ファイルのため記録のみ。タスク 5.1（CPU のレイズ額修正）で対応時に `ValidAction.min/max` を活用すべき。

---

### 判定根拠

| finding_id | 状態 | 分類 |
|---|---|---|
| ARCH-DRY-01 | new | ブロッキング（DRY違反 — raise ロジック完全重複） |
| ARCH-DRY-02 | new | ブロッキング（DRY違反 — nonFolded.every 完全重複） |
| ARCH-WIRING-01 | new | ブロッキング（単一真実源の違反 + 計算式の乖離） |
| ARCH-COMMENT-01 | new | ブロッキング（説明コメント） |
| ARCH-COMMENT-02 | new | ブロッキング（説明コメント） |
| ARCH-VALIDATION-01 | new | ブロッキング（アクション種別バリデーションの欠如） |
| ARCH-INFO-01 | new | 非ブロッキング（変更対象外ファイル） |

ブロッキング問題が 6 件あるため、**REJECT** とします。

---

## supervise
Now I have the complete picture. Let me compile my validation report.

**Key findings from verification:**

1. **Tests**: 406 passed, 0 failed ✅
2. **Build**: Successful ✅
3. **Task 1.1** (bet/raise validation): Implemented correctly in `betting.ts:77-113` ✅
4. **Task 1.2** (chip-based raise filtering): Implemented correctly in `betting.ts:19-23, 28-32` ✅
5. **Task 1.3** (all-in aggressor round completion): Implemented correctly in `betting.ts:133-142` ✅
6. **Task 1.4** (min/max for UI): Domain returns min/max (`betting.ts:15,22`) but **ActionBar.tsx ignores these values** and uses independent calculations (`getMinBet`/`getMinRaise` at lines 29-35). The min raise formula diverges: domain uses `currentBet + BIG_BLIND` while UI uses `currentBet * 2`. ❌

Additionally, the AI review identified 5 blocking issues — **none were addressed**:
- **AI-WIRING-01**: ActionBar doesn't use ValidAction.min/max (confirmed at `ActionBar.tsx:29-35,73-78`)
- **AI-COMMENT-01**: Explanation comment at `betting.ts:43` (confirmed)
- **AI-COMMENT-02**: Explanation comment at `betting.ts:138` (confirmed)
- **AI-DRY-01**: Duplicated expression at `betting.ts:139-141` and `144-146` (confirmed)
- **AI-VALIDATION-GAP-01**: bet/raise bypass action type check at `betting.ts:44` (confirmed)

---

# 最終検証結果

## 結果: REJECT

## 要件充足チェック

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1.1 | ベット・レイズ時に action.amount がプレイヤー所持チップ以下であることを検証し、違反時はエラーを返す。レイズ額が最低レイズ額以上かも検証する | ✅ | `src/domain/betting.ts:77-86`（bet）、`src/domain/betting.ts:96-107`（raise）。テスト: `betting-validation.test.ts:258-437` |
| 1.2 | レイズ選択可能条件に「コール額＋最低レイズ額を支払えるか」を追加し、支払えない場合はレイズを無効にする | ✅ | `src/domain/betting.ts:18-23, 27-32`（`player.chips >= minRaiseCost`）。テスト: `betting-validation.test.ts:116-140` |
| 1.3 | lastAggressorがオールインでアクティブでない場合でもベッティングラウンドが正しく終了するように変更する | ✅ | `src/domain/betting.ts:133-141`（aggressorのchips > 0チェック + フォールバック判定）。テスト: `betting-validation.test.ts:440-555` |
| 1.4 | 有効アクション取得時にベット/レイズのmin/max範囲を返し、**UIがチップ入力の範囲として利用できるようにする** | ❌ | ドメイン側は `betting.ts:15,22` でmin/maxを返すが、`ActionBar.tsx:29-35,73-78` は `validActions` のmin/maxを無視して独自計算している。最低レイズ額がドメイン（`currentBet + BIG_BLIND`）とUI（`currentBet * 2`）で乖離する**実バグ**がある |

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npm test` — 406 passed (24 files) |
| ビルド | ✅ | `npm run build` — 成功 |
| 動作確認 | ❌ | ActionBarのmin raise値がドメインと乖離（currentBet=30時: ドメイン40 vs UI 60） |

## AI Review未対応指摘

AI Review（REJECT判定、5件ブロッキング）の指摘が**すべて未対応**のまま残っている。

| finding_id | 状態 | 問題 | ファイル:行 |
|---|---|---|---|
| AI-WIRING-01 | persists | ActionBarがValidAction.min/maxを使用せず独自計算（レイズ最低額の乖離バグ） | `src/ui/ActionBar.tsx:29-35,73-78` |
| AI-COMMENT-01 | persists | 説明コメント（What/How） | `src/domain/betting.ts:43` |
| AI-COMMENT-02 | persists | 説明コメント（What/How） | `src/domain/betting.ts:138` |
| AI-DRY-01 | persists | `nonFolded.every(...)` 同一式が2箇所に重複 | `src/domain/betting.ts:139-141, 144-146` |
| AI-VALIDATION-GAP-01 | persists | bet/raiseがgetValidActionsのアクション種別チェックをバイパス | `src/domain/betting.ts:44` |

## 成果物

- 変更: `src/domain/types.ts` （ValidAction型追加）
- 変更: `src/domain/betting.ts` （getValidActions, applyAction, isBettingRoundComplete修正）
- 変更: `src/domain/gameEngine.ts` （ValidAction re-export追加）
- 変更: `src/application/useGameController.ts` （ValidAction型に更新）
- 変更: `src/ui/ActionBar.tsx` （型のみ更新、ロジック未変更）
- 変更: `src/ui/ActionBar.test.tsx` （型更新）
- 変更: `src/ui/GameScreen.tsx` （型更新）
- 変更: `src/ui/GameScreen.test.tsx` （型更新）
- 作成: `src/domain/betting-validation.test.ts` （バリデーション・ラウンド終了・min/maxテスト）

## 未完了項目（REJECT理由）

| # | 項目 | 理由 |
|---|------|------|
| 1 | タスク1.4 UIがmin/maxを利用していない | `ActionBar.tsx` が `validActions` のmin/maxを無視し、`getMinBet()`/`getMinRaise()`で独自計算している。計画書の「ActionBar の `getMinBet`/`getMinRaise` を削除し `validActions` から取得」が未実施。最低レイズ額がドメインとUIで乖離する実バグがある |
| 2 | AI Review 5件の指摘が全て未対応 | ai_fix/reviewers/fixムーブメントが実行されていない、または対応が行われていない |