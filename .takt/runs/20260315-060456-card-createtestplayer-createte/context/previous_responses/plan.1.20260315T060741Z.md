調査が完了しました。以下が計画レポートです。

---

## 計画レポート

### タスク概要

テストヘルパー関数（`card`, `createTestPlayer`, `createTestState`, `createSimpleDeck`）がテストファイル間で重複している。これを共通テストヘルパーファイルに集約する。

### 現状分析

#### 重複の全容

| ヘルパー | 重複ファイル数 | 定義ファイル |
|---------|-------------|-------------|
| `card` | 5 | `dealing.test.ts:6`, `betting.test.ts:11`, `handProgression.test.ts:12`, `showdown.test.ts:9`, `handEvaluator.test.ts:5` |
| `createTestPlayer` | 4 | `dealing.test.ts:8-18`, `betting.test.ts:13-23`, `handProgression.test.ts:14-24`, `showdown.test.ts:11-21` |
| `createTestState` | 4 | `dealing.test.ts:20-36`, `betting.test.ts:25-41`, `handProgression.test.ts:34-50`, `showdown.test.ts:23-45` |
| `createSimpleDeck` | 2 | `dealing.test.ts:38-44`, `handProgression.test.ts:26-32` |

#### 実装の差異

**`card`**: 全5箇所で実装が同一。問題なく統合可能。

**`createTestPlayer`**: デフォルト `holeCards` が異なる。
- `dealing.test.ts`: `holeCards: []`（dealing はカード配布をテストするため空が妥当）
- `betting.test.ts`, `handProgression.test.ts`: `holeCards: [card('A', 'spades'), card('K', 'hearts')]`
- `showdown.test.ts`: `holeCards: [card('2', 'spades'), card('3', 'hearts')]`

→ 共通化する場合、デフォルトはダミーの手札付き（一番多いパターン）とし、各テストで必要に応じて `overrides` でカスタマイズする方針が妥当。

**`createTestState`**: デフォルト値が各テストの文脈に依存。
- `dealing.test.ts`: `pot:0, currentBet:0, currentPlayerIndex:0, deck:createSimpleDeck()`
- `betting.test.ts`: `pot:15, currentBet:BIG_BLIND, currentPlayerIndex:3, deck:[]`
- `handProgression.test.ts`: `pot:15, currentBet:BIG_BLIND, currentPlayerIndex:3, deck:createSimpleDeck()`, さらに `isHuman: i === 0` をプレイヤーに設定
- `showdown.test.ts`: `phase:'showdown', pot:100, currentBet:0, currentPlayerIndex:0, deck:[], communityCards:5枚ハードコード`

→ 共通化する場合、最もシンプルなデフォルト値（`dealing.test.ts` のパターン）を基本とし、各テストが `overrides` で文脈に合った値を設定する方針が妥当。

**`createSimpleDeck`**: 2箇所で実装が同一。問題なく統合可能。

### 設計方針

#### 新規ファイル

**`src/domain/testHelpers.ts`** を作成する。

- `src/domain/` に配置する理由: テストヘルパーは全て `src/domain/` 配下のテストファイルで使われており、domain の型（`Card`, `Player`, `GameState`）に依存している。同階層に配置するのが最も自然。
- ファイル名 `testHelpers.ts`: テスト専用であることが明示的で、プロダクションコードと区別できる。

#### 共通ヘルパーの設計

```typescript
// src/domain/testHelpers.ts

// 1. card: そのまま統合（全箇所同一実装）
export const card = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit })

// 2. createSimpleDeck: そのまま統合（全箇所同一実装）
export function createSimpleDeck(): Card[] { ... }

// 3. createTestPlayer: デフォルトはダミー手札付き
export function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'test-player',
    isHuman: false,
    chips: 1000,
    holeCards: [card('A', 'spades'), card('K', 'hearts')],
    folded: false,
    currentBetInRound: 0,
    ...overrides,
  }
}

// 4. createTestState: 最もシンプルなデフォルト値
export function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'preflop',
    dealerIndex: 0,
    players: Array.from({ length: 5 }, (_, i) =>
      createTestPlayer({ id: `player-${i}` })
    ),
    communityCards: [],
    pot: 0,
    currentBet: 0,
    currentPlayerIndex: 0,
    humanPlayerId: 'player-0',
    deck: createSimpleDeck(),
    lastAggressorIndex: null,
    ...overrides,
  }
}
```

**デフォルト値の選択根拠:**
- `createTestPlayer` の `holeCards: [card('A', 'spades'), card('K', 'hearts')]` — 4箇所中3箇所が手札ありをデフォルトにしている。dealing のテストは `holeCards: []` を overrides で明示的に渡せばよい（dealing はまさに手札を配る処理なので、空の手札をテストのセットアップで明示するのは自然）
- `createTestState` の `deck: createSimpleDeck()` — デッキが必要なテストのほうが多い。不要なテスト（betting, showdown）は `deck: []` を overrides で渡す
- `pot: 0, currentBet: 0, currentPlayerIndex: 0` — 最もニュートラルな初期値。各テストが文脈に合った値を overrides で明示する

#### 各テストファイルの変更

| ファイル | 変更内容 |
|---------|---------|
| `dealing.test.ts` | ローカルの `card`, `createTestPlayer`, `createTestState`, `createSimpleDeck` を削除。`testHelpers.ts` から import。`createTestPlayer` 使用箇所で `holeCards: []` をデフォルトにしていた部分は、テスト内で overrides 済みなら変更不要。直接 `createTestPlayer()` をデフォルトで呼んでいる箇所のみ `createTestPlayer({ holeCards: [] })` に変更が必要か確認すること |
| `betting.test.ts` | ローカルの `card`, `createTestPlayer`, `createTestState` を削除。`testHelpers.ts` から import。`createTestState` の呼び出しで `pot: 15, currentBet: BIG_BLIND, currentPlayerIndex: 3, deck: []` を overrides で明示的に渡す |
| `handProgression.test.ts` | ローカルの `card`, `createTestPlayer`, `createSimpleDeck`, `createTestState` を削除。`testHelpers.ts` から import。`createTestState` の呼び出しで `pot: 15, currentBet: BIG_BLIND, currentPlayerIndex: 3` を overrides で明示的に渡す。`isHuman: i === 0` のプレイヤー生成は `createTestState` 呼び出し時の overrides で `players` を渡す |
| `showdown.test.ts` | ローカルの `card`, `createTestPlayer`, `createTestState` を削除。`testHelpers.ts` から import。`createTestState` の呼び出しで文脈に合った overrides を渡す |
| `handEvaluator.test.ts` | ローカルの `card` を削除。`testHelpers.ts` から import |

### Coder向け実装ガイドライン

#### 参照すべき既存パターン
- `dealing.test.ts:8-44` — 全ヘルパーの元パターン。共通ヘルパーはこれをベースにする
- `betting.test.ts:25-41` — overrides パターンの参考。移行後の各テストファイルがこのように overrides を使う

#### 変更の影響範囲
- 新規: `src/domain/testHelpers.ts`（1ファイル）
- 変更: テストファイル5つ（`dealing.test.ts`, `betting.test.ts`, `handProgression.test.ts`, `showdown.test.ts`, `handEvaluator.test.ts`）
- プロダクションコードへの影響: **なし**

#### 注意すべきアンチパターン
1. **テストの挙動変更**: デフォルト値の変更により既存テストが壊れないこと。各テストファイル変更後に `vitest run` でテストが全て通ることを必ず確認する
2. **`dealing.test.ts` の `createTestPlayer` はデフォルト `holeCards: []`** だった点に注意。共通ヘルパーのデフォルトは `holeCards` ありに変わるため、`dealing.test.ts` 内で `createTestPlayer()` をデフォルト引数で呼んでいる箇所は `createTestPlayer({ holeCards: [] })` に変更が必要
3. **`handProgression.test.ts` の `createTestState` はプレイヤー生成時に `isHuman: i === 0` を設定**している。共通化後もこの挙動を維持するため、`handProgression.test.ts` 側で `players` overrides を明示的に渡すか、共通 `createTestState` のデフォルトに含めるか検討が必要（他のテストファイルでは `isHuman` を設定していないため、`handProgression.test.ts` 側で overrides するのが妥当）
4. **行数制限**: `testHelpers.ts` は 40-50 行程度になる見込み。200行制限に問題なし

#### 実装手順
1. `src/domain/testHelpers.ts` を作成し、4つのヘルパーを定義
2. `handEvaluator.test.ts` を修正（最もシンプル: `card` のみ）
3. `dealing.test.ts` を修正（`holeCards` デフォルト差異に注意）
4. `betting.test.ts` を修正（`createTestState` overrides に注意）
5. `showdown.test.ts` を修正（`createTestState` overrides に注意）
6. `handProgression.test.ts` を修正（`createSimpleDeck` + `isHuman` overrides に注意）
7. テスト実行で全パス確認