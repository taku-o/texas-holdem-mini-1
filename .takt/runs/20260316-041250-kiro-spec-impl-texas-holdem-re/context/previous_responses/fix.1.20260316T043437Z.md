## 作業結果
- ARCH-001-dry-eligible-index（DRY違反）を修正: `findNextEligibleIndex` を `dealing.ts` から export し、`handProgression.ts` の `getNextDealerIndex` が共通ヘルパーを再利用するように統一
- `findNextEligibleIndex` の単体テスト4件を追加（再発防止）

## 変更内容
- **`src/domain/dealing.ts`**: `findNextEligibleIndex` を `export` に変更
- **`src/domain/handProgression.ts`**: `findNextEligibleIndex` を import し、`getNextDealerIndex` を3行に簡素化（重複ロジック削除）
- **`src/domain/dealing.test.ts`**: `findNextEligibleIndex` の単体テスト4件追加（正常探索、スキップ、ラップアラウンド、全員chips=0で-1返却）

## ビルド結果
- `npx tsc --noEmit` 成功（型エラーなし）

## テスト結果
- `npx vitest run` — **24ファイル、418テスト全てパス**

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 1 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `src/domain/dealing.ts:4` — `export function findNextEligibleIndex` で公開
- `src/domain/handProgression.ts:68-71` — `getNextDealerIndex` が `findNextEligibleIndex` を呼び出し、重複ロジック削除
- `src/domain/dealing.test.ts` — `findNextEligibleIndex` の4テスト追加（正常/スキップ/ラップ/-1）
- `npx tsc --noEmit` — 型エラーなし
- `npx vitest run` — 418テスト全パス