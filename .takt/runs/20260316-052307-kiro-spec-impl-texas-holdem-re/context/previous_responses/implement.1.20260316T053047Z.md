## 作業結果
- チップ0プレイヤーが次ハンドで除外される（`folded: true`維持、ホールカード配布スキップ）ように実装した

## 変更内容

### `src/domain/dealing.ts`（dealHoleCards修正）
- foldedプレイヤーにはカードを配らず空配列を維持するよう変更
- デッキ消費量をアクティブプレイヤー数に基づくよう修正

### `src/domain/handProgression.ts`（startNextHand修正）
- `folded: false` の一律リセットを `folded: p.chips === 0` に変更し、チップ0プレイヤーをfolded状態で維持

## ビルド結果
- `npx tsc --noEmit` 成功（型エラーなし）

## テスト結果
- `npx vitest run` — 24ファイル、429テスト全てパス