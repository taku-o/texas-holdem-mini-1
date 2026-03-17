## arch-review
すべてのファイルを確認しました。レビューを実施します。

---

## Architecture Review — タスク11

### 前回指摘の追跡

前回（AI Antipattern Review）は **APPROVE** であり、open findings は **0件**。追跡対象なし。

### レビュー対象

| ファイル | 行数 | 変更内容 |
|---------|------|---------|
| `src/ui/ActionBar.tsx` | 157行 | `isChipAmountValid()` 追加、`handleConfirm` ガード追加、`ChipInput` に `mode`/`isValid` props追加、aria-label追加、Confirm disabled制御 |
| `src/ui/CardView.tsx` | 40行 | カード裏面に `role="img"` + `aria-label="Card back"` 追加 |
| `src/ui/ActionBar.test.tsx` | 687行 | 11.1（バリデーション6テスト）、11.2（アクセシビリティ5テスト）追加 |
| `src/ui/CardView.test.tsx` | 179行 | 11.3（裏面アクセシビリティ4テスト）追加 |

### 変更スコープ

- **サイズ**: 差分 +278行（テスト225行 + 実装53行）— Small
- **論理的まとまり**: タスク11の3サブタスク（バリデーション、チップ入力a11y、カード裏面a11y）に厳密に限定。無関係な変更なし。

### 構造・設計の検証

**ファイル分割**

| ファイル | 行数 | 判定 |
|---------|------|------|
| `ActionBar.tsx` | 157行 | ✅ 200行以下 |
| `CardView.tsx` | 40行 | ✅ 問題なし |

**モジュール構成**

- ✅ `ActionBar` と `CardView` は独立したUIコンポーネント。相互依存なし
- ✅ `ChipInput` は `ActionBar.tsx` 内のプライベートサブコンポーネント（export されていない）。適切なカプセル化
- ✅ 依存方向: `src/ui/` → `src/domain/types`, `src/domain/constants`（上位層→下位層）。逆方向依存なし
- ✅ 循環依存なし

**関数設計**

| 関数 | 行数 | 責務 | 判定 |
|------|------|------|------|
| `isChipAmountValid()` | 5行 | チップ額の範囲検証 | ✅ 1関数1責務 |
| `handleConfirm()` | 5行 | 確定操作のガード+発火 | ✅ 1関数1責務 |
| `handleButtonClick()` | 11行 | ボタンクリック振り分け | ✅ 問題なし |
| `getSliderProps()` | 9行 | スライダー範囲の算出 | ✅ 問題なし |

**パブリック API**

- ✅ `ActionBar` と `CardView` のみ export。`ChipInput`、`isChipAmountValid` 等の内部実装は非公開
- ✅ `ChipInputProps` 型も非export

**レイヤー設計**

- ✅ バリデーションロジック（`isChipAmountValid`）はドメイン層の `ValidAction.min/max` を参照するのみ。UI層でのクライアント側ガードとして適切な配置
- ✅ `ValidAction` 型（`type: ActionType; min?: number; max?: number`）との整合性が確認済み

**抽象度の一致**

- ✅ `ActionBar` コンポーネント内の関数群（`handleButtonClick`, `isChipAmountValid`, `handleConfirm`, `handleCancel`, `handleAllIn`, `getSliderProps`）はすべて同じ抽象度（UIイベント処理 + 状態操作）
- ✅ `ChipInput` はプレゼンテーション専用。ロジックは親コンポーネントが保持

### コード品質の検証

**REJECT基準との照合**

| 基準 | 判定 |
|------|------|
| `any` 型 | ✅ なし |
| フォールバック値の乱用 | ✅ `getSliderProps` の `{ min: 0, max: 0 }` は `chipInputMode && findAction()` が undefined の防御。`chipInputMode` が truthy の時のみ `ChipInput` がレンダリングされるため到達可能性は低いが、型安全性の担保として妥当 |
| 説明コメント（What/How） | ✅ なし |
| 未使用コード | ✅ 追加されたすべての props（`mode`, `isValid`）、変数（`sliderLabel`, `inputLabel`）はJSX内で使用済み |
| オブジェクト/配列の直接変更 | ✅ なし |
| エラー握りつぶし | ✅ なし |
| TODO コメント | ✅ なし |
| DRY違反 | ✅ なし（後述のWarningを参照） |
| 内部実装のパブリックAPIエクスポート | ✅ なし |
| 旧コード残存 | ✅ Confirmボタンの旧実装は正しく置換済み |

**呼び出しチェーン検証**

- ✅ `ChipInput` への新 props `mode` と `isValid` — 唯一の呼び出し元（`ActionBar` 内 line 92-101）で正しく渡されている
- ✅ `isChipAmountValid()` — 2箇所で使用（`handleConfirm` 内ガード + JSX `isValid` prop）。二重防御として適切

**契約文字列のハードコード散在**

- ✅ `"Card back"` — `CardView.tsx` のみ（1箇所）
- ✅ `"Bet amount"` / `"Raise amount"` — `ChipInput` 内のみ（各1箇所）
- 散在なし

### テストカバレッジ

| サブタスク | テスト数 | カバー内容 | 判定 |
|-----------|---------|-----------|------|
| 11.1 バリデーション | 6 | min未満、max超過、min境界、max境界、無効時onAction防止、raise側 | ✅ |
| 11.2 a11yラベル | 5 | bet/raise各スライダー・入力のaria-label、bet/raise区別 | ✅ |
| 11.3 裏面a11y | 4 | faceDown=true の role+label、card=null、faceUp時にroleなし | ✅ |

### Warning（非ブロッキング）

**W1: テストファイルの行数**

`ActionBar.test.tsx` が 687行に達している。現時点ではテストの可読性・保守性に実害はないが、今後のタスクでさらにテストが追加される場合、describe ブロック単位でのファイル分割を検討すると良い（例: `ActionBar.validation.test.tsx`, `ActionBar.a11y.test.tsx`）。

### 指摘一覧

| finding_id | 状態 | 種別 | 内容 |
|-----------|------|------|------|
| （なし） | — | — | ブロッキング問題なし |

### 判定

**APPROVE** ✅

- ファイル分割・行数: 全ソースファイル200行以下
- モジュール構成: 高凝集・低結合。内部実装は適切にカプセル化
- 関数設計: 全関数が1責務、30行以下
- レイヤー設計: UI→Domain の正しい依存方向
- コード品質: REJECT基準に該当する問題なし
- 呼び出しチェーン: 新 props の配線完了を確認
- テスト: 全ての新しい振る舞いにテストあり
- 変更スコープ: タスク11の要件に厳密に限定

---

## supervise
全レポートを確認しました。検証結果をまとめます。

**ビルドエラーの分析**: `src/ui/ActionBar.tsx:35` の `setChipInputMode(actionType)` における TS2345 エラーは、タスク11の変更前（stash して確認済み）から存在する既存の型エラーです。タスク11の変更（diff）にはこの行の修正は含まれていません。ただし、変更対象ファイル内の既存問題であり、ボーイスカウトルールに該当します。

# 最終検証結果

## 結果: REJECT

## 要件充足チェック

タスク指示書（tasks.md）のタスク11から要件を抽出し、各要件を実コードで個別に検証。

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1 | 11.1: ベット/レイズ確定前にmin/max範囲内であることをクライアント側で検証する | ✅ | `src/ui/ActionBar.tsx:42-47` `isChipAmountValid()` |
| 2 | 11.1: 範囲外の値では送信を無効化する | ✅ | `src/ui/ActionBar.tsx:152` `disabled={!isValid}` + `ActionBar.tsx:51` `handleConfirm`内ガード |
| 3 | 11.2: スライダーにlabelまたはaria-labelで意味が分かるラベルを付与する | ✅ | `src/ui/ActionBar.tsx:139` `aria-label={sliderLabel}` |
| 4 | 11.2: 数値入力にlabelまたはaria-labelで意味が分かるラベルを付与する | ✅ | `src/ui/ActionBar.tsx:148` `aria-label={inputLabel}` |
| 5 | 11.3: カード裏面にalt/aria-labelでアクセシブルな説明を付与する | ✅ | `src/ui/CardView.tsx:24-25` `role="img" aria-label="Card back"` |

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` — 26ファイル 475テスト全パス |
| ビルド | ❌ | `npm run build` — TS2345エラー（`src/ui/ActionBar.tsx:35`） |
| 動作確認 | ✅ | テスト経由で全要件の動作確認済み |

## 成果物
- 変更: `src/ui/ActionBar.tsx`（バリデーション + アクセシビリティラベル）
- 変更: `src/ui/CardView.tsx`（カード裏面アクセシビリティ）
- 変更: `src/ui/ActionBar.test.tsx`（11.1: 6テスト, 11.2: 5テスト追加）
- 変更: `src/ui/CardView.test.tsx`（11.3: 4テスト追加）

## 未完了項目

| # | finding_id | 状態 | 項目 | 理由 |
|---|-----------|------|------|------|
| 1 | SUP-001 | new | `src/ui/ActionBar.tsx:35` — TypeScriptビルドエラー TS2345 | `setChipInputMode(actionType)` で `ActionType` を `'bet' \| 'raise' \| null` に代入。`CHIP_INPUT_ACTIONS.includes()` でランタイムでは 'bet'/'raise' のみ到達するが、TypeScript が型を絞り込めない。修正案: `setChipInputMode(actionType as 'bet' \| 'raise')` に変更するか、`CHIP_INPUT_ACTIONS` を `const CHIP_INPUT_ACTIONS = ['bet', 'raise'] as const` に変更して型ガードを追加する。これは既存の問題だが、変更対象ファイル内の問題でありボーイスカウトルールに基づきREJECT対象 |