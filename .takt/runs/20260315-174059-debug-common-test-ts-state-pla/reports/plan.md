# タスク計画

## 元の要求
`debug_common.test.ts` のインライン `state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot` パターン（2箇所）を、既存の `calcTotalChips` ヘルパーに置き換える。

## 分析結果

### 目的
テストファイル内のインライン `reduce` パターンを既存ヘルパー関数 `calcTotalChips` に置き換え、DRY原則に従ったコードにする。

### スコープ
- 変更ファイル: `debug_common.test.ts`（1ファイルのみ）
- 変更箇所: import追加1箇所、インライン式の置換2箇所
- ロジック変更なし（同一ロジックの関数呼び出しへの置換）

### 実装アプローチ

**1. import追加（1行目付近）**

既存importブロックの後に以下を追加:
```typescript
import { calcTotalChips } from './src/domain/testHelpers'
```

**2. 32行目の置換**
```typescript
// Before (31-32行目):
const initialTotal =
  state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot

// After:
const initialTotal = calcTotalChips(state)
```

**3. 39行目の置換**
```typescript
// Before (38-39行目):
const resultTotal =
  result.players.reduce((sum, p) => sum + p.chips, 0) + result.pot

// After:
const resultTotal = calcTotalChips(result)
```

**参照すべき既存実装:**
- `src/domain/testHelpers.ts:9` — `calcTotalChips` の定義（`export function calcTotalChips(state: GameState): number`）

**注意事項:**
- 126行目・136行目・142行目の `reduce` パターンは `+ state.pot` を含まず `calcTotalChips` とは異なるロジックのため、置換対象外
- 既存のimport（`INITIAL_CHIPS`, `PLAYER_COUNT` 等）はそのまま維持

**確認方法:**
- 既存テストが全てパスすること