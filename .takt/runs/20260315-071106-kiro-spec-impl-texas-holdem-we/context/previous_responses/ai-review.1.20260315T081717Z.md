---

## AI Antipattern Review 結果

**判定: REJECT**

---

### ブロッキング問題

#### `[AIR-001]` 未使用インポート — `gameFlow.test.ts:5-8` (new)

**問題:** `applyAction`, `isBettingRoundComplete`, `advancePhase`, `preparePreflopRound` がインポートされているが、テストファイル内で一度も使用されていない。AIがテスト修正時にアサーション方式を変更したが、不要になったインポートの削除を忘れた典型的なパターン。

**該当箇所:**
```typescript
// gameFlow.test.ts:5-8
import {
  applyAction,
  isBettingRoundComplete,
} from '../domain/betting'
import { advancePhase, preparePreflopRound } from '../domain/handProgression'
```

**修正案:** これら4つのインポートを削除する。

---

#### `[AIR-002]` 説明コメント（What/Howコメント）— `gameFlow.ts:71-72` (new)

**問題:** 関数名 `canAnyoneStillBet` が既に意味を伝えているのに、その条件が何を意味するかをWhatコメントで繰り返している。ポリシーにより説明コメントはREJECT対象。

**該当箇所:**
```typescript
// gameFlow.ts:71-72
    // 非フォールドプレイヤーが全員all-in、または
    // アクション可能なプレイヤーが1人以下の場合はショーダウンまでスキップ
    if (!canAnyoneStillBet(current)) {
```

**修正案:** コメントを削除する。関数名で意図は十分伝わっている。

---

### 警告（非ブロッキング）

#### `[AIR-W01]` 非nullアサーション `!` — `gameFlow.ts:34` (Warning)

**問題:** `gameOverCheck.reason!` で非nullアサーションを使用している。`isGameOver` の実装を見ると `over: true` の時は必ず `reason` が設定されるため実行時に問題は起きないが、型レベルの安全性が欠けている。

**該当箇所:**
```typescript
// gameFlow.ts:34
    return finishAsGameOver(state, gameOverCheck.reason!)
```

**改善案:** `isGameOver` の戻り値型を判別共用体（discriminated union）に変更するか、`reason ?? ''` ではなく `reason` が undefined の場合にエラーを投げるガード節を入れる。ただし `isGameOver` の型変更はこのタスクのスコープを超える可能性がある。

#### `[AIR-W02]` MAX_CPU_ITERATIONS到達時のサイレント終了 — `gameFlow.ts:100-102` (Warning)

**問題:** `processCpuTurnsAndPhases` のメインループが `MAX_CPU_ITERATIONS` (500) に到達した場合、エラーも警告も出さず現在の状態をそのまま返す。これはバグによる無限ループを検知しにくくする。

**該当箇所:**
```typescript
// gameFlow.ts:100-102
  }

  return current
}
```

**改善案:** 到達した場合に `console.warn` またはエラーを投げることを検討する。ただし安全ガードとしての意図は理解できるため、Warning扱いとする。

---

### 確認済み・問題なし

| 観点 | 結果 |
|------|------|
| 幻覚API・存在しないメソッド | ✅ 全インポート（`applyAction`, `isBettingRoundComplete`, `advancePhase`, `startNextHand`, `isGameOver`, `evaluateShowdown`, `resolveUncontestedPot`, `decideAction`）は実在し、シグネチャも正しい |
| オブジェクト直接変更 | ✅ `{ ...state, ... }` でスプレッドによる新オブジェクト生成。直接変更なし |
| `any` 型 | ✅ なし |
| フォールバック濫用 | ✅ なし（`??` や `\|\|` の不適切な使用なし） |
| スコープクリープ | ✅ `gameOverReason` フィールド追加はゲーム終了判定に必要。過剰な抽象化なし |
| スコープ縮小 | ✅ タスク6の要件（6.2: 人間アクション処理、6.3: CPU自動進行）を網羅 |
| コードベースパターンとの整合性 | ✅ 既存の `domain/` パターン（純粋関数 + イミュータブル状態）に準拠 |
| エラーの握りつぶし | ✅ なし |
| TODO / デッドコード | ✅ なし（本体に未使用コードなし） |
| DRY違反 | ✅ `resolveAndCheckGameOver` で共通処理を適切に抽出 |
| チップ保存則テスト | ✅ テストで検証済み |
| テストカバレッジ | ✅ 19テストで主要パスを網羅 |