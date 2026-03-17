# 変更スコープ宣言

## タスク
タスク10「結合・動作確認とテスト」- 統合テスト・単体テストの追加

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/__tests__/gameIntegration.test.ts` |
| 作成 | `src/__tests__/showdownEdgeCases.test.ts` |
| 作成 | `src/__tests__/eliminationEdgeCases.test.ts` |

## 推定規模
Medium

## 影響範囲
- ゲームエンジン統合フロー（gameSetup → gameEngine → gameFlow の横断テスト）
- ショーダウンのエッジケース（3人以上タイ時のポット分割・端数処理）
- プレイヤー除外のエッジケース（チップ0プレイヤーのハンドスキップ・ブラインド処理）
- 複数ハンド連続進行（bet/raise含む多様なアクションでの複数ハンド）
- ゲーム再開フロー（ゲーム終了後のstartGame再呼び出し）