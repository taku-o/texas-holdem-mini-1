Now I have a thorough understanding of the codebase. Let me finalize my review.

---

## AI Antipattern Review — `ActionBar` (Task 8)

### 対象ファイル
| ファイル | 状態 |
|---------|------|
| `src/ui/ActionBar.tsx` | 新規作成 |
| `src/ui/ActionBar.test.tsx` | 新規作成 |
| `src/test-setup.ts` | 新規作成 |
| `vite.config.ts` | 変更（setupFiles追加） |
| `package.json` | 変更（@testing-library/jest-dom追加） |

---

### レビュー結果: **APPROVE** ✅

ブロッキング問題は検出されなかった。

---

### 検証項目と結果

#### 1. 仮定の検証

| 確認項目 | 結果 |
|---------|------|
| 要件（8.1, 8.2, 8.3）との一致 | ✅ 5アクションのボタン表示、bet/raise時のチップ入力（スライダー+数値入力+All-inクイックベット）、validActionsによる有効/無効制御がすべて実装されている |
| ドメイン型との整合 | ✅ `ActionType`, `PlayerAction` を `../domain/types` から正しくインポート。`BIG_BLIND` を `../domain/constants` から使用 |
| 既存コンポーネントパターンとの一致 | ✅ `export type XxxProps` + `export function Xxx` のパターンは `CardView`, `TableView`, `PlayerSeat`, `PlayerSeats` と同一 |

#### 2. 幻覚API・存在しないメソッドの検出

- ✅ 使用しているReact API（`useState`）は標準。HTMLの `disabled` 属性、`input type="range"`, `input type="number"` もすべて標準DOM。
- ✅ `@testing-library/jest-dom` のインポートパス `@testing-library/jest-dom/vitest` は正しいvitest用エントリポイント。
- ✅ `vite.config.ts` の `setupFiles` 設定はvitest標準設定。

#### 3. スコープクリープ / 過剰エンジニアリングの検出

- ✅ 過剰な抽象化なし。`ChipInput` を内部コンポーネントとして分離しているのは適切な責務分割。
- ✅ 不要なLegacy対応やフォールバックマッピングなし。
- ✅ 不要なインターフェースや将来の拡張用コードなし。

#### 4. スコープ縮小（タスク要件の取りこぼし）の検出

- ✅ Task 8.1: 5つのアクションボタン表示 → 実装済み
- ✅ Task 8.2: スライダー・数値入力・クイックベット(All-in) → 実装済み
- ✅ Task 8.3: validActionsに基づく有効/無効制御 → `disabled` 属性で実装済み
- ✅ 配線（ActionBarの親への統合）はTask 9の範囲であり、現タスクのスコープ外。grep確認済み。

#### 5. フォールバック・デフォルト引数の濫用検出

- ✅ `??` 演算子なし。デフォルト引数なし。空のcatchなし。
- ✅ betのデフォルト額 `Math.min(BIG_BLIND, playerChips)` はチップ不足時のall-inを正しく処理（playerChips < BIG_BLIND の場合にplayerChipsになる）。
- ✅ raiseのデフォルト額 `Math.min(currentBet * 2, playerChips + playerCurrentBetInRound)` も同様に正しい。

#### 6. 未使用コード / デッドコードの検出

- ✅ すべてのimportが使用されている。
- ✅ `ChipInput` コンポーネントはActionBar内で使用されている。未エクスポートは意図的（内部コンポーネント）。
- ✅ `handleButtonClick`, `handleConfirm`, `handleCancel`, `handleAllIn`, `getSliderProps` はすべてJSXから参照されている。

#### 7. コピペパターン / DRY違反の検出

- ✅ スライダーと数値入力の `onChange` ハンドラが同一コード（`onChipAmountChange(Number(e.target.value))`）だが、異なるDOM要素への適用であり、関数抽出は過剰。

#### 8. コンテキスト適合性

- ✅ 命名規則: PascalCaseコンポーネント名、camelCase関数名、UPPER_SNAKE_CASE定数は既存パターンと一致。
- ✅ ファイル構造: `src/ui/` ディレクトリ内に配置。
- ✅ テストスタイル: `describe/test` パターン、`vi.fn()` モック、`renderXxx` ヘルパー関数は既存テストと整合。

---

### Warning（非ブロッキング）

#### W-1: `IMMEDIATE_ACTIONS` と `CHIP_INPUT_ACTIONS` のカテゴリ分類が未活用

**ファイル:** `src/ui/ActionBar.tsx:13-15`

```typescript
const IMMEDIATE_ACTIONS: ActionType[] = ['fold', 'check', 'call']
const CHIP_INPUT_ACTIONS: ActionType[] = ['bet', 'raise']
const ALL_ACTION_TYPES: ActionType[] = [...IMMEDIATE_ACTIONS, ...CHIP_INPUT_ACTIONS]
```

このカテゴリ分類は `handleButtonClick` のロジックで使われていない。`handleButtonClick` は `'bet'`, `'raise'` を文字列リテラルで直接比較している（29-47行目）。カテゴリ分類が意味を持つなら `CHIP_INPUT_ACTIONS.includes(actionType)` のように使うべきだが、現状は `ALL_ACTION_TYPES` 構築のためだけに存在している。

**推奨:** 以下のいずれかに統一
- (a) フラット配列に簡素化: `const ALL_ACTION_TYPES: ActionType[] = ['fold', 'check', 'call', 'bet', 'raise']`
- (b) カテゴリをロジックでも使用: `if (CHIP_INPUT_ACTIONS.includes(actionType))` で分岐

#### W-2: Tailwind CSSクラスの欠如

**ファイル:** `src/ui/ActionBar.tsx` 全体

他のUIコンポーネント（`PlayerSeat.tsx`, `CardView.tsx`, `TableView.tsx`）はすべてTailwind CSSクラスでスタイリングされているが、ActionBarは素のHTML要素のみ。Task 9の統合時にスタイリングが追加される可能性があるが、既存パターンとの軽微な不一致として記録。