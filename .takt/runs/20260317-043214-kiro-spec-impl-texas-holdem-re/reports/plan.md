# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 11` — タスク11「チップ額入力のクライアント側バリデーションとアクセシビリティ」の実装計画。

## 分析結果

### 目的
1. ベット/レイズ確定前に min/max 範囲のクライアント側検証を行い、範囲外の値では送信を無効化する（要件12）
2. スライダー・数値入力にアクセシビリティラベルを付与する（要件13）
3. カード裏面にアクセシブルな説明を付与する（要件13）

### スコープ
小規模タスク。変更対象は2ファイルのみ。設計判断・技術選定は不要。

| ファイル | サブタスク | 変更内容 |
|---------|-----------|---------|
| `src/ui/ActionBar.tsx` | 11.1, 11.2 | Confirmボタンのdisabled制御、aria-label付与 |
| `src/ui/CardView.tsx` | 11.3 | 裏面divにrole="img"とaria-label付与 |

### 要件ごとの変更要否

| サブタスク | 変更要否 | 根拠 |
|-----------|---------|------|
| 11.1 バリデーション | **変更要** | `ActionBar.tsx:42-46行目` の `handleConfirm` が `chipAmount` をバリデーションなしで `onAction` に渡している。HTML `min`/`max` 属性はスライダーには効くが、`<input type="number">`（125行目）はユーザーが範囲外の値を直接入力可能 |
| 11.2 ラベル付与 | **変更要** | `ActionBar.tsx:117-131行目` の `<input type="range">` と `<input type="number">` に `aria-label` も `<label>` もない |
| 11.3 カード裏面 | **変更要** | `CardView.tsx:21-23行目` の裏面表示は `<div>` のみでテキストもARIA属性もない |

### 実装アプローチ

#### 11.1: Confirmボタンのdisabled制御

- `ChipInput` コンポーネント内の Confirm ボタン（`ActionBar.tsx:133行目`）に `disabled` 条件を追加
- 条件: `chipAmount < sliderProps.min || chipAmount > sliderProps.max`
- `onChange` 時にクランプ（値の強制修正）はしない。入力途中の矯正はUXが悪いため、確定ボタンの無効化で対応する
- 参照パターン: `ActionBar.tsx:76行目` に既存の `disabled` 制御パターンがある

#### 11.2: スライダー・数値入力の aria-label

- `ChipInputProps` に `mode: 'bet' | 'raise'` を追加（`ActionBar.tsx:97行目`）
- 呼び出し元（`ActionBar.tsx:84行目`）で `mode={chipInputMode!}` を渡す（`chipInputMode` が非nullの時のみ `ChipInput` がレンダリングされるため安全。ただし non-null assertion より `as 'bet' | 'raise'` が型安全）
- スライダー（117行目）に `aria-label={mode === 'bet' ? 'Bet amount' : 'Raise amount'}` を付与
- 数値入力（124行目）に `aria-label={mode === 'bet' ? 'Bet amount' : 'Raise amount'}` を付与
- 既存のボタンテキストが英語（"Confirm", "Cancel", "All-in"）なので、aria-label も英語で統一する

#### 11.3: カード裏面のアクセシビリティ

- `CardView.tsx:22行目` の裏面 `<div>` に `role="img"` と `aria-label="Hidden card"` を追加
- 表面表示のカードは視覚的にランク・スートが表示されており追加対応不要

### 影響範囲

- `ChipInputProps` に `mode` を追加 → 呼び出し箇所は `ActionBar.tsx:84行目` の1箇所のみ。配線漏れリスクなし
- `CardView` の変更は属性追加のみ。既存テスト（`CardView.test.tsx`）はテキスト有無で検証しており、aria-label 追加で壊れない
- `ActionBar.test.tsx` の既存テストは Confirm ボタンを `getByRole('button', { name: /confirm|確定/i })` で取得しており、disabled 追加で取得自体は壊れないが、disabled 状態のクリックテストがある場合は確認が必要（現状そのようなテストはない）

### 注意すべきアンチパターン

- 数値入力の `onChange` でクランプしないこと（ユーザーの入力途中を矯正するのはUXが悪い）
- aria-label を重複して付けないこと（`aria-label` と `<label>` の両方を付けると冗長）
- CardView で `alt` 属性は `<img>` 用。`<div>` には `role="img"` + `aria-label` の組み合わせが正しい