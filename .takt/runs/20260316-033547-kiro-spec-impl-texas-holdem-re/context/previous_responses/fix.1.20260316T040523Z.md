型チェックもパス。

## 作業結果
- **AIR-001 / ARCH-001（dead-code）**: `src/domain/betting.ts:38-44` の `isTypeFeasible` バイパスを削除し、元の厳格な `throw` に戻した。対応テスト2件（all-in bypass経由テスト）も削除。代わりにバイパス再導入防止の回帰テスト2件を追加
- **ARCH-002（dupe-logic）**: `src/ui/ActionBar.tsx` の `getMinBet()`/`getMinRaise()` を削除し、`ValidAction.min/max` から値を取得するように変更。`handleAllIn` も `ValidAction.max` を使用するように変更。不要になった `playerChips`、`playerCurrentBetInRound`、`currentBet` プロパティを `ActionBarProps` から削除し、呼び出し元（`GameScreen.tsx`）とテストを更新

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 変更 | `src/domain/betting.ts` | `isTypeFeasible` バイパス削除（L38-44 → 単純throw） |
| 変更 | `src/domain/betting-validation.test.ts` | bypass依存テスト2件削除、回帰テスト2件追加 |
| 変更 | `src/ui/ActionBar.tsx` | `getMinBet`/`getMinRaise` 削除、`ValidAction.min/max` 使用に変更、不要props削除 |
| 変更 | `src/ui/ActionBar.test.tsx` | `ValidAction.min/max` をテストデータに追加、不要props削除、期待値更新 |
| 変更 | `src/ui/GameScreen.tsx` | ActionBarへの不要props削除 |
| 変更 | `src/ui/GameScreen.test.tsx` | `ValidAction.min/max` をテストデータに追加、テスト名更新 |

## ビルド結果
- `npx tsc --noEmit` → 型エラーなし（正常終了）

## テスト結果
- `npx vitest run` → Test Files: 24 passed (24), Tests: 406 passed (406)

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 2（ARCH-001, ARCH-002） |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `src/domain/betting.ts:37-40`: バイパス削除後のコード確認（単純throw）
- `src/ui/ActionBar.tsx:23-25,30-37,52-58,60-68`: `findAction` によるValidAction.min/max参照を確認
- `src/ui/ActionBar.tsx:5-8`: ActionBarPropsから`playerChips`/`playerCurrentBetInRound`/`currentBet`が削除されていることを確認
- `src/domain/betting-validation.test.ts`: 回帰テスト「should throw when bet is attempted with chips below BIG_BLIND」「should throw when raise is attempted with insufficient chips for minimum raise」が追加済み
- `npx tsc --noEmit`: 型エラーなし
- `npx vitest run`: 406テスト全パス