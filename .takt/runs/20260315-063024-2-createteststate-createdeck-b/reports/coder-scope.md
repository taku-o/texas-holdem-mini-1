# 変更スコープ宣言

## タスク
createTestState()でdeck指定時にcreateDeck()の呼び出しをスキップする遅延評価の実装

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/domain/testHelpers.ts` |

## 推定規模
Small

## 影響範囲
- testHelpers.tsのcreateTestState()を使用する全テストファイル（betting.test.ts, showdown.test.ts, dealing.test.ts, handProgression.test.ts, gameSetup.test.ts, types.test.ts等）