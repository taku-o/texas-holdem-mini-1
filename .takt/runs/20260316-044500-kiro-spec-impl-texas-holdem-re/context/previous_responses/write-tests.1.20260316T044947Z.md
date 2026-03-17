## 作業結果
- 計画に基づき、`evaluateShowdown` と `resolveUncontestedPot` の防御的アサーション追加に対するテストを作成
- 既存テストファイル `src/domain/showdown.test.ts` に5つの新規テストケースを追加
- 全16テスト（既存11 + 新規5）がパスすることを確認

## 変更内容
- **変更**: `src/domain/showdown.test.ts`
  - `evaluateShowdown ポット配分の正当性` describe ブロック追加（3テスト）
    - オールイン（chips=0）の複数プレイヤーが勝者のとき全プレイヤーのchips >= 0 かつチップ保存則が成立
    - chips=0の勝者にpot全額が正しく加算される
    - pot=0でもエラーなく処理される
  - `resolveUncontestedPot ポット配分の正当性` describe ブロック追加（2テスト）
    - chips=0の勝者（他全員フォールド）にpotが正しく加算され全プレイヤーのchips >= 0
    - pot=0でもエラーなく処理される