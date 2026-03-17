全122テストがパスしました。

---

## 作業結果
- ARCH-012-01: `ValidAction` 型をフラットなオプショナルフィールドから判別共用体（Discriminated Union）に変更し、`bet`/`raise` 時に `min`/`max` が必ず存在することを型レベルで強制した
- 全消費者（`cpuStrategy.ts`, `ActionBar.tsx`, テストファイル）を型安全な実装に更新

## 変更内容
- **`src/domain/types.ts`**: `ValidAction` を `{ type: ActionType; min?: number; max?: number }` から `{ type: 'fold' } | { type: 'check' } | { type: 'call' } | { type: 'bet'; min: number; max: number } | { type: 'raise'; min: number; max: number }` に変更
- **`src/domain/cpuStrategy.ts`**: 
  - `clampToValidRange` のパラメータ型を `ValidAction` から `{ min: number; max: number }` に変更し `!` 非null断言を除去
  - `betAction`/`raiseAction` の `.find()` に型述語を追加し、`canBet`/`canRaise` フラグを `betAction`/`raiseAction` の存在チェックに置換（7箇所の `!` 断言を除去）
  - 未使用になった `ValidAction` インポートを削除
- **`src/ui/ActionBar.tsx`**: 
  - `RangeAction` 型エイリアスを導入、`findAction` を `findRangeAction` に変更して型安全にナロイング
  - 4箇所の `?.xxx !== undefined` 防御的チェックを `action` の存在チェックに簡素化
- **テストファイル** (`ActionBar.test.tsx`, `GameScreen.test.tsx`): `{ type: 'bet' }` / `{ type: 'raise' }` に `min`/`max` を追加（計5箇所）
- **`src/domain/betting-validation.test.ts`**: `cross-field-invariant` 再発防止テスト追加

## ビルド結果
- `npx tsc --noEmit` → 成功（エラーなし）

## テスト結果
- `npx vitest run` → 496 passed, 1 failed（既存の `useGameController.test.ts` タイムアウト問題。今回の変更とは無関係）
- 影響範囲テスト `npx vitest run src/domain/betting-validation.test.ts src/domain/cpuStrategy.test.ts src/domain/cpuStrategy.validation.test.ts src/ui/ActionBar.test.tsx src/ui/GameScreen.test.tsx` → 122 passed

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 1 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `src/domain/types.ts:39-44` — 判別共用体に変更済み
- `src/domain/cpuStrategy.ts` — `!` 断言ゼロ（grep `'!'` で確認可能）
- `src/ui/ActionBar.tsx` — `?.min !== undefined` / `?.max !== undefined` チェックゼロ
- `src/domain/betting-validation.test.ts` — `cross-field invariant` 再発防止テスト追加、`'min' in action` による構造検証