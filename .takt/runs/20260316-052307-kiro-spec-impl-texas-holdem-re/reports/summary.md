# タスク完了サマリー

## タスク
チップが0のプレイヤーを次ハンドから除外する（タスク4.1: 次ハンド不参加、タスク4.2: ディーラー・席順・ブラインド計算でのスキップ）。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 変更 | `src/domain/handProgression.ts` | `startNextHand` で `folded: p.chips === 0` に変更し、チップ0プレイヤーを次ハンドで folded 状態に維持 |
| 変更 | `src/domain/dealing.ts` | `dealHoleCards` で folded プレイヤーへのカード配布をスキップし、デッキ消費量をアクティブプレイヤー数に基づかせる |
| 変更 | `src/domain/handProgression.test.ts` | チップ0プレイヤーの folded 維持・カード未配布・複数プレイヤー対応のテスト3件追加 |
| 変更 | `src/domain/dealing.test.ts` | folded スキップ・デッキ消費量・ユニーク性検証のテスト3件追加 |

## 確認コマンド
```bash
npm test
```