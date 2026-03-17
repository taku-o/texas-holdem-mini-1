# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 8` — タスク8「人間用アクションバーの実装」（サブタスク 8.1, 8.2, 8.3）

## 分析結果

### 目的
人間プレイヤーのターン時に、ルール上有効なアクション（Fold/Check/Call/Bet/Raise）を選択でき、Bet/Raise時にはチップ数を指定できるUIコンポーネント（ActionBar）を実装する。

### スコープ
- **新規ファイル**: `src/ui/ActionBar.tsx`, `src/ui/ActionBar.test.tsx`
- **既存ファイル変更**: なし（App.tsx / GameScreenへの統合はタスク9の範囲）

### 検討したアプローチ（設計判断がある場合）

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| ActionBar内でBet入力を含む単一コンポーネント | **採用** | 推定120-180行で300行制限内に収まる。分割するほどの複雑さがない |
| BetInputを別コンポーネントに分離 | 不採用 | 現時点では不要。ActionBarが200行を超える場合のみ検討 |
| ActionBar内で`getValidActions`を直接呼ぶ | 不採用 | UI層がdomain層に直接依存する。親から`validActions`をpropsで受け取る設計が正しい（`useGameController.ts:39-42`で既に計算済み） |

### 実装アプローチ

**ActionBarコンポーネント**

Props設計:
```typescript
type ActionBarProps = {
  validActions: PlayerAction[]
  playerChips: number
  currentBet: number
  playerCurrentBetInRound: number
  onAction: (action: PlayerAction) => void
  'data-testid'?: string
}
```

UI構成:
1. **アクションボタン行**: Fold / Check / Call / Bet / Raise の5ボタン
   - `validActions`配列に該当`type`が含まれるかで`disabled`を制御（要件6.3）
   - Call ボタンにはコール額（`currentBet - playerCurrentBetInRound`）を表示
2. **チップ数入力エリア**（Bet/Raiseボタン押下後に表示）:
   - スライダー（range input）: min〜max を制約
   - 数値入力欄: スライダーと双方向同期
   - クイックベットボタン: 「Min」「1/2 Pot」「Pot」「All-in」
   - 「確定」ボタンで`onAction({ type, amount })`を呼び出し
3. **金額制約**:
   - Bet: 最小 = `BIG_BLIND`(10)、最大 = `playerChips`
   - Raise: 最小 = `currentBet * 2`、最大 = `playerChips + playerCurrentBetInRound`
   - チップ不足でmin以上出せない場合 = オールイン（残チップ全額）

内部state:
- `selectedActionType: 'bet' | 'raise' | null` — チップ入力モードの状態
- `betAmount: number` — スライダー/入力欄の現在値

動作フロー:
- Fold/Check/Call → 即座に`onAction`呼び出し
- Bet/Raise → `selectedActionType`をセット → チップ入力エリア表示 → 確定で`onAction`呼び出し

## 実装ガイドライン

- **参照すべき既存パターン**:
  - Props型定義と`data-testid`サポート: `src/ui/PlayerSeat.tsx:4-9`
  - テスト記法（Given/When/Then + `@testing-library/react`）: `src/ui/PlayerSeat.test.tsx`
  - テストヘルパー: `src/domain/testHelpers.ts` の `createTestPlayer`, `createTestState`
  - ベット金額のBIG_BLIND単位アラインメント: `src/domain/cpuStrategy.ts:74`
- **配線が必要な箇所**: このタスクでは新規ファイルのみ。`useGameController`（`src/application/useGameController.ts:44`）が返す`validActions`, `handleAction`, `isHumanTurn`, `gameState`は既に公開済みで、タスク9のGameScreen統合時にActionBarへ渡す
- **アンチパターン注意**:
  - ActionBar内にゲームルール判定ロジックを書かない（有効アクション判定はdomain層`getValidActions`の責務）
  - `onAction`にamountなしのbet/raiseを送信しない（`betting.ts:62-63`で例外発生）
  - ActionBar内でGameStateを直接参照しない（必要な値はpropsで受け取る）

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| App.tsx / GameScreenへのActionBar統合 | タスク9（9.1）の範囲 |
| ActionBarの表示/非表示制御（`isHumanTurn`判定） | 親コンポーネント（GameScreen）の責務、タスク9で実装 |
| CPUアクション表示 | タスク7で実装済み（PlayerSeatのスタイリング） |