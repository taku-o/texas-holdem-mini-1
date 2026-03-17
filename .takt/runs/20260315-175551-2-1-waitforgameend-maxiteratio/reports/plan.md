# タスク計画

## 元の要求
レビュー指摘事項2件の修正:
1. `waitForGameEnd` の maxIterations 到達時にエラーをスローする
2. `debug_game3.ts` のロガー内での冗長な `getValidActions()` 呼び出しを除去する

## 分析結果

### 目的
テストヘルパーの信頼性向上（サイレント失敗の防止）と、デバッグスクリプトの冗長な関数呼び出しの除去。

### スコープ
小規模タスク（3ファイルの単純修正、設計判断不要）

| 変更ファイル | 変更内容 |
|---|---|
| `src/application/useGameController.test.ts` | `waitForGameEnd` にmaxIterations到達時のエラースロー追加 |
| `debug_common.ts` | `ActionLogger` 型に `actions` パラメータ追加、`logger` 呼び出し時に `actions` を渡す |
| `debug_game3.ts` | ロガーで引数から `actions` を受け取り、`getValidActions` のimportと直接呼び出しを削除 |

### 実装アプローチ

#### 修正1: `waitForGameEnd` のmaxIterations到達時エラースロー

**対象:** `src/application/useGameController.test.ts` 9-21行目

whileループ終了後（21行目の `}` の後）に以下を追加:
```typescript
if (iterations >= maxIterations) {
  throw new Error(`waitForGameEnd did not reach idle phase within ${maxIterations} iterations`)
}
```

- `waitForGameEnd` は同ファイル内で5箇所から呼ばれている（290, 307, 321, 388, 487行目）
- すべて正常にゲーム終了に到達するシナリオであり、既存テストへの影響はない

#### 修正2: `debug_game3.ts` のロガー内冗長な `getValidActions()` 除去

**ステップ1: `debug_common.ts` の `ActionLogger` 型拡張（11-15行目）**
```typescript
export type ActionLogger = (
  state: GameState,
  playerIdx: number,
  action: PlayerAction,
  actions: PlayerAction[],
) => void
```

**ステップ2: `debug_common.ts` の `executeBettingRound` 内 logger 呼び出し変更（30行目）**
```typescript
if (logger) logger(current, playerIdx, action, actions)
```
※ `actions` は27行目で既に `getValidActions(current, playerIdx)` として取得済み

**ステップ3: `debug_game3.ts` のロガー修正（30-35行目）**
```typescript
const logger: ActionLogger = (state, playerIdx, action, actions) => {
  const player = state.players[playerIdx]
  console.log(`\nTurn: player-${playerIdx}(${player.isHuman?'H':'C'}) chips=${player.chips}, actions=[${actions.map(a=>a.type).join(',')}]`)
  console.log(`  -> ${action.type}`)
}
```

**ステップ4: `debug_game3.ts` の不要import削除（2行目）**
`import { getValidActions } from './src/domain/betting'` を削除

**影響範囲の確認結果:**
- `debug_common.test.ts:84` にもロガーの定義があるが、TypeScriptでは関数の引数を少なく受け取ることは型安全（余剰引数は無視される）のため、変更不要

### 参照すべき既存実装パターン
- `executeBettingRound` の `actions` 取得: `debug_common.ts:27`
- `ActionLogger` 型定義: `debug_common.ts:11-15`

### 注意すべきアンチパターン
- 修正1: エラーメッセージに `maxIterations` の値を含めること（デバッグ容易性の確保）
- 修正2: `debug_game3.ts` の `getValidActions` import削除を忘れないこと（未使用importの残留防止）