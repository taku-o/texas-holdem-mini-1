Now I have a complete picture. Let me compile the review.

---

## AI Antipattern Review Report

**対象タスク**: タスク1（サブタスク1.1〜1.4）— ベッティングのバリデーションとラウンド終了・有効アクション返却の修正

**変更ファイル**: `src/domain/betting.ts`, `src/domain/types.ts`, `src/domain/gameEngine.ts`, `src/application/useGameController.ts`, `src/ui/ActionBar.tsx`, `src/ui/ActionBar.test.tsx`, `src/ui/GameScreen.tsx`, `src/ui/GameScreen.test.tsx`, `src/domain/betting-validation.test.ts`（新規）

---

### 判定: **REJECT**

---

### ブロッキング問題

#### `finding_id: AIR-001` | 状態: `new`

**ファイル**: `src/domain/betting.ts:38-44`
**問題**: `isTypeFeasible` バイパスはプロダクション到達不能な「念のため」コード

```typescript
if (!validActions.some((a) => a.type === action.type)) {
    const isTypeFeasible =
      (action.type === 'bet' && state.currentBet === 0) ||
      (action.type === 'raise' && state.currentBet > 0)
    if (!isTypeFeasible) {
      throw new Error(`Invalid action: ${action.type}`)
    }
  }
```

**詳細**:

1. **プロダクション到達不能**: `applyAction` の全プロダクション呼び出し元を確認した:
   - `gameFlow.ts:97` — CPU アクションは `decideAction` → `getValidActions` を経由
   - `gameFlow.ts:108` — 人間アクションは `ActionBar` → `getValidActions` 由来の `validActionTypes` でフィルタ済み
   
   いずれも `getValidActions` が返さないアクションタイプを `applyAction` に渡すことはない。このバイパスを通るプロダクションコードパスは存在しない。

2. **要件との不整合**: 要件1の受け入れ基準3は「当該プレイヤーが最低レイズ額を支払えるか（所持チップがコール額＋最低レイズ額以上か）をチェックし、**支払えない場合はレイズを有効にしない**」と明記している。`getValidActions` はこの要件を正しく実装しているが、`isTypeFeasible` バイパスがそれを覆している。

3. **スコープクリープ**: 「最低額を支払えない場合でもオールインなら許容する」というポーカールールは正しいが、今回の要件には含まれていない。AI が「ドメイン的に正しいから」と要件外の振る舞いを追加した典型パターン。

**修正案（2つの選択肢）**:

- **選択肢A（シンプル）**: `isTypeFeasible` バイパスを削除し、元の厳格なバリデーション（`validActions` に含まれないアクションは即 throw）に戻す。対応する `betting-validation.test.ts` のオールインテスト（行323-347、415-437）も削除する。

- **選択肢B（ドメイン正確性を維持）**: オールインを `getValidActions` に含める。例: `player.chips < BIG_BLIND` でも `player.chips > 0` なら `{ type: 'bet', min: player.chips, max: player.chips }` を返す。同様にレイズも最低レイズ額に満たないが call 以上のチップがある場合は `{ type: 'raise', min: currentBetInRound + chips, max: currentBetInRound + chips }` を返す。これにより `isTypeFeasible` バイパスは不要になり、UI/CPUも正しくオールインオプションを認識できる。

---

### 正常に実装されている部分

| サブタスク | 実装箇所 | 評価 |
|-----------|---------|------|
| 1.1 ベット/レイズの amount バリデーション | `betting.ts:77-82, 97-103` | ✅ チップ超過・最低額未満を正しく拒否。オールインは許容 |
| 1.2 レイズ可否判定 | `betting.ts:20-27` | ✅ `minRaiseCost` を計算し、支払えない場合は raise を除外 |
| 1.3 オールイン aggressor のラウンド終了判定 | `betting.ts:129-135` | ✅ aggressor が all-in の場合はフォールスルーで全員マッチを確認。無限ループを正しく解消 |
| 1.4 getValidActions の min/max 返却 | `betting.ts:14, 25` + `types.ts:39-43` | ✅ `ValidAction` 型を追加し、bet/raise に min/max を付与 |
| 型の伝播 | `gameEngine.ts`, `useGameController.ts`, `ActionBar.tsx`, `GameScreen.tsx` | ✅ `PlayerAction[]` → `ValidAction[]` の型変更が正しく伝播 |
| テスト | `betting-validation.test.ts` (23件) | ✅ バリデーション・可否判定・min/max・ラウンド終了を網羅的にテスト |

### 警告（非ブロッキング）

#### `Warning-001`: ActionBar の min/max 計算が getValidActions と不一致

**ファイル**: `src/ui/ActionBar.tsx:33-35`

```typescript
function getMinRaise(): number {
    return Math.min(currentBet * 2, playerChips + playerCurrentBetInRound)
}
```

`ActionBar` は `currentBet * 2` でレイズ最小額を計算しているが、ドメイン層（`betting.ts:21`）は `currentBet + BIG_BLIND` を使用している。`currentBet > BIG_BLIND` の場合に不整合が発生する（例: currentBet=20 なら ActionBar は40、ドメインは30）。

`ValidAction.min` がドメインから提供されるようになったため、タスク11.1（クライアント側バリデーション）の実装時にこれを利用し、`getMinRaise()` を `ValidAction.min` に置き換えるべき。現時点ではプロダクション動作への影響は限定的（スライダーの範囲が異なるだけ）。

#### `Warning-002`: cpuStrategy が ValidAction の min/max を未使用

**ファイル**: `src/domain/cpuStrategy.ts:84-85`（変更外ファイル — 記録のみ）

CPU は `getValidActions` の結果から `.type` のみを使い、`min/max` を無視して独自に `calculateBetAmount` で額を計算している。タスク5.1（CPUレイズ額の修正）の実装時に `ValidAction.min/max` を活用すべき。