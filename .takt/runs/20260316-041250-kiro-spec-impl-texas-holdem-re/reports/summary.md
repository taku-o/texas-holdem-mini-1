# タスク完了サマリー

## タスク
タスク2「ブラインド・ショートスタックの扱いの修正」— BBショートスタック時の `currentBet` を実際のポスト額に修正し、チップ0プレイヤーのブラインドスキップ機能を実装。レビュー指摘のDRY違反も解消。

## 結果
完了

## 変更内容

| 種別 | ファイル | 概要 |
|------|---------|------|
| 変更 | `src/domain/dealing.ts` | `findNextEligibleIndex` を export 化、SB/BBスキップロジック、`currentBet: bbAmount` |
| 変更 | `src/domain/handProgression.ts` | `getNextDealerIndex` を `findNextEligibleIndex` 再利用に簡素化、BBインデックスを `lastAggressorIndex!` に変更 |
| 変更 | `src/domain/dealing.test.ts` | 新テスト11件追加（ショートスタック7件 + findNextEligibleIndex 4件） |
| 変更 | `src/domain/handProgression.test.ts` | 新テスト2件追加、既存テスト1件修正 |
| 変更 | `src/application/gameFlow.test.ts` | 既存テスト2件のアサーションをチップ保存則に変更 |

## 確認コマンド

```bash
npx vitest run
npx tsc --noEmit
```