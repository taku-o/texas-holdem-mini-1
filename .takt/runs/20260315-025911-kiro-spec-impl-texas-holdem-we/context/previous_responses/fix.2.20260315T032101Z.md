全テストパス。

## 作業結果
- アーキテクチャレビューで指摘された ARCH-001（未使用型インポート `HandRank`）を修正しました
- `src/domain/handEvaluator.test.ts:2` の `import type { Card, HandRank }` から未使用の `HandRank` を削除

## 変更内容
- **変更**: `src/domain/handEvaluator.test.ts:2` — `import type { Card, HandRank } from './types'` → `import type { Card } from './types'`

## ビルド結果
- `tsc -b --noEmit` — 型エラーなし（成功）

## テスト結果
- `npm test` — 全 63 テスト合格（4ファイル）
  - `handEvaluator.test.ts`: 23テスト全パス
  - `types.test.ts`: 28テスト全パス
  - `constants.test.ts`: 10テスト全パス
  - `App.test.tsx`: 2テスト全パス

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 1（ARCH-001） |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `architect-review.md`: ARCH-001 (new) — `src/domain/handEvaluator.test.ts:2` の未使用 `HandRank` インポート削除指示
- `supervisor-validation.md`: APPROVE — AIR-001-comment 解消確認済み
- 修正後の `handEvaluator.test.ts:2` を確認: `import type { Card } from './types'`（`HandRank` 削除済み）
- Grep `HandRank` でテストファイル内の残存使用を確認: 2箇所はテスト名・コメント内の文字列のみ（型注釈としての使用なし）
- ビルド・テストともにパス