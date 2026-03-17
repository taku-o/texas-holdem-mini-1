現在の実装を把握しました。計画をまとめます。

---

## 計画レポート

### タスク概要

タスク11: チップ額入力のクライアント側バリデーションとアクセシビリティ（要件12, 13）

3つのサブタスクで構成:
- 11.1: ベット/レイズ確定前のクライアント側バリデーション
- 11.2: スライダー・数値入力のアクセシビリティラベル
- 11.3: カード裏面のアクセシビリティ

### スコープ判定: 小規模タスク

変更対象は2ファイル（`ActionBar.tsx`、`CardView.tsx`）のみ。設計判断・技術選定は不要。

---

### 要件ごとの変更要否

#### 11.1: クライアント側バリデーション（要件12）
**変更要**

現状の `ActionBar.tsx` の `handleConfirm` 関数（42-46行目）は、`chipAmount` をバリデーションなしで `onAction` に渡している。HTML の `min`/`max` 属性はスライダーには効くが、`<input type="number">` はユーザーが範囲外の値を直接入力可能。確定時に min/max 範囲チェックを行い、範囲外なら送信を無効化またはクランプする必要がある。

#### 11.2: スライダー・数値入力のラベル（要件13）
**変更要**

現状の `ChipInput` コンポーネント（116-135行目）の `<input type="range">` と `<input type="number">` には `aria-label` も `<label>` も付与されていない。

#### 11.3: カード裏面のアクセシビリティ（要件13）
**変更要**

現状の `CardView.tsx`（21-23行目）で裏面表示時は `<div>` のみでテキストもARIA属性もない。スクリーンリーダーが何も読み上げない状態。

---

### 実装アプローチ

#### 11.1: バリデーション

**方針**: `handleConfirm` で `chipAmount` が `min` ～ `max` 範囲内かチェックし、範囲外なら送信しない（ボタンの `disabled` 制御）。

具体的な実装:
1. `ChipInput` の `onConfirm` ボタンに `disabled` 条件を追加: `chipAmount < min || chipAmount > max` の場合は disabled にする
2. `onChipAmountChange` でクランプするアプローチも考えられるが、ユーザーが入力中に値を矯正するのは UX が悪い。確定ボタンの無効化で対応する

**参照パターン**: `ActionBar.tsx:76行目` - 既にボタンの `disabled` 制御パターンがある

#### 11.2: アクセシビリティラベル

**方針**: `aria-label` を付与する。

- スライダー: `aria-label="チップ額"` 
- 数値入力: `aria-label="チップ額"`

chipInputMode（bet/raise）に応じたラベルにしてもよいが、ChipInput は現在 mode を知らないので、props で渡すか汎用ラベルにする。シンプルに `aria-label` を固定値で付与するのが最小限。

**追加検討**: `chipInputMode` を `ChipInput` に渡して `aria-label={`${mode}額`}` とする方がより正確だが、要件は「意味が分かるラベルを付与する」なので、まずは汎用ラベルで十分。ただし bet/raise を区別したほうが意味が明確なので、`chipInputMode` を props として渡すのが望ましい。

#### 11.3: カード裏面

**方針**: `CardView.tsx` の裏面表示の `<div>` に `aria-label="裏向きのカード"` と `role="img"` を付与する。

---

### Coder向け実装ガイドライン

#### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/ui/ActionBar.tsx` | 11.1: Confirmボタンのdisabled制御、11.2: aria-label付与 |
| `src/ui/CardView.tsx` | 11.3: 裏面divにaria-label・role付与 |

#### 詳細な変更箇所

**`src/ui/ActionBar.tsx`**

1. **ChipInput に `mode` props を追加**（97行目の `ChipInputProps` 型）:
   - `mode: 'bet' | 'raise'` を追加
   - 呼び出し元（84行目）で `mode={chipInputMode}` を渡す（`chipInputMode` は null でない時のみ ChipInput がレンダリングされるので型は合う）

2. **Confirmボタンのdisabled制御**（133行目）:
   - `disabled={chipAmount < sliderProps.min || chipAmount > sliderProps.max}` を追加

3. **スライダーに `aria-label` を付与**（117行目の `<input type="range">`）:
   - `aria-label={mode === 'bet' ? 'ベット額' : 'レイズ額'}` を追加

4. **数値入力に `aria-label` を付与**（124行目の `<input type="number">`）:
   - `aria-label={mode === 'bet' ? 'ベット額' : 'レイズ額'}` を追加

**`src/ui/CardView.tsx`**

1. **裏面表示の div にアクセシビリティ属性を追加**（22行目）:
   - `role="img"` と `aria-label="裏向きのカード"` を追加

#### 参照すべき既存パターン

- ボタンの disabled 制御: `ActionBar.tsx:76行目` - `disabled={!validActionTypes.has(actionType)}`
- CardView の表面表示: `CardView.tsx:31行目` - 表面の div 構造

#### 影響範囲

- `ChipInputProps` に `mode` を追加 → `ChipInput` の呼び出し箇所は `ActionBar.tsx:84行目` の1箇所のみ
- `CardView` の変更は表示のみ、既存のテストには影響しない（テストは表示テキストの有無で検証しており、aria-label の追加で壊れない）

#### 注意すべきアンチパターン

- 数値入力のバリデーションで `onChange` 時にクランプ（値を強制修正）しないこと。ユーザーの入力途中を矯正するのは UX が悪い。確定ボタンの disabled 制御で対応する
- `aria-label` の文言は日本語で統一する（既存UIが日本語ベースの場合。ボタンテキストが英語なら英語でもよい）。現状ボタンは英語（"Confirm", "Cancel" 等）なので、aria-label も英語（"Bet amount", "Raise amount"）でもよいが、プロジェクトの方針に合わせる。現状のコードを見るとボタンテキストは英語なので英語が自然