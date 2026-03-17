## 作業結果
- 計画に基づき、CPU のレイズ/ベット額が `getValidActions` の `min`/`max` 範囲内にクランプされることを検証する6つのテストケースを追加
- テストは TDD スタイルで作成済み。実装前のため **2テストが期待通り失敗**、4テストは既にパス
  - ❌ `should clamp raise amount to minRaiseTotal when calculateBetAmount returns below min` — amount=30 が返されるが min=35 以上であるべき
  - ❌ `should produce raise amount that applyAction accepts without error` — "Raise is below minimum" エラーが発生

## 変更内容
- **変更**: `src/domain/cpuStrategy.test.ts`
  - `applyAction` のインポート追加
  - `レイズ/ベット額がgetValidActionsのmin/max範囲にクランプされる` describe ブロックを新規追加（6テスト）
    1. raise 額が minRaiseTotal 以上にクランプされること（ショートスタック）
    2. raise 額が maxRaiseTotal 以下にクランプされること
    3. bet 額が getValidActions の min/max 範囲内であること
    4. medium strength の raise も有効範囲内であること
    5. raise の結果を applyAction に渡してエラーにならないこと（結合テスト）
    6. bet の結果を applyAction に渡してエラーにならないこと（結合テスト）