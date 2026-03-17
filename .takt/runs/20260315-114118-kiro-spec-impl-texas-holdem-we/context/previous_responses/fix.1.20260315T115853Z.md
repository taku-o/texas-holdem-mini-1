## 作業結果
- アーキテクチャレビューの2件のDRY違反指摘（ARCH-001, ARCH-002）を修正
- `getMinBet()` と `getMinRaise()` を共通関数として抽出し、`handleButtonClick` と `getSliderProps` の両方から呼び出すように統一
- `family_tag: dry-violation` の再発防止テストを2件追加（bet/raiseのデフォルト値とスライダーmin値の一貫性検証）

## 変更内容
- **変更**: `src/ui/ActionBar.tsx` — `getMinBet()` と `getMinRaise()` を関数として抽出し、重複していた `Math.min(BIG_BLIND, playerChips)` と `Math.min(currentBet * 2, playerChips + playerCurrentBetInRound)` を一箇所に集約
- **変更**: `src/ui/ActionBar.test.tsx` — `dry-violation` 再発防止テスト2件追加（デフォルト値とスライダーmin値の一致検証）

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし（成功）

## テスト結果
- `npx vitest run src/ui/ActionBar.test.tsx` — 26テスト全パス
- `npx vitest run` — 全20テストファイル、315テスト全パス

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 2 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `architect-review.md`: ARCH-001（行33,75のbet min値重複）、ARCH-002（行40,70のraise min値重複）— 両方修正済み
- `ai-review.md`: APPROVE — 指摘なし
- `supervisor-validation.md`: APPROVE — 指摘なし
- 修正後の `ActionBar.tsx`: `getMinBet()`（行29-31）、`getMinRaise()`（行33-35）に集約。`handleButtonClick` で `getMinBet()`（行41）`getMinRaise()`（行47）、`getSliderProps` で `getMinBet()`（行77）`getMinRaise()`（行75）を使用
- 再発防止テスト: デフォルト値とスライダーmin値の一致をbet/raiseそれぞれで検証