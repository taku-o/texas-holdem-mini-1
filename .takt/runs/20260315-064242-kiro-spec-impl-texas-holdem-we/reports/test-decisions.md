# 決定ログ

## 1. インテグレーションテストは不要と判断
- **背景**: cpuStrategyは betting.ts の getValidActions と handEvaluator.ts の evaluate を利用するが、インテグレーションテストの要否を判断する必要があった
- **検討した選択肢**: (a) ユニットテストのみ (b) ユニットテスト＋インテグレーションテスト
- **理由**: cpuStrategy は getValidActions と evaluate を呼び出して結果をもとにアクションを返すだけであり、3モジュール以上を横断する複雑なデータフローや新しい状態の合流は発生しない。ユニットテストで getValidActions の実際の結果と照合する検証を含めているため、ユニットテストのみで十分

## 2. randomFnをテストで直接渡す方式を採用
- **背景**: CPUの行動にランダム性がある中でテストの再現性を確保する必要があった
- **検討した選択肢**: (a) randomFnを固定値で渡す (b) Math.randomをモックする
- **理由**: 計画で指定されたインターフェース通り randomFn を引数として渡す設計であり、固定値の関数を渡すことでモック不要でテストの再現性を確保できる。handProgression.ts の startNextHand と同じパターン