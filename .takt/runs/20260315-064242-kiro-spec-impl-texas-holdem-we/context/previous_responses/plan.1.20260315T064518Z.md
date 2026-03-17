既存コードの全体像を把握しました。計画をまとめます。

---

## 計画レポート

### タスク概要

**タスク5.1**: 現在のゲーム状態とプレイヤーIDから、フォールド・チェック・コール・ベット・レイズのいずれかをルールに沿って自動で決定するロジックを実装する。ベット・レイズ時はチップ数も返す。初版はシンプルなルールベースでよい。

**対応要件**: 7.1（CPUプレイヤーのターンでルールに従い自動で行動を決定する）

### 現状分析

**既存の関連コード:**
- `src/domain/betting.ts:3-23` - `getValidActions()`: プレイヤーの有効なアクション一覧を返す。CPUStrategyはこれを利用してルール上有効なアクションのみから選択する
- `src/domain/types.ts:32-37` - `PlayerAction` 型: `{ type: ActionType, amount?: number }`
- `src/domain/types.ts:47-58` - `GameState` 型: 全ゲーム状態
- `src/domain/handEvaluator.ts:45-57` - `evaluate(cards)`: 7枚（またはそれ以下）のカードから HandRank を返す
- `src/domain/constants.ts:8-9` - `SMALL_BLIND=5`, `BIG_BLIND=10`: ベットサイズの基準値
- `src/domain/gameEngine.ts` - ドメイン層のパブリックAPI。現時点では CPUStrategy 関連のエクスポートなし

**現在CPUStrategy は未実装。** `gameEngine.ts` にもエクスポートされていない。

### 設計方針

#### ファイル構成

| ファイル | 責務 | 新規/変更 |
|---------|------|----------|
| `src/domain/cpuStrategy.ts` | CPUの行動決定ロジック | **新規** |
| `src/domain/gameEngine.ts` | ドメイン層パブリックAPI | **変更**（エクスポート追加） |

#### インターフェース

```typescript
// src/domain/cpuStrategy.ts
export function decideAction(
  state: GameState,
  playerIndex: number,
  randomFn?: () => number  // テスト時にシード可能にする
): PlayerAction
```

- 引数は `playerId: string` ではなく `playerIndex: number` とする。既存の `getValidActions` / `applyAction` がすべてインデックスベースであるため統一する（design.mdのconceptual interfaceは `playerId` だが、実装は既にインデックスベース）
- `randomFn` をオプション引数で受けることで、テストで確定的な挙動を検証可能にする（`handProgression.ts:73-76` の `startNextHand` と同パターン）

#### CPUの行動決定ルール（ルールベース戦略）

シンプルな2段階評価:

**1. ハンド強度の評価**
- **プリフロップ（コミュニティカード0枚）**: ホールカード2枚の強度をシンプルに評価する
  - ペア、高ランクカード（A, K, Q, J）、スーテッド等の特徴量で3段階（strong / medium / weak）に分類
- **ポストフロップ（コミュニティカード3-5枚）**: `evaluate()` を使ってホールカード+コミュニティカードの役を評価し、HandRankCategory で3段階に分類
  - strong: three-of-a-kind 以上
  - medium: one-pair, two-pair
  - weak: high-card

**2. ハンド強度に基づくアクション選択**

有効アクション（`getValidActions` の結果）の中から選択:

| 強度 | 基本方針 | 具体的な選択 |
|------|---------|------------|
| strong | 積極的にベット/レイズ | bet/raise可能→実行（BIG_BLIND×2〜3倍）、不可→call/check |
| medium | コール寄り | call可能→call、check可能→check、一定確率でbet/raise |
| weak | パッシブ | check可能→check、コストが低ければcall、高ければfold |

- ベット/レイズ額: `BIG_BLIND` を基準とした倍率で決定。残りチップを超えない（オールイン考慮）
- `randomFn` で多少のランダム性を持たせ、CPUの行動が完全に予測可能にならないようにする

#### ナレッジ・ポリシーとの照合

- **1ファイル1責務**: ✅ `cpuStrategy.ts` は行動決定のみ
- **行数**: 推定80-120行。200行以下に収まる
- **パブリックAPIの公開範囲**: `decideAction` のみをエクスポートし、内部のヘルパー（ハンド強度評価等）は非公開
- **操作の一覧性**: `gameEngine.ts` のバレルエクスポートに追加し、ドメイン操作の一覧を維持
- **依存方向**: cpuStrategy → types, betting(getValidActions), handEvaluator(evaluate), constants(BIG_BLIND)。すべてDomain層内の同レイヤー依存で問題なし
- **テスト可能性**: `randomFn` 引数で再現可能。`startNextHand` と同じパターン

### Coder向け実装ガイドライン

#### 参照すべき既存実装パターン

| パターン | ファイル:行 | 説明 |
|---------|-----------|------|
| randomFn引数パターン | `handProgression.ts:73-76` (`startNextHand`) | テスト用の乱数注入 |
| getValidActions利用 | `betting.ts:3-23` | 有効アクション取得 |
| evaluate利用 | `showdown.ts:13-14` | カード配列からHandRank取得 |
| バレルエクスポート | `gameEngine.ts:1-18` | 新規エクスポート追加先 |
| 定数参照 | `constants.ts:8-9` | BIG_BLIND をベット額基準に使用 |

#### 変更の影響範囲

1. **`src/domain/cpuStrategy.ts`（新規）**: メインの実装ファイル
2. **`src/domain/gameEngine.ts`（変更）**: `decideAction` のエクスポートを追加（1行追加）

後続タスク（タスク6: GameController）で `decideAction` を呼び出してCPUターンを駆動するが、そのワイヤリングはタスク6のスコープ。

#### 注意すべきアンチパターン

1. **有効アクション検証のバイパス禁止**: 必ず `getValidActions` の結果に含まれるアクションのみを返すこと。CPUStrategy が独自にアクション有効性を判定してはいけない
2. **ベット/レイズ額のバリデーション**: 残りチップを超えないこと。`Math.min(計算額, player.chips)` で制約する
3. **handEvaluatorの直接利用（ポストフロップ）**: コミュニティカードが足りない段階（2枚+3枚未満）で `evaluate()` を呼ぶ場合、ライブラリが7枚未満を受け付けるか確認が必要。プリフロップではホールカードのみの簡易評価を使い、`evaluate()` はコミュニティカードが出てから使う
4. **amountフィールド**: `bet` / `raise` アクションでは必ず `amount` を設定すること（`betting.ts:61-63, 73-75` でundefinedチェックがある）