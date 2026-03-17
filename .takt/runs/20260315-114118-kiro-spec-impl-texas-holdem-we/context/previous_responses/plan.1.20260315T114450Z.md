十分な情報が集まりました。計画をまとめます。

---

## 計画レポート: タスク8「人間用アクションバーの実装」

### タスク概要

タスク8は3つのサブタスクで構成される:
- **8.1**: 人間のターン時のみ、チェック・ベット・コール・レイズ・フォールドを選択できるUIを表示する（要件6.1）
- **8.2**: ベット・レイズ選択時にチップ数を指定する手段を提供する（要件6.2）
- **8.3**: ルール上選択可能なアクションのみを有効にし、選択できないアクションは無効化する（要件6.3）

### 要件ごとの変更要否

| 要件 | 判定 | 根拠 |
|------|------|------|
| 6.1 人間ターン時のアクションUI表示 | **変更要** | ActionBarコンポーネントが未実装。`src/ui/` に該当ファイルなし |
| 6.2 ベット/レイズ時のチップ数指定手段 | **変更要** | 同上。チップ数入力UIが未実装 |
| 6.3 有効アクションのみ有効化 | **変更要** | 同上。`useGameController.ts:39-42` で `validActions` は既に計算済みだが、それを消費するUIがない |

### 既存基盤の確認

ActionBar実装に必要なインフラは全て揃っている:

1. **`useGameController`** (`src/application/useGameController.ts:7-13`): `validActions: PlayerAction[]`, `isHumanTurn: boolean`, `handleAction: (action: PlayerAction) => void` を既に公開
2. **`getValidActions`** (`src/domain/betting.ts:3-23`): fold/check/call/bet/raise の有効判定済み
3. **`applyAction`** (`src/domain/betting.ts:25-98`): bet/raise は `amount` 必須、call/check/fold は不要
4. **`BIG_BLIND = 10`** (`src/domain/constants.ts:9`): 最小ベット単位として利用可能
5. **テストヘルパー** (`src/domain/testHelpers.ts`): `createTestPlayer`, `createTestState` が既に存在

### 設計

#### 新規ファイル

| ファイル | 責務 | 推定行数 |
|---------|------|---------|
| `src/ui/ActionBar.tsx` | アクションボタン群 + ベット/レイズ時のチップ数入力UI | 120-180行 |
| `src/ui/ActionBar.test.tsx` | ActionBarのユニットテスト | 150-250行 |

#### ActionBar コンポーネント設計

**Props:**

```typescript
type ActionBarProps = {
  validActions: PlayerAction[]
  playerChips: number
  currentBet: number
  playerCurrentBetInRound: number
  onAction: (action: PlayerAction) => void
}
```

**UI構成:**
1. **アクションボタン行**: Fold / Check / Call / Bet / Raise の5つ。`validActions` に含まれる type のみ `disabled={false}`、それ以外は `disabled={true}`
2. **チップ数入力エリア**（Bet/Raise選択時のみ表示）:
   - スライダー（range input）: 最小値〜最大値（プレイヤーの残チップ）
   - 数値入力欄（number input）: スライダーと同期
   - クイックベットボタン: 1/2 Pot, Pot, All-in などのプリセット
   - 確定ボタン

**ベット/レイズの金額制約:**
- **Bet**: 最小 = `BIG_BLIND`、最大 = `playerChips`
- **Raise**: 最小 = `currentBet * 2`（標準ルール）、最大 = `playerChips + playerCurrentBetInRound`（トータル額）
- チップ不足時はオールイン（残チップ全額）を許容（`applyAction` で `Math.min` 処理済み: `betting.ts:51-53`）
- 金額は `BIG_BLIND` 単位に揃える（CPU戦略の `calculateBetAmount` パターン: `cpuStrategy.ts:74` 参照）

**状態管理:**
- ActionBar内部で `selectedActionType` と `betAmount` をローカルstate管理
- Bet/Raiseボタン押下 → チップ入力モード表示 → 確定で `onAction` 呼び出し
- Fold/Check/Call は即座に `onAction` 呼び出し

**表示/非表示:**
- ActionBar自体の表示制御は親コンポーネント（将来のGameScreen）が `isHumanTurn` で制御する。ActionBarは渡されたら常にレンダリングする

#### 既存ファイルの変更

**なし** — タスク8はActionBarコンポーネントの実装のみ。App.tsx（GameScreen統合）はタスク9の範囲。

### Coder向け実装ガイドライン

#### 参照すべき既存実装パターン

1. **UIコンポーネントのprops設計**: `src/ui/PlayerSeat.tsx:4-9` — 型エイリアスで props を定義し、`data-testid` もサポート
2. **テストパターン**: `src/ui/PlayerSeat.test.tsx` — `@testing-library/react` の `render`, `screen` を使用。Given/When/Then コメント付き
3. **テストヘルパーの使い方**: `src/domain/testHelpers.ts:9-19` — `createTestPlayer()`, `createTestState()` を活用
4. **ベット金額計算パターン**: `src/domain/cpuStrategy.ts:67-76` — `BIG_BLIND` 単位のアラインメント
5. **`getValidActions` の返却形式**: `src/domain/betting.ts:3-23` — `PlayerAction[]` で `type` のみ（`amount` なし）。ActionBarは `type` の存在で有効/無効を判定する

#### 変更の影響範囲

- 新規ファイル2つ（ActionBar.tsx, ActionBar.test.tsx）のみ
- 既存ファイルへの変更なし
- `PlayerAction` 型（`src/domain/types.ts:34-37`）と `BIG_BLIND` 定数（`src/domain/constants.ts:9`）を import する

#### 注意すべきアンチパターン

1. **ActionBar内にゲームルール判定を書かない**: 有効アクションの判定は `getValidActions`（domain層）が担う。ActionBarは渡された `validActions` を表示するだけ
2. **金額の検証をActionBarでも行わない**: `applyAction` が検証する。ActionBarはUI制約（min/max）で無効な値の送信を防ぐのみ
3. **`onAction` に `amount` なしの bet/raise を送信しない**: `applyAction` が `throw new Error('Bet action requires amount')` する（`betting.ts:62-63`）。Bet/Raise時は必ず `amount` を含める
4. **1ファイル300行超の禁止**: ActionBarが大きくなる場合、チップ入力部分を `BetInput.tsx` に分離を検討（ただし180行以内に収まるなら分割不要）