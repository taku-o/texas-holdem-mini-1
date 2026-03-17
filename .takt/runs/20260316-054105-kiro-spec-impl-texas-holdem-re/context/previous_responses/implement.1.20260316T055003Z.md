## 作業結果
- `decideAction`が返すbet/raise額を`getValidActions`のmin/max範囲にクランプする`clampToValidRange`関数を追加し、全てのbet/raiseアクション生成箇所に適用した
- ショートスタック時にcalculateBetAmountがminRaiseTotal未満の値を返す問題が解消された

## 変更内容
- **変更**: `src/domain/cpuStrategy.ts`
  - `ValidAction`型のインポートを追加
  - `clampToValidRange(amount, validAction)`関数を新規追加（ValidActionのmin/maxで値をクランプ）
  - `decideAction`内の全bet/raiseアクション生成箇所（strong/medium/weak各分岐、計5箇所）で、`calculateBetAmount`の結果を`clampToValidRange`でクランプするよう変更

## ビルド結果
- `npx tsc --noEmit` — エラーなし ✅

## テスト結果
- `npx vitest run src/domain/cpuStrategy.test.ts` — 33テスト全パス ✅
- `npx vitest run` — 全24ファイル、435テスト全パス ✅（リグレッションなし）