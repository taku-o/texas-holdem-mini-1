# 変更スコープ宣言

## タスク
ゲームエンジン中核ロジック（タスク4: サブタスク4.1〜4.7）のテスト作成

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/domain/deck.test.ts` |
| 作成 | `src/domain/gameSetup.test.ts` |
| 作成 | `src/domain/dealing.test.ts` |
| 作成 | `src/domain/betting.test.ts` |
| 作成 | `src/domain/showdown.test.ts` |
| 作成 | `src/domain/handProgression.test.ts` |
| 作成 | `src/domain/gameEngine.integration.test.ts` |

## 推定規模
Large

## 影響範囲
- `src/domain/deck.ts` — デッキ生成・シャッフル（7テスト）
- `src/domain/gameSetup.ts` — ゲーム初期化（12テスト）
- `src/domain/dealing.ts` — ブラインドポスト・カード配布（14テスト）
- `src/domain/betting.ts` — アクション検証・適用・ラウンド完了判定（16テスト）
- `src/domain/showdown.ts` — 勝者判定・ポット配分（7テスト）
- `src/domain/handProgression.ts` — フェーズ遷移・ディーラー移動・ゲーム終了判定（16テスト）
- `src/domain/gameEngine.ts` — ファサード経由のインテグレーション（4テスト）
- `src/domain/types.ts` — GameStateに `lastAggressorIndex` が追加される前提でテスト記述
- `src/domain/constants.ts` — 各テストから定数を参照
- `src/domain/handEvaluator.ts` — showdownテストから `evaluate` を間接参照