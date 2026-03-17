# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 1` — タスク1「ベッティングのバリデーションとラウンド終了・有効アクション返却の修正」の実装

## 分析結果

### 目的
ベッティング処理（betting.ts）において以下4点を満たすこと:
1. ベット・レイズ時の amount バリデーション（チップ超過・最低額未満の拒否）
2. レイズ可否判定に「コール額＋最低レイズ額を支払えるか」のチェック
3. last aggressor がオールインの場合でもベッティングラウンドが正しく終了する
4. `getValidActions` がベット/レイズに min/max 範囲を返す

### スコープ
- 変更対象: `src/domain/betting.ts`
- 関連型: `src/domain/types.ts` の `ValidAction`
- テスト: `src/domain/betting.test.ts`, `src/domain/betting-validation.test.ts`

### 実装アプローチ

**全サブタスク（1.1〜1.4）が既に実装・テスト済みであり、コード変更は不要。**

各サブタスクの判定根拠:

#### 1.1 amount バリデーション → 変更不要
- `betting.ts:77-78` — ベット額チップ超過時 throw
- `betting.ts:80-82` — ベット額 BIG_BLIND 未満（オールイン除く）時 throw
- `betting.ts:97-98` — レイズ額チップ超過時 throw
- `betting.ts:100-103` — レイズ額が最小レイズ未満（オールイン除く）時 throw
- テスト: `betting-validation.test.ts:257-438`（8ケース全パス）

#### 1.2 レイズ可否条件 → 変更不要
- `betting.ts:20-27` — `minRaiseTotal = currentBet + BIG_BLIND`, `minRaiseCost = minRaiseTotal - currentBetInRound` を算出し、`player.chips >= minRaiseCost` の場合のみ raise を有効アクションに追加
- テスト: `betting-validation.test.ts:22-141`（6ケース全パス）

#### 1.3 ラウンド終了判定（all-in aggressor） → 変更不要
- `betting.ts:125-140` の `isBettingRoundComplete` は3段階判定:
  1. `nonFolded.length <= 1` → true
  2. aggressor が `chips > 0` かつ `currentPlayerIndex === lastAggressorIndex` → true
  3. `nonFolded.every(p => p.chips === 0 || p.currentBetInRound >= currentBet)` → true
- aggressor がオールイン（chips=0）の場合、条件2はスキップされるが条件3がフォールバックとして機能し、全プレイヤーがベット一致またはオールインになれば終了する
- `getNextActivePlayerIndex` がオールインプレイヤーをスキップするため aggressor に currentPlayerIndex が到達しないが、条件3で有限回で終了が保証される
- テスト: `betting-validation.test.ts:440-555`（5ケース全パス、all-in aggressor シナリオ網羅）

#### 1.4 有効アクションの min/max 返却 → 変更不要
- `types.ts:39-43` — `ValidAction` 型に `min?: number`, `max?: number` 定義済み
- `betting.ts:14` — bet: `{ type: 'bet', min: BIG_BLIND, max: player.chips }`
- `betting.ts:25` — raise: `{ type: 'raise', min: minRaiseTotal, max: maxRaiseTotal }`
- fold/check/call には min/max なし
- テスト: `betting-validation.test.ts:143-255`（6ケース全パス）

**テスト実行結果:** 全47テストパス（betting.test.ts: 24件、betting-validation.test.ts: 23件）