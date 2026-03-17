# タスク完了サマリー

## タスク
ベッティングのバリデーション（タスク1.1〜1.4）: ベット/レイズ額の検証、レイズ可否のチップフィルタリング、オールインaggressorのラウンド終了判定修正、有効アクションへのmin/max範囲付与。

## 結果
未完了（REJECT）

## 未完了理由
- タスク1.4の要件「UIがチップ入力の範囲として利用できるようにする」が未達成。ドメインはmin/maxを返すが、ActionBarが無視して独自計算しており、最低レイズ額にドメインとUIで乖離がある（実バグ）
- AIレビューの5件のブロッキング指摘（配線忘れ、説明コメント×2、DRY違反、バリデーションギャップ）が全て未対応

## 変更内容（現時点）
| 種別 | ファイル | 概要 |
|------|---------|------|
| 作成 | `src/domain/betting-validation.test.ts` | バリデーション・ラウンド終了・min/maxテスト 20ケース |
| 変更 | `src/domain/types.ts` | ValidAction型追加 |
| 変更 | `src/domain/betting.ts` | getValidActions min/max返却、applyAction バリデーション、isBettingRoundComplete修正 |
| 変更 | `src/domain/gameEngine.ts` | ValidAction re-export追加 |
| 変更 | `src/application/useGameController.ts` | ValidAction型に更新 |
| 変更 | `src/ui/ActionBar.tsx` | 型のみValidAction[]に更新（ロジック未変更） |
| 変更 | `src/ui/ActionBar.test.tsx` | 型更新 |
| 変更 | `src/ui/GameScreen.tsx` | 型更新 |
| 変更 | `src/ui/GameScreen.test.tsx` | 型更新 |

## 確認コマンド
```bash
npm test
npm run build
```