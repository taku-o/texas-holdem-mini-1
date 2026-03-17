# 変更スコープ宣言

## タスク
createTestState()でdeckがoverridesに含まれる場合、createDeck()の呼び出しをスキップする最適化のテスト追加

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/domain/testHelpers.test.ts` |

## 推定規模
Small

## 影響範囲
- `src/domain/testHelpers.ts` の `createTestState` 関数