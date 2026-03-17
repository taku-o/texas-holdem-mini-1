# 決定ログ

## 1. テストファイル固有のデフォルト値はローカルラッパーで対応
- **背景**: 既存テストファイルごとにcreateTestPlayer/createTestStateのデフォルト値が異なっていた（例: dealing.test.tsはholeCards=[]、showdown.test.tsはphase='showdown'とcommunityCards付き、betting.test.tsはpot=15/currentBet=BIG_BLIND）。共通化にあたり、これらの差分をどう吸収するか決定が必要だった
- **検討した選択肢**: (A) 共通ヘルパーのみ使用し、全テストの呼び出し箇所でoverrideを個別に渡す (B) 共通ヘルパーをベースにローカルラッパー関数で差分を吸収する
- **理由**: (B)を選択。既存テストコードの変更を最小限に抑えつつ、card/createSimpleDeck/createTestPlayerの本質的な実装コードの重複を排除できる。ローカルラッパーは2〜5行程度で、共通ヘルパーに文脈固有のデフォルト値を渡すだけの薄い関数であるため、重複の問題は発生しない