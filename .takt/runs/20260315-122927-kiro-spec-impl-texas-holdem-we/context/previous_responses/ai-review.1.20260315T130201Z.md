Now I have all the facts. Let me trace through the blind-position test to confirm my analysis:

**Test: `should skip chip-0 player in blind positions`**
- Setup: `dealerIndex: 0`, players 1,2 have 0 chips, players 0,3,4 have 1000 chips
- `startNextHand` calls `getNextDealerIndex(state)`:
  - Starts at `(0+1)%5 = 1` → chips=0, skip
  - `(1+1)%5 = 2` → chips=0, skip
  - `(2+1)%5 = 3` → chips=1000, **return 3**
- New dealer = **3**, so SB = `(3+1)%5 = 4` (1000 chips), BB = `(3+2)%5 = 0` (1000 chips)
- Players 1 and 2 are **not in blind positions at all** — the assertions are trivially true

**Test: `should detect game over when all CPUs are eliminated after showdown`**  
- Comment says "CPUのチップが少なく" but `setupNewGame(() => 0.5)` gives all equal chips
- If game over isn't reached in 50 iterations, test passes silently without testing game over

Now I have a complete picture. Let me write the review.

---

## AI Antipattern Review — タスク10「結合・動作確認とテスト」

### 判定: **REJECT**

---

### ブロッキング問題

#### `AIR-001` [new] — `handProgression.test.ts:303-322` テストが主張するシナリオを実際にはテストしていない

**ファイル:** `src/domain/handProgression.test.ts:303-322`

**問題:** テスト「should skip chip-0 player in blind positions」はチップ0プレイヤーがブラインド位置にいる場合の動作を検証すると主張しているが、実際にはその状況を発生させていない。

**根拠（実コードのトレース）:**
1. 初期状態: `dealerIndex: 0`, players[1]と[2]のchips=0
2. `startNextHand` → `getNextDealerIndex(state)`:
   - `(0+1)%5 = 1` → chips=0, スキップ
   - `(1+1)%5 = 2` → chips=0, スキップ
   - `(2+1)%5 = 3` → chips=1000, **return 3**
3. 新ディーラー = **3**, SB = `(3+1)%5 = 4`（chips=1000）, BB = `(3+2)%5 = 0`（chips=1000）
4. **players[1]とplayers[2]はブラインド位置ではない** — アサーション `expect(result.players[1].chips).toBe(0)` は自明に成立

これは典型的なAIアンチパターン「もっともらしいが間違っている」である。テストは正しいコードに見えるが、回帰を検出する能力がない。

**修正案:** チップ0プレイヤーが実際にSB/BB位置に来るよう初期状態を設定する。例えば:
```typescript
// dealerIndex: 2 → SB=3, BB=4 の位置にchips=0のプレイヤーを配置
const players = Array.from({ length: 5 }, (_, i) =>
  createTestPlayer({
    id: `player-${i}`,
    isHuman: i === 0,
    chips: (i === 3 || i === 4) ? 0 : 1000,
  })
)
const state = createTestState({ players, dealerIndex: 2 })
```
ただし、`getNextDealerIndex`もchips=0をスキップするため、ディーラー自体が移動しないよう`dealerIndex`のプレイヤーにchips>0を確保する必要がある。実際には `postBlinds`（dealing.ts:10-16）は `Math.min(BLIND, chips)` でchips=0のプレイヤーに0をポストする仕様なので、テストではこの仕様を正確に検証すべき。

---

#### `AIR-002` [new] — `gameEngine.integration.test.ts:210-268` テストがゲーム終了到達を保証していない（検知漏れ）

**ファイル:** `src/domain/gameEngine.integration.test.ts:210-268`

**問題:** テスト「should detect game over when all CPUs are eliminated after showdown」は、ループが`maxIterations`(50)回に到達した場合、ゲーム終了を検証せずにチップ保存則のみ検証して正常終了する。テスト名が主張するシナリオが実際に実行されたかの保証がない。

さらに、Givenコメント（行212）が「CPUのチップが少なく、人間が大量に持っている状態」と記述しているが、`setupNewGame(() => 0.5)` は全プレイヤーに同額のチップを配分するため、コメントが事実と異なる。

**修正案:** ループ後に、ゲーム終了に到達したことを保証するアサーションを追加する:
```typescript
// ループ外（最後）:
// 50回以内にゲーム終了に到達していること
expect(iterations).toBeLessThan(maxIterations)
```
もしくは、確実にゲーム終了に到達するよう初期チップを調整したテスト状態を構築する。Givenコメントも実際のセットアップに合わせて修正する。

---

### 非ブロッキング情報

#### `AIR-W01` [Warning] — テストセットアップの重複

**ファイル:** `src/domain/gameEngine.integration.test.ts` 全体, `src/application/useGameController.test.ts:399-462`

「全員call→全員check→ショーダウン」のループパターンが`gameEngine.integration.test.ts`内で4回以上繰り返されている。同様に、ゲーム終了到達のための`fold`ループが`useGameController.test.ts`内で3回重複している。テストファイルの重複はポリシー上Warningだが、ヘルパー関数（例: `playHandToShowdown(state)`）への抽出を検討するとメンテナンス性が向上する。

#### `AIR-W02` [Warning] — `gameEngine.integration.test.ts:270-319` 既存テストとの機能重複

「should preserve chip conservation across each phase in a single hand」は、「should complete a full hand from setup through showdown」（行11-71）とセットアップがほぼ同一で、チップ保存則の各フェーズ検証のみが差分。テストの意図は理解できるが、既存テストの拡張で実現可能だった。

---

### 指摘サマリ

| finding_id | 状態 | 分類 | ファイル | 概要 |
|---|---|---|---|---|
| AIR-001 | new | REJECT | handProgression.test.ts:303-322 | テストが主張するブラインドスキップシナリオを実際にはテストしていない |
| AIR-002 | new | REJECT | gameEngine.integration.test.ts:210-268 | ゲーム終了到達を保証せず、Givenコメントも事実と異なる |
| AIR-W01 | new | Warning | 複数ファイル | テストセットアップの重複 |
| AIR-W02 | new | Warning | gameEngine.integration.test.ts:270-319 | 既存テストとの機能重複 |