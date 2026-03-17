# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 5` — タスク5「CPUの行動決定ロジック」の実装

## 分析結果

### 目的
現在のゲーム状態とプレイヤーのインデックスから、フォールド・チェック・コール・ベット・レイズのいずれかをルールに沿って自動で決定するロジックを実装する。ベット・レイズ時はチップ数も返す。初版はシンプルなルールベースでよい（要件7.1）。

### スコープ
- **新規ファイル**: `src/domain/cpuStrategy.ts`（CPUの行動決定ロジック）
- **変更ファイル**: `src/domain/gameEngine.ts`（エクスポート追加、1行）

後続タスク（タスク6: GameController）で `decideAction` を呼び出してCPUターンを駆動するが、そのワイヤリングはタスク6のスコープ。

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| ランダム選択のみ | ❌ | ゲームとして成立しづらく、要件7.1の「ルールに従って」に不適 |
| シンプルなルールベース（ハンド強度3段階評価） | ✅ | 初版として十分。テスト可能で実装コストも低い |
| 高度なAI（ポットオッズ・アウツ計算等） | ❌ | design.mdのNon-Goals「高度なCPU戦略は対象外」に明記 |

### 実装アプローチ

#### インターフェース

```typescript
// src/domain/cpuStrategy.ts
export function decideAction(
  state: GameState,
  playerIndex: number,
  randomFn?: () => number
): PlayerAction
```

- `playerIndex: number` を採用。既存の `getValidActions`（`betting.ts:3`）、`applyAction`（`betting.ts:25`）がすべてインデックスベースのため統一する
- `randomFn` オプション引数で乱数注入。`startNextHand`（`handProgression.ts:73-76`）と同パターン

#### 行動決定ルール（2段階）

**ステップ1: ハンド強度評価 → 3段階（strong / medium / weak）**

- **プリフロップ（コミュニティカード0枚）**: ホールカード2枚の特徴量で分類
  - strong: ペア（10以上）、AK、AQなど
  - medium: 低〜中ペア、Aスーテッド、KQ、スーテッドコネクタ等
  - weak: 上記以外
- **ポストフロップ（コミュニティカード3〜5枚）**: `evaluate()`（`handEvaluator.ts:45`）でHandRankCategoryを取得して分類
  - strong: three-of-a-kind 以上
  - medium: one-pair, two-pair
  - weak: high-card

**ステップ2: 強度に基づくアクション選択**

`getValidActions`（`betting.ts:3-23`）の結果から選択:

| 強度 | 方針 | 具体アクション |
|------|------|--------------|
| strong | 積極的 | bet/raise可→実行（BIG_BLIND×2〜3）、不可→call/check |
| medium | コール寄り | call可→call、check可→check、一定確率でbet/raise |
| weak | パッシブ | check可→check、コスト低→call、高→fold |

- ベット/レイズ額: `BIG_BLIND`（`constants.ts:9`、値10）を基準に倍率で算出。`Math.min(計算額, player.chips)` で残チップ超過を防止
- `randomFn` で行動に多少のランダム性を持たせ、完全に予測可能にならないようにする

## 実装ガイドライン

### 参照すべき既存実装パターン

| パターン | ファイル:行 | 説明 |
|---------|-----------|------|
| randomFn引数 | `handProgression.ts:73-76` | テスト用の乱数注入パターン。同じ方式を採用する |
| getValidActions利用 | `betting.ts:3-23` | 有効アクション取得。CPUStrategyは必ずこの結果からのみ選択すること |
| evaluate利用 | `showdown.ts:13-14` | `[...holeCards, ...communityCards]` でevaluate呼び出し |
| バレルエクスポート | `gameEngine.ts:1-18` | `export { decideAction } from './cpuStrategy'` を追加 |
| 定数参照 | `constants.ts:8-9` | BIG_BLIND をベット額基準に使用 |

### 変更の影響範囲

1. **`src/domain/cpuStrategy.ts`（新規）**: 推定80-120行。`decideAction` のみをエクスポート。内部ヘルパー（ハンド強度評価関数等）は非公開
2. **`src/domain/gameEngine.ts`（変更）**: `export { decideAction } from './cpuStrategy'` の1行追加のみ

### 注意すべきアンチパターン

1. **有効アクション検証のバイパス禁止**: 必ず `getValidActions` の結果に含まれるアクションのみを返すこと。CPUStrategy が独自にアクション有効性を判定してはいけない
2. **bet/raiseのamount必須**: `betting.ts:61-63, 73-75` で `action.amount === undefined` のチェックがある。bet/raiseを返す際は必ず `amount` を設定すること
3. **プリフロップでのevaluate()呼び出し回避**: `evaluate()` は7枚向け。プリフロップ（ホールカード2枚のみ）では使わず、ホールカードの簡易評価を使うこと。ポストフロップ（5枚以上）では `evaluate()` を使用する
4. **残チップ超過防止**: ベット/レイズ額が `player.chips` を超えないよう `Math.min` で制約する

## 確認事項
なし。タスクの要件・設計・既存コードから必要な情報はすべて確認済み。