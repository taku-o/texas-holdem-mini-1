# タスク完了サマリー

## タスク
レビュー指摘 ARCH-012-01 に基づき、`ValidAction` 型をオプショナルフィールドから判別共用体（Discriminated Union）に変更し、`bet`/`raise` 時の `min`/`max` 存在を型レベルで強制。全消費者から非null断言 `!` と防御的チェック `?.xxx !== undefined` を除去。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 変更 | `src/domain/types.ts` | `ValidAction` を5バリアントの判別共用体に変更 |
| 変更 | `src/domain/cpuStrategy.ts` | `clampToValidRange` パラメータ型変更、非null断言7箇所除去 |
| 変更 | `src/ui/ActionBar.tsx` | `RangeAction` 型エイリアス導入、`findRangeAction` で型安全ナロイング |
| 変更 | `src/ui/ActionBar.test.tsx` | テストデータに `min`/`max` 追加 |
| 変更 | `src/ui/GameScreen.test.tsx` | テストデータに `min`/`max` 追加 |
| 変更 | `src/domain/betting-validation.test.ts` | クロスフィールド不変条件の再発防止テスト追加 |

## 確認コマンド
```bash
npx vitest run
npx tsc --noEmit
```