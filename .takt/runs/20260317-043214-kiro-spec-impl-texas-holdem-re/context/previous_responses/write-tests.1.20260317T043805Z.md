## 作業結果

タスク11（チップ額入力のクライアント側バリデーションとアクセシビリティ）に対するテストを作成しました。

- **11.1 バリデーション**: 6テスト — Confirmボタンのdisabled制御（min未満・max超過で無効、min境界値・max境界値で有効、無効時にonActionが呼ばれないこと、raiseモードでの検証）
- **11.2 アクセシビリティラベル**: 5テスト — bet/raiseモードでスライダーと数値入力にaria-labelが存在すること、bet/raiseでラベルが区別されること
- **11.3 カード裏面アクセシビリティ**: 4テスト — faceDown=trueとcard=nullの裏面表示でrole="img"とaria-labelが存在すること、表面表示にはrole="img"がないこと

全12テストが想定通り失敗（プロダクションコード未変更のため）、既存38テストは全てパスしています。

## 変更内容
- `src/ui/ActionBar.test.tsx` — 11.1（バリデーション6テスト）と11.2（aria-label 5テスト）の2 describe ブロックを追加
- `src/ui/CardView.test.tsx` — 11.3（カード裏面アクセシビリティ4テスト）の1 describe ブロックを追加