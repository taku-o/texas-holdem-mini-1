調査完了。計画をまとめます。

## 計画レポート

### タスク概要
`debug_common.test.ts` の2箇所のインライン `reduce` パターンを既存の `calcTotalChips` ヘルパーに置き換える、小規模なDRY改善タスク。

### 調査結果

**対象ファイル:** `debug_common.test.ts`

**変更1（32行目）:** 確認済み
```typescript
state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot
```
→ `calcTotalChips(state)` と同一ロジック。置換対象。

**変更2（39行目）:** 確認済み
```typescript
result.players.reduce((sum, p) => sum + p.chips, 0) + result.pot
```
→ `calcTotalChips(result)` と同一ロジック。置換対象。

**`calcTotalChips` の定義（`src/domain/testHelpers.ts:9`）:** 確認済み
```typescript
export function calcTotalChips(state: GameState): number {
  return state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot
}
```
完全に同一のロジック。既にエクスポートされている。

**置換対象外の確認（126行目・136行目・142行目）:** 確認済み。これらは `+ state.pot` を含まないチップのみの合計であり、`calcTotalChips` とは異なるロジック。置換しない。

### 実装ガイドライン（Coder向け）

#### 変更ファイル
- `debug_common.test.ts`（1ファイルのみ）

#### 手順

1. **import追加（1行目付近）:**
   既存importブロックの後に追加:
   ```typescript
   import { calcTotalChips } from './src/domain/testHelpers'
   ```

2. **32行目の置換:**
   ```typescript
   // Before (31-32行目):
   const initialTotal =
     state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot
   
   // After:
   const initialTotal = calcTotalChips(state)
   ```

3. **39行目の置換:**
   ```typescript
   // Before (38-39行目):
   const resultTotal =
     result.players.reduce((sum, p) => sum + p.chips, 0) + result.pot
   
   // After:
   const resultTotal = calcTotalChips(result)
   ```

#### 参照すべき既存パターン
- `src/domain/testHelpers.ts:9` — `calcTotalChips` の定義

#### 影響範囲
- `debug_common.test.ts` のみ。ロジック変更なし（同一関数への置換）。

#### 確認方法
- 既存テストが全てパスすること（`vitest` 実行）

#### 注意事項
- 126行目・136行目・142行目の `reduce` パターンは `+ state.pot` を含まないため置換しないこと
- `INITIAL_CHIPS` や `PLAYER_COUNT` のimportは既存のまま維持（他テストで使用中）