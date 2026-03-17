全ファイルの確認が完了しました。タスク11の変更（未コミット分）は以下4ファイルです：

- `src/ui/ActionBar.tsx` — バリデーション + アクセシビリティラベル
- `src/ui/ActionBar.test.tsx` — 11.1, 11.2のテスト
- `src/ui/CardView.tsx` — カード裏面のアクセシビリティ
- `src/ui/CardView.test.tsx` — 11.3のテスト

---

## AI Antipattern Review — タスク11

### レビュー対象

| ファイル | 変更内容 |
|---------|---------|
| `src/ui/ActionBar.tsx` | `isChipAmountValid()` 追加、`handleConfirm` にガード追加、`ChipInput` に `mode`/`isValid` props追加、aria-label追加、Confirmボタンのdisabled制御 |
| `src/ui/CardView.tsx` | カード裏面に `role="img"` と `aria-label="Card back"` 追加 |
| `src/ui/ActionBar.test.tsx` | 11.1（バリデーション6テスト）、11.2（アクセシビリティ5テスト）追加 |
| `src/ui/CardView.test.tsx` | 11.3（裏面アクセシビリティ4テスト）追加 |

### 検証結果

#### 1. 仮定の検証
- ✅ タスク11の要件（11.1: クライアント側バリデーション、11.2: スライダー/入力のラベル、11.3: カード裏面のアクセシビリティ）すべてに対応
- ✅ 既存の `ValidAction` 型の `min`/`max` フィールドを正しく利用しており、ドメイン層との整合性が保たれている
- ✅ バリデーション関数 `isChipAmountValid()` は `chipInputMode` と `findAction()` を既存の仕組みで連携しており、新規の仮定を導入していない

#### 2. 幻覚API・もっともらしいが間違っているパターン
- ✅ `role="img"`、`aria-label`、`disabled` — すべて標準HTMLアクセシビリティ属性。幻覚APIなし
- ✅ `isChipAmountValid()` のロジック — `min`/`max` の `undefined` チェック後に範囲比較。`ValidAction` の型定義（`min?: number; max?: number`）と正しく整合
- ✅ `disabled={!isValid}` と `handleConfirm` 内の `if (!isChipAmountValid()) return` — 二重防御パターンで、UI無効化とプログラム的ガードの両方を提供。正しいアプローチ

#### 3. 既存コードベースとの適合性
- ✅ `ChipInput` コンポーネントへの props追加パターン — 既存の `sliderProps`/`chipAmount`/`onChipAmountChange` と同じ受け渡し方式に合致
- ✅ aria-label の命名 — `"Bet amount"`/`"Raise amount"` はコードベース内のボタンテキスト命名規則（英語小文字）と整合
- ✅ テストスタイル — Given/When/Then コメント形式、`renderActionBar` ヘルパー使用、`fireEvent` + `screen` パターンで既存テストと一貫

#### 4. スコープクリープ検出
- ✅ 変更はタスク11の3つのサブタスク（11.1, 11.2, 11.3）に厳密に限定
- ✅ 不要な抽象化、過剰設定、要求外機能なし

#### 5. スコープ縮小検出（取りこぼし）
- ✅ 11.1: min未満・max超過・min境界・max境界・無効時のonAction呼び出し防止・raise側の検証 — すべてカバー
- ✅ 11.2: bet/raiseそれぞれのスライダー・数値入力のaria-label、bet/raise間のラベル区別 — すべてカバー
- ✅ 11.3: faceDown=trueの`role="img"`+`aria-label`、card=nullの場合、faceUp時に`role="img"`がないこと — すべてカバー

#### 6. デッドコード・未使用コード
- ✅ 追加されたすべてのprops（`mode`, `isValid`）はコンポーネント内で使用されている
- ✅ 追加されたすべての変数（`sliderLabel`, `inputLabel`）はJSX内で参照されている
- ✅ 旧コードの不要な残存なし（Confirmボタンの旧実装は正しく置換済み）

#### 7. フォールバック・デフォルト引数の濫用
- ✅ `isChipAmountValid()` は `undefined` チェック後に `return false` で明示的に処理。サイレント無視ではなく、ボタン無効化として反映される適切なフォールバック

### 判定

**APPROVE** ✅

ブロッキング問題は検出されませんでした。変更はタスク11の要件に正確に対応し、既存のコードベースパターンに整合しており、AI特有のアンチパターン（幻覚API、スコープクリープ、デッドコード、フォールバック濫用、過剰エンジニアリング）は検出されませんでした。テストは境界値を含む十分なカバレッジを提供しています。