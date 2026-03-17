# 変更スコープ宣言

## タスク
タスク11: チップ額入力のクライアント側バリデーションとアクセシビリティのテスト作成（要件12, 13）

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/ui/ActionBar.test.tsx` |
| 変更 | `src/ui/CardView.test.tsx` |

## 推定規模
Small

## 影響範囲
- ActionBar コンポーネント（ChipInput の Confirm ボタン disabled バリデーション、スライダー・数値入力の aria-label）
- CardView コンポーネント（裏面表示の role="img" と aria-label）

## 変更内容

### ActionBar.test.tsx（11テスト追加）

**11.1: チップ額のクライアント側バリデーション（6テスト）**
- Confirm ボタンが chipAmount < min のとき disabled になること（bet モード）
- Confirm ボタンが chipAmount > max のとき disabled になること（bet モード）
- Confirm ボタンが chipAmount === min のとき有効であること（境界値）
- Confirm ボタンが chipAmount === max のとき有効であること（境界値）
- disabled 状態で Confirm クリック時に onAction が呼ばれないこと（振る舞い検証）
- raise モードでも chipAmount < min のとき disabled になること

**11.2: チップ入力のアクセシビリティラベル（5テスト）**
- bet モードでスライダーに aria-label が存在すること
- bet モードで数値入力に aria-label が存在すること
- raise モードでスライダーに aria-label が存在すること
- raise モードで数値入力に aria-label が存在すること
- bet と raise で aria-label が区別されること

### CardView.test.tsx（4テスト追加）

**11.3: 裏面のアクセシビリティ（4テスト）**
- faceDown=true のとき role="img" が設定されること
- faceDown=true のとき aria-label が設定されること
- card=null のとき role="img" と aria-label が設定されること
- 表面表示（faceDown=false, card あり）のとき role="img" がないこと

## テスト実行結果
- 新規15テスト: 全て失敗（プロダクションコード未変更のため想定通り）
- 既存38テスト: 全てパス（既存機能への影響なし）