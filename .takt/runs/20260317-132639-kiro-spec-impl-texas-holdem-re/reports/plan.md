# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes-2 2` — ActionBar の数値入力 UX 改善（タスク 2.1 + 2.2）

## 分析結果

### 目的
`ActionBar.tsx` の `<input type="number">` でユーザーが手入力した値が `min`/`max` を超えてもフィールドに残り続ける UX 上の問題を修正する。入力値を即座にレンジ内にクリップし、表示と内部状態が常に一致する状態にする。

### スコープ
- **変更対象**: `src/ui/ActionBar.tsx`（1ファイル）
- **テスト対象**: `src/ui/ActionBar.test.tsx`（1ファイル）
- **影響なし**: Domain 層（`ValidAction` 型、`getValidActions`）、Application 層（`useGameController`）への変更は不要。`ChipInput` コンポーネントの props 型・内部実装も変更不要

### 実装アプローチ

#### 2.1: クリップ処理の追加（`src/ui/ActionBar.tsx`）

**現状の問題**: L106 で `onChipAmountChange={setChipAmount}` と `setChipAmount` を直接渡しているため、`ChipInput` 内の `onChange`（L149, L158）で受け取った生の値がそのまま state に設定される。

**変更内容**:

1. `ActionBar` コンポーネント内にクリップ処理を行う関数を追加する:

```typescript
function handleChipAmountChange(rawValue: number) {
  if (!chipInputMode) return
  const action = findRangeAction(chipInputMode)
  if (!action) return
  const clipped = Math.min(Math.max(rawValue, action.min), action.max)
  setChipAmount(clipped)
}
```

2. L106 の `onChipAmountChange={setChipAmount}` を `onChipAmountChange={handleChipAmountChange}` に差し替える。

**影響の整理**:
- `ChipInput` コンポーネントは変更不要（`onChipAmountChange: (amount: number) => void` の型は不変）
- スライダー (`type="range"`) は HTML 仕様上すでに `min`/`max` 範囲内の値しか返さないため、クリップは実質的に数値入力のみに影響
- クリップにより `chipAmount` は常にレンジ内になるため、`isChipAmountValid()` は常に `true` を返すようになり、Confirm ボタンは常に有効になる。これは design.md L76 の意図どおり

#### 2.2: テスト追加・修正（`src/ui/ActionBar.test.tsx`）

**新規テストケース**（新しい `describe` ブロックを追加）:

1. 数値入力で `min` 未満の値（例: `0`）を入力 → `chipAmount` が `min`（`BIG_BLIND=10`）にクリップされる
2. 数値入力で `max` 超過の値（例: `600`）を入力 → `chipAmount` が `max`（`500`）にクリップされる
3. 範囲内の値（例: `200`）を入力 → そのまま反映される
4. クリップ後の値で Confirm ボタンが有効であることを確認
5. raise モードでも同様にクリップされる（`min=30, max=510` で `10` を入力 → `30` にクリップ）

**既存テストの修正が必要な箇所**:

| テスト（行） | 現在の期待 | 修正後の期待 | 理由 |
|-------------|-----------|-------------|------|
| L434-451「should disable confirm button when chipAmount is below min」 | Confirm 無効 | 値が `min` にクリップされ Confirm 有効 | クリップにより範囲外の値が state に入らなくなるため |
| L453-470「should disable confirm button when chipAmount exceeds max」 | Confirm 無効 | 値が `max` にクリップされ Confirm 有効 | 同上 |
| L510-528「should not call onAction when confirm is clicked with invalid chipAmount」 | `onAction` が呼ばれない | クリップ後の有効な値で `onAction` が呼ばれる | 同上 |
| L530-547「should disable confirm button when raise chipAmount is below min」 | Confirm 無効 | 値が `min` にクリップされ Confirm 有効 | 同上 |

## 実装ガイドライン

- **参照すべき既存パターン**: `handleAllIn()`（`src/ui/ActionBar.tsx:69-75`）が `findRangeAction(chipInputMode)` で `min`/`max` を取得するパターンの参考になる
- **配線箇所**: `src/ui/ActionBar.tsx:106` の `onChipAmountChange` の引数を差し替えるのみ
- **クリップ処理の実装場所**: `ActionBar` コンポーネント内に関数として定義する。`ChipInput` 内部にクリップ処理を置かない（`ChipInput` はプレゼンテーション専用の責務）
- **`onBlur` 方式は不採用**: `onChange` で即座にクリップすることで、表示と内部状態が常に一致する。`onBlur` だとフォーカスが外れるまで範囲外の値が表示に残り、UX 指摘の解消にならない
- **既存テスト修正時の注意**: テストの意図（「範囲外入力でもシステムが安全に動作する」）は維持しつつ、期待される振る舞いを「Confirm 無効化」から「値がクリップされて Confirm 有効」に変更する