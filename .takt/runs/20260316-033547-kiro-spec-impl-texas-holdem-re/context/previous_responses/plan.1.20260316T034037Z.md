全47テストがパス。タスク1の全サブタスクについて、コードとテストの突き合わせが完了しました。

---

## 計画レポート

### タスク概要

**タスク1: ベッティングのバリデーションとラウンド終了・有効アクション返却の修正**

4つのサブタスク（1.1〜1.4）すべてについて、**変更不要（既に実装済み）** と判定しました。

---

### 各サブタスクの判定と根拠

#### 1.1 ベット・レイズ時の amount バリデーション → **変更不要**

要件: `action.amount` がプレイヤー所持チップ以下であることを検証し、違反時はエラーを返す。レイズ額が最低レイズ額以上かつ有効範囲であることも検証する。

**現行実装の根拠:**
- `src/domain/betting.ts:77-78` — ベット額がチップ超過時に `throw new Error('Bet amount exceeds player chips')`
- `src/domain/betting.ts:80-82` — ベット額が BIG_BLIND 未満かつオールインでない場合に `throw new Error('Bet amount is below minimum')`
- `src/domain/betting.ts:97-98` — レイズ額がチップ超過時に `throw new Error('Raise amount exceeds player chips')`
- `src/domain/betting.ts:100-103` — レイズ額が最小レイズ（`currentBet + BIG_BLIND`）未満かつオールインでない場合に `throw new Error('Raise is below minimum')`
- **テスト:** `betting-validation.test.ts:257-438` に8テストケースが存在し、全パス

#### 1.2 レイズ可否条件（コール額＋最低レイズ額チェック） → **変更不要**

要件: レイズを選択可能とする条件に「コール額＋最低レイズ額を支払えるか」を追加する。

**現行実装の根拠:**
- `src/domain/betting.ts:20-27` — `getValidActions` にて:
  - `minRaiseTotal = state.currentBet + BIG_BLIND`（行21）
  - `minRaiseCost = minRaiseTotal - player.currentBetInRound`（行22）
  - `player.chips >= minRaiseCost` の場合のみ `raise` を追加（行23）
- これにより「コール額（currentBet - currentBetInRound）＋最低レイズ増分（BIG_BLIND）」を支払えない場合、raise は有効アクションに含まれない
- **テスト:** `betting-validation.test.ts:22-141` に6テストケースが存在し、全パス

#### 1.3 ベッティングラウンド終了判定（all-in aggressor対応） → **変更不要**

要件: last aggressor がオールインでアクティブでない場合でも正しく終了し、無限ループが発生しない。

**現行実装の根拠:**
- `src/domain/betting.ts:125-140` — `isBettingRoundComplete` の3段階判定:
  1. 行127: `nonFolded.length <= 1` → true（全員フォールド時）
  2. 行129-134: aggressor が `chips > 0` かつ `currentPlayerIndex === lastAggressorIndex` → true（通常の aggressor 到達）
  3. 行137-139: `nonFolded.every(p => p.chips === 0 || p.currentBetInRound >= state.currentBet)` → true（全員がベット一致またはオールイン）
- aggressor がオールイン（chips=0）の場合、条件2はスキップされるが、条件3が全アクティブプレイヤーのベット一致時に true を返す
- `getNextActivePlayerIndex`（行142-156）がオールインプレイヤーをスキップするため、`currentPlayerIndex` が aggressor に到達することはないが、条件3がフォールバックとして機能する
- **無限ループ防止:** gameFlow.ts の `processCpuTurnsAndPhases` は各ループで CPU がアクション（fold/call/raise）を実行するため、状態は必ず進行する。全プレイヤーがベット一致またはフォールドすれば条件3で終了する
- **テスト:** `betting-validation.test.ts:440-555` に5テストケースが存在し、全パス（all-in aggressor シナリオを網羅）

#### 1.4 有効アクション取得時の min/max 範囲返却 → **変更不要**

要件: `getValidActions` がベット/レイズに min/max 等の選択可能額範囲を含めて返す。

**現行実装の根拠:**
- `src/domain/types.ts:39-43` — `ValidAction` 型に `min?: number` と `max?: number` が定義済み
- `src/domain/betting.ts:14` — bet: `{ type: 'bet', min: BIG_BLIND, max: player.chips }`
- `src/domain/betting.ts:25` — raise: `{ type: 'raise', min: minRaiseTotal, max: maxRaiseTotal }`
- fold/check/call には min/max なし（undefined）
- **テスト:** `betting-validation.test.ts:143-255` に6テストケースが存在し、全パス

---

### 結論

**タスク1は全サブタスク（1.1〜1.4）が既に実装・テスト済みであり、コード変更は不要です。**

テストは全47件パスしており、要件の受け入れ基準をすべて満たしています。Coder への実装指示はありません。タスクを完了（チェック済み）としてマークすることを推奨します。