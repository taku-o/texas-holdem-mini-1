# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 2` — タスク2「ブラインド・ショートスタックの扱いの修正」の実装

## 分析結果

### 目的
- **2.1**: BBがショートスタックの場合、`currentBet` に実際にポストした額を設定する（`BIG_BLIND` 固定にしない）
- **2.2**: チップが0のプレイヤーにはブラインドをポストさせず、アクティブなプレイヤーのみからSB/BBを徴収する

### スコープ

| ファイル | 変更内容 |
|---------|---------|
| `src/domain/dealing.ts` | **主変更対象**: postBlinds のSB/BB位置決定ロジックとcurrentBet設定 |
| `src/domain/handProgression.ts` | **配線修正**: `preparePreflopRound` (行23) のBBインデックス取得元の変更 |
| `src/domain/dealing.test.ts` | **テスト更新・追加** |

### 要件の変更要/不要判定

| 要件 | 判定 | 根拠 |
|------|------|------|
| 2.1 currentBet=実際のBB額 | **変更要** | `dealing.ts:22` で `currentBet: BIG_BLIND` と固定値。BBがショートスタック（例: chips=7）でも `currentBet=10` になる |
| 2.2 脱落プレイヤーへのブラインド不課金 | **変更要** | `dealing.ts:7-8` で `sbIndex`, `bbIndex` を `dealerIndex+1`, `+2` で固定計算。チップ0のプレイヤーがその位置にいても無条件にブラインドを課す |

### 実装アプローチ

#### 2.1: `currentBet` を実際のBB額にする

**変更箇所**: `src/domain/dealing.ts:22`

```typescript
// Before
currentBet: BIG_BLIND,

// After
currentBet: bbAmount,
```

`bbAmount` は既に `Math.min(BIG_BLIND, players[bbIndex].chips)` として計算済み（行14）なので、参照先を変えるだけ。

#### 2.2: チップ0のプレイヤーをSB/BB対象から除外する

**変更箇所**: `src/domain/dealing.ts:7-8`

`dealing.ts` 内にプライベートヘルパー `findNextEligibleIndex` を追加し、`chips > 0` のプレイヤーを探索する。

```typescript
function findNextEligibleIndex(players: Player[], fromIndex: number): number {
  const count = players.length
  let index = (fromIndex + 1) % count
  const start = index
  do {
    if (players[index].chips > 0) return index
    index = (index + 1) % count
  } while (index !== start)
  return -1
}
```

SB/BB 決定を固定位置から探索に変更:
```typescript
// Before
const sbIndex = (state.dealerIndex + 1) % count
const bbIndex = (state.dealerIndex + 2) % count

// After
const sbIndex = findNextEligibleIndex(players, state.dealerIndex)
const bbIndex = findNextEligibleIndex(players, sbIndex)
```

#### 配線修正: `preparePreflopRound` のBBインデックス

**変更箇所**: `src/domain/handProgression.ts:23`

`postBlinds` は既に `lastAggressorIndex: bbIndex` を返している（dealing.ts:23）ので、ハードコードされたBB位置計算を `lastAggressorIndex` の参照に置き換える。

```typescript
// Before
const bbIndex = (nextState.dealerIndex + 2) % nextState.players.length

// After
const bbIndex = nextState.lastAggressorIndex!
```

### 追加すべきテスト

1. **BBショートスタック時のcurrentBet**: BBがチップ7の場合、`currentBet === 7` であること
2. **チップ0プレイヤーのSBスキップ**: dealer+1がチップ0の場合、次の `chips > 0` のプレイヤーがSBになること
3. **チップ0プレイヤーのBBスキップ**: dealer+2がチップ0の場合、次の `chips > 0` のプレイヤーがBBになること
4. **SBとBBの間にチップ0がいる場合**: 正しくスキップされること
5. **preparePreflopRound**: スキップ後のUTG位置が正しいこと

### 既存テストへの影響

| テスト | 影響 |
|--------|------|
| `dealing.test.ts:57-66` "should set currentBet to BIG_BLIND" | BB十分チップありの場合は `bbAmount === BIG_BLIND` なので値は同じ。テスト名を実態に合わせて変更が望ましい |
| `dealing.test.ts:98-114` "should handle all-in when player has fewer chips than BB" | **アサーション追加必要**: `currentBet === 7`（実際のBB額）であることの検証 |

## 実装ガイドライン

- **参照すべき既存パターン**: `handProgression.ts:63-71` の `getNextDealerIndex` が `chips > 0` でスキップするヘルパーの先例。`dealing.ts` のヘルパーも同じパターンに従うこと
- **`findNextEligibleIndex` は export しない**: `dealing.ts` 内のプライベートヘルパーとし、パブリックAPIを増やさない
- **import の追加**: `dealing.ts` に `Player` 型の import を追加する（ヘルパーの引数型に必要）
- **`lastAggressorIndex` の活用**: `handProgression.ts:23` は `postBlinds` が設定する `lastAggressorIndex`（= 実際のBBインデックス）を使う。新しいフィールドを `GameState` に追加する必要はない

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| ヘッズアップ（2人対戦）時のSB/BBルール | 現行設計が5人前提であり、タスク指示書にヘッズアップ対応の指示がない |
| `getNextDealerIndex` と `findNextEligibleIndex` の共通化 | 振る舞いが異なる（開始位置と終了条件）。過度な抽象化になるため現時点では不要 |

## 確認事項
なし（コード調査で全て解決済み）