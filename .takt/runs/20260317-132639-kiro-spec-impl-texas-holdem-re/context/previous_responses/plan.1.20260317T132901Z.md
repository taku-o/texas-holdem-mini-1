調査は完了しました。タスク2の内容と現在の実装を把握できたので、計画をまとめます。

---

## 計画レポート

### タスク概要

**タスク2: ActionBar の数値入力 UX 改善**（サブタスク 2.1 + 2.2）

`ActionBar.tsx` の `<input type="number">` でユーザーが手入力した値が `min`/`max` を超えても制約されない UX 上の問題を修正する。現状は `isChipAmountValid()` による Confirm ボタン無効化で送信はブロックされているが、入力フィールド自体には範囲外の値が残り続ける。

### 要件の変更要/不要判定

| 要件 | 判定 | 根拠 |
|------|------|------|
| 2.1: 数値入力ロジックにクリップ処理を追加 | **変更要** | `src/ui/ActionBar.tsx:158` で `onChipAmountChange(Number(e.target.value))` を直接呼んでおり、`min`/`max` によるクリップが行われていない |
| 2.2: テスト追加 | **変更要** | `src/ui/ActionBar.test.tsx` の既存テスト（L446, L464）は範囲外入力時に Confirm ボタンが無効になることを確認しているが、**値がクリップされること**のテストは存在しない |

### 影響範囲

- **変更対象ファイル**: `src/ui/ActionBar.tsx`（1ファイルのみ）
- **テスト対象ファイル**: `src/ui/ActionBar.test.tsx`（1ファイルのみ）
- **影響なし**: Domain 層（`ValidAction` 型、`getValidActions`）、Application 層（`useGameController`）への変更は不要

### 実装アプローチ

#### 2.1: クリップ処理の追加

**変更箇所**: `src/ui/ActionBar.tsx`

**方針**: `onChipAmountChange` に `setChipAmount` を直接渡す代わりに、クリップ処理を行う関数を渡す。

**具体的な変更**:

1. `ActionBar` コンポーネント内に、`chipInputMode` に基づいてクリップ処理を行う関数を追加する:

```typescript
function handleChipAmountChange(rawValue: number) {
  if (!chipInputMode) return
  const action = findRangeAction(chipInputMode)
  if (!action) return
  const clipped = Math.min(Math.max(rawValue, action.min), action.max)
  setChipAmount(clipped)
}
```

2. `ChipInput` の `onChipAmountChange` に `setChipAmount` の代わりに `handleChipAmountChange` を渡す（L106）:

```typescript
// 変更前
onChipAmountChange={setChipAmount}
// 変更後
onChipAmountChange={handleChipAmountChange}
```

**影響**: 
- `ChipInput` コンポーネント自体は変更不要（`onChipAmountChange` の型 `(amount: number) => void` は変わらない）
- スライダー (`type="range"`) は HTML 仕様上すでに `min`/`max` 範囲内の値しか返さないため、クリップは実質的に数値入力のみに影響する
- 既存の `isChipAmountValid()` は常に `true` を返すようになるため、Confirm ボタンは常に有効になる。これは設計ドキュメント（design.md L76）の意図どおり

#### 2.2: テスト追加

**変更箇所**: `src/ui/ActionBar.test.tsx`

**追加するテストケース**（新しい `describe` ブロックを追加）:

1. **数値入力で `min` 未満の値を入力した場合、`chipAmount` が `min` にクリップされる**
   - bet モードで `min=BIG_BLIND(10), max=500` の状態で、数値入力に `0` を入力 → `chipAmount` が `10` になることを確認
   
2. **数値入力で `max` 超過の値を入力した場合、`chipAmount` が `max` にクリップされる**
   - bet モードで `min=BIG_BLIND(10), max=500` の状態で、数値入力に `600` を入力 → `chipAmount` が `500` になることを確認

3. **範囲内の値を入力した場合はそのまま反映される**
   - bet モードで `min=BIG_BLIND(10), max=500` の状態で、数値入力に `200` を入力 → `chipAmount` が `200` になることを確認

4. **クリップ後の値で Confirm ボタンが有効になる**
   - 範囲外の値を入力してもクリップされるため、Confirm ボタンが有効であることを確認

5. **raise モードでも同様にクリップされる**
   - raise モードで `min=30, max=510` の状態で、数値入力に `10` を入力 → `chipAmount` が `30` になることを確認

**既存テストへの影響**:
- `src/ui/ActionBar.test.tsx` L434-L470 の「11.1: チップ額のクライアント側バリデーション」のうち、**`should disable confirm button when chipAmount is below min`（L434）** と **`should disable confirm button when chipAmount exceeds max`（L453）** は、クリップ実装後は値がレンジ内に補正されるため Confirm ボタンが**有効**になる。これらのテストの期待値を修正する必要がある
- 同様に **`should not call onAction when confirm is clicked with invalid chipAmount`（L510）** も、クリップにより値が有効になるため `onAction` が呼ばれるようになる。このテストの期待値も修正が必要

### Coder 向け実装ガイドライン

1. **参照すべき既存実装パターン**:
   - `handleAllIn()` 関数（`src/ui/ActionBar.tsx:69-75`）: `findRangeAction(chipInputMode)` で `min`/`max` を取得するパターンの参考
   - `handleButtonClick()` 関数（`src/ui/ActionBar.tsx:36-49`）: `chipInputMode` ベースで処理を分岐するパターンの参考

2. **変更の影響範囲・配線箇所**:
   - `src/ui/ActionBar.tsx:106` の `onChipAmountChange={setChipAmount}` を `onChipAmountChange={handleChipAmountChange}` に差し替え
   - `ChipInput` コンポーネントの props 型・内部実装は変更不要

3. **注意すべきアンチパターン**:
   - `ChipInput` 内部でクリップ処理をしない。クリップは `ActionBar` が `findRangeAction` の結果を使って行う（`ChipInput` は `min`/`max` を知っているが、責務としてはプレゼンテーション専用）
   - `onBlur` でクリップする方式は採用しない。`onChange` で即座にクリップすることで、表示と内部状態が常に一致する（design.md L76 の方針）

4. **テスト修正の注意点**:
   - 既存テスト（L434-L470 のバリデーション系テスト）の期待値が変わるため、テストを修正すること。テストの意図（「範囲外入力でもシステムが安全に動作する」）は維持しつつ、期待される振る舞いを「Confirm 無効化」から「値がクリップされてConfirm 有効」に変更する