`preparePreflopRound` の bbIndex 再計算部分の影響を確認しました。計画をまとめます。

---

## 計画レポート

### タスク概要

**タスク2: ブラインド・ショートスタックの扱いの修正**（要件3）

- **2.1**: BBがショートスタックの場合、`currentBet` に実際にポストした額を設定する（`BIG_BLIND` 固定にしない）
- **2.2**: チップが0のプレイヤーにはブラインドをポストさせず、アクティブなプレイヤーのみからSB/BBを徴収する

---

### 要件の変更要/不要判定

| 要件 | 判定 | 根拠 |
|------|------|------|
| 2.1 currentBet=実際のBB額 | **変更要** | `dealing.ts:22` で `currentBet: BIG_BLIND` と固定値。BBがショートスタック（例: chips=7）でも `currentBet=10` になる |
| 2.2 脱落プレイヤーへのブラインド不課金 | **変更要** | `dealing.ts:7-8` で `sbIndex`, `bbIndex` を単純に `dealerIndex+1`, `+2` で計算。チップ0のプレイヤーがその位置にいても無条件にブラインドを課す |

---

### 影響範囲

| ファイル | 影響 |
|---------|------|
| `src/domain/dealing.ts` | **主変更対象**: postBlinds のSB/BB位置決定とcurrentBet設定 |
| `src/domain/handProgression.ts` | **配線修正**: `preparePreflopRound` (行23) が `bbIndex = (dealerIndex + 2) % count` とハードコードしているため、postBlinds でスキップした場合と不整合になる |
| `src/domain/dealing.test.ts` | **テスト更新**: 既存テスト「should set currentBet to BIG_BLIND」の期待値変更、新規テスト追加 |

---

### 実装アプローチ

#### 2.1: `currentBet` を実際のBB額にする

**変更箇所**: `src/domain/dealing.ts:22`

```
// Before
currentBet: BIG_BLIND,

// After  
currentBet: bbAmount,
```

`bbAmount` は既に `Math.min(BIG_BLIND, players[bbIndex].chips)` として計算済み（行14）なので、参照先を変えるだけ。

#### 2.2: チップ0のプレイヤーをSB/BB対象から除外する

**変更箇所**: `src/domain/dealing.ts:7-8`

現在の固定位置計算:
```typescript
const sbIndex = (state.dealerIndex + 1) % count
const bbIndex = (state.dealerIndex + 2) % count
```

修正後: dealer の次から探索し、`chips > 0` のプレイヤーをSBとし、その次の `chips > 0` のプレイヤーをBBとする。

**ヘルパー関数**: `findNextEligibleIndex(players, fromIndex)` を `dealing.ts` 内に追加する。dealer位置から順に `chips > 0` のプレイヤーを探す。

```typescript
function findNextEligibleIndex(players: Player[], fromIndex: number): number {
  const count = players.length
  let index = (fromIndex + 1) % count
  const start = index
  do {
    if (players[index].chips > 0) return index
    index = (index + 1) % count
  } while (index !== start)
  return -1 // 該当なし（ゲーム終了状態）
}
```

SB/BB の決定:
```typescript
const sbIndex = findNextEligibleIndex(players, state.dealerIndex)
const bbIndex = findNextEligibleIndex(players, sbIndex)
```

#### 配線修正: `preparePreflopRound` のBBインデックス

**変更箇所**: `src/domain/handProgression.ts:23`

現在 `postBlinds` が `lastAggressorIndex: bbIndex` を返している（dealing.ts:23）ので、`preparePreflopRound` は `nextState.lastAggressorIndex` を使えば実際のBB位置を取得できる。

```typescript
// Before
const bbIndex = (nextState.dealerIndex + 2) % nextState.players.length

// After
const bbIndex = nextState.lastAggressorIndex!
```

これにより、postBlinds でスキップが発生しても UTG の決定が正しくなる。

---

### 既存テストへの影響

| テスト | 影響 |
|--------|------|
| `dealing.test.ts:57-66` "should set currentBet to BIG_BLIND" | **更新必要**: BB が十分なチップを持つ場合は結果的に `BIG_BLIND` と同値になるため、このテスト自体は変わらない。ただしテスト名は「should set currentBet to actual BB amount」のように変更が望ましい |
| `dealing.test.ts:98-114` "should handle all-in when player has fewer chips than BB" | **更新必要**: このケースで `currentBet` が 7（実際のBB額）になることを検証するアサーションを追加 |

### 追加すべきテスト

1. **BBショートスタック時のcurrentBet**: BBがチップ7の場合、`currentBet === 7` であること
2. **SBショートスタック時のcurrentBet**: SBがショートでもcurrentBetはBB額で決まること（SBは影響しない）
3. **チップ0プレイヤーのSBスキップ**: dealer+1がチップ0の場合、次のチップ>0のプレイヤーがSBになること
4. **チップ0プレイヤーのBBスキップ**: dealer+2がチップ0の場合、次のチップ>0のプレイヤーがBBになること
5. **preparePreflopRound**: スキップ後のUTG位置が正しいこと

---

### Coder向け実装ガイドライン

#### 参照すべき既存パターン
- **チップ0スキップのパターン**: `handProgression.ts:63-71` (`getNextDealerIndex`) — `chips > 0` でスキップする同種のヘルパーが既に存在。`dealing.ts` に追加するヘルパーも同じパターンに従う
- **lastAggressorIndex の活用**: `dealing.ts:23` で `lastAggressorIndex: bbIndex` を設定済み。`handProgression.ts:23` はこれを活用する

#### 変更の配線
1. `dealing.ts`: `findNextEligibleIndex` ヘルパー追加 → `postBlinds` の SB/BB インデックス計算を変更 → `currentBet: bbAmount` に変更
2. `handProgression.ts:23`: `bbIndex` の取得元を `lastAggressorIndex` に変更
3. テスト: `dealing.test.ts` の既存テスト更新 + 新規テスト追加

#### 注意すべきアンチパターン
- **ヘルパーの重複定義**: `getNextDealerIndex`（handProgression.ts）と新規 `findNextEligibleIndex`（dealing.ts）の条件が同一（`chips > 0`）。ただし `getNextDealerIndex` は `state.dealerIndex` に戻る終了条件で、こちらは `fromIndex+1` から開始する探索なので、振る舞いが異なるため別関数で問題ない
- **SBとBBが同じプレイヤーになるケース**: 2人しかアクティブプレイヤーがいない場合、ヘッズアップのルールに注意。現行のヘッズアップ処理が特にない（常に5人前提）ため、`sbIndex === bbIndex` になりうる。タスクスコープ外だが、2人以上のアクティブプレイヤーがいることが前提の現行設計であることを認識しておく