# 決定ログ

## 1. clampToValidRange関数の導入方法
- **背景**: calculateBetAmountの戻り値がgetValidActionsのmin/max範囲外になるケースがあり、applyActionでエラーが発生していた。特にショートスタック時にcurrentBetInRoundを考慮したminRaiseTotalを下回る額が算出されていた
- **検討した選択肢**:
  1. calculateBetAmount自体にValidActionのmin/maxを引数として渡して内部でクランプする
  2. decideAction内でamount使用時にクランプする専用関数を追加する
- **理由**: calculateBetAmountはチップ量・ハンド強度・currentBetに基づく純粋な計算関数であり、ValidActionの構造（ベッティングルールの制約）に依存させるべきでない。クランプはアクション選択のコンテキストで行うのが責務として適切なため、別関数clampToValidRangeをdecideActionの近くに導入した