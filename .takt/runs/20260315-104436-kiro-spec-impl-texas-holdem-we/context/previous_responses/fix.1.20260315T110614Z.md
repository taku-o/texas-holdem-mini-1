全289テストパス（1テスト追加）。

## 作業結果
- アーキテクチャレビューの指摘1件（ARCH-001: What/Howコメント）を修正
- `gameFlow.ts:71-72` のWhat/Howコメント2行を削除
- 同一 `family_tag: what-comment` の潜在箇所として `cpuStrategy.ts:120` のWhat コメント1行も削除
- 再発防止テストとして「1人だけチップ残りの場合のフェーズスキップ」テストを追加（`canAnyoneStillBet` の境界条件カバー）

## 変更内容

| 種別 | ファイル | 内容 |
|------|---------|------|
| 変更 | `src/application/gameFlow.ts` | L71-72のWhat/Howコメント2行を削除 |
| 変更 | `src/domain/cpuStrategy.ts` | L120のWhatコメント1行を削除 |
| 変更 | `src/application/gameFlow.test.ts` | 「1人だけチップ残りの場合のフェーズスキップ」テスト追加 |

## ビルド結果
- `npx tsc --noEmit` — 型エラーなし

## テスト結果
- `npx vitest run` — 全19ファイル、289テストがパス（+1テスト追加）

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 1 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `ai-review.md`: APPROVE（指摘0件）
- `architect-review.md`: REJECT（指摘1件 ARCH-001-gameFlow-L71）→ 修正済み
- 過去イテレーションのレビューレポートなし（初回レビュー）
- `grep '^\s*//'` でプロダクションコード `.ts`/`.tsx` を検索 → テストファイルのGiven/When/Thenコメントと`vite-env.d.ts`の型参照のみ残存（What/Howコメントは解消済み）
- `npx tsc --noEmit` 成功、`npx vitest run` 全289テストパス