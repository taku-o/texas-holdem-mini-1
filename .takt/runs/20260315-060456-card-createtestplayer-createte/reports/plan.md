# タスク計画

## 元の要求
レビューで指摘事項がありました。こちらを修正してください。
- テストヘルパーの重複（card, createTestPlayer, createTestState等）

## 分析結果

### 目的
テストファイル間で重複定義されている `card`, `createTestPlayer`, `createTestState`, `createSimpleDeck` を共通テストヘルパーファイルに集約し、DRY違反を解消する。

### スコープ

**重複の全容:**

| ヘルパー | 重複数 | 定義ファイル |
|---------|--------|-------------|
| `card` | 5 | `dealing.test.ts:6`, `betting.test.ts:11`, `handProgression.test.ts:12`, `showdown.test.ts:9`, `handEvaluator.test.ts:5` |
| `createTestPlayer` | 4 | `dealing.test.ts:8-18`, `betting.test.ts:13-23`, `handProgression.test.ts:14-24`, `showdown.test.ts:11-21` |
| `createTestState` | 4 | `dealing.test.ts:20-36`, `betting.test.ts:25-41`, `handProgression.test.ts:34-50`, `showdown.test.ts:23-45` |
| `createSimpleDeck` | 2 | `dealing.test.ts:38-44`, `handProgression.test.ts:26-32` |

**影響ファイル:**
- 新規: `src/domain/testHelpers.ts`（1ファイル、40-50行見込み）
- 変更: テストファイル5つ（ローカルヘルパー削除 → import に置換）
- プロダクションコードへの影響: **なし**

### 実装アプローチ

#### 1. 共通ヘルパーファイル `src/domain/testHelpers.ts` を作成

`src/domain/` に配置する。全テストが同階層にあり、domain の型（`Card`, `Player`, `GameState`）に依存しているため。

#### 2. 各ヘルパーのデフォルト値の統一方針

**`card`**: 全5箇所で実装同一。そのまま統合。

**`createSimpleDeck`**: 全2箇所で実装同一。そのまま統合。

**`createTestPlayer`** のデフォルト `holeCards`:
- 統一値: `[card('A', 'spades'), card('K', 'hearts')]`（3/4ファイルのパターン）
- 理由: 大半のテストは手札ありの状態を前提とする。`dealing.test.ts` は手札配布のテストなので `holeCards: []` を overrides で明示するのが自然

**`createTestState`** のデフォルト値:
- 統一値: `phase: 'preflop', pot: 0, currentBet: 0, currentPlayerIndex: 0, deck: createSimpleDeck(), communityCards: [], lastAggressorIndex: null`
- 理由: 最もニュートラルな初期状態。各テストが自身の文脈に合った値を overrides で渡す

#### 3. 各テストファイルの移行

| ファイル | 作業内容 | 注意点 |
|---------|---------|--------|
| `handEvaluator.test.ts` | `card` のみ import に置換 | 最もシンプル。変更なし |
| `dealing.test.ts` | 4ヘルパー削除→import | **`createTestPlayer()` をデフォルト引数で呼んでいる箇所は `createTestPlayer({ holeCards: [] })` に変更が必要**（旧デフォルトが `holeCards: []` だったため） |
| `betting.test.ts` | 3ヘルパー削除→import | `createTestState()` 呼び出しに `{ pot: 15, currentBet: BIG_BLIND, currentPlayerIndex: 3, deck: [] }` を overrides で追加 |
| `showdown.test.ts` | 3ヘルパー削除→import | `createTestState()` 呼び出しに `{ phase: 'showdown', pot: 100, communityCards: [...], deck: [] }` を overrides で追加 |
| `handProgression.test.ts` | 4ヘルパー削除→import | `createTestState()` 呼び出しに `{ pot: 15, currentBet: BIG_BLIND, currentPlayerIndex: 3 }` を overrides で追加。`isHuman: i === 0` のプレイヤー生成は `players` を overrides で渡す |

## 実装ガイドライン

- **参照パターン**: `dealing.test.ts:8-44` を共通ヘルパーのベース実装とし、デフォルト値のみ上記方針で調整する
- **テスト不壊の確認**: 各テストファイル変更後に `vitest run` で全テストが通ることを確認する。デフォルト値変更によるサイレントな挙動変化に注意
- **`dealing.test.ts` の `holeCards` 差異が最大のリスク**: 旧デフォルト `[]` → 新デフォルト `[card('A','spades'), card('K','hearts')]`。`dealing.test.ts` 内で `createTestPlayer()` を引数なしで呼び、かつ `holeCards` が空であることに依存するテストケースを全て洗い出し、`{ holeCards: [] }` を明示的に渡すこと
- **`handProgression.test.ts` の `isHuman` 設定**: 共通 `createTestState` はプレイヤーに `isHuman` を設定しない。`handProgression.test.ts` 側で `players` overrides を使い `isHuman: i === 0` を維持すること
- **import パスは相対パス `'./testHelpers'`** を使用する（同階層）

## 確認事項
なし（全てコード調査で解決済み）