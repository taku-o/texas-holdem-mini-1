# 決定ログ

## 1. handProgression.test.ts の既存テスト修正
- **背景**: `should skip chip-0 player in blind positions` テストが、旧ロジック（固定位置のSB/BB割り当て: `sbIndex=(dealerIndex+1)%count`, `bbIndex=(dealerIndex+2)%count`）を前提としたアサーションだった。新ロジック（`findNextEligibleIndex`によるスキップ）では、dealer=3のとき、index 4（chips=0）をスキップしてSB=index 0、BB=index 1になるため不整合が発生
- **検討した選択肢**: テストの構造（プレイヤー配置）を変更する / アサーション値のみを新ロジックに合わせて修正する
- **理由**: テストの意図（チップ0プレイヤーへのブラインド不課金の検証）は正しく、プレイヤー配置も適切なため、アサーション値のみを新ロジックの正しい結果に合わせて修正した

## 2. gameFlow.test.ts の既存テスト2件の修正
- **背景**: 2つのテスト（`should skip to showdown when only one non-folded player has chips` / `should resolve uncontested pot when only one player remains`）が `result.pot === 0` を期待していた。旧ロジックではチップ0プレイヤーにもブラインドが形式的に課されるため新ハンドのpotは0だったが、新ロジックではチップ>0のプレイヤーに正しくブラインドが課されるため、ポット解決後に新ハンドが開始されるとpot=15（SB+BB）になる
- **検討した選択肢**: テスト設定をゲームオーバーシナリオに変更して新ハンドが開始されないようにする / アサーションをチップ保存則（全プレイヤーのchips合計 + pot = 初期合計）に変更する
- **理由**: テストの本質（ポット配分の正当性検証）を維持するため、総チップ保存則のアサーションに変更した。テスト設定の大幅変更は意図の変質リスクがあり、チップ保存則はポット配分後もチップが消失・増殖しないことを直接的に検証できる