# タスク完了サマリー

## タスク
CPUのレイズ/ベット額がルール上有効な範囲（`getValidActions`のmin/max）に収まるようにクランプする（タスク5.1）。ショートスタック時にも`applyAction`のバリデーションを通過することを保証する。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 変更 | `src/domain/cpuStrategy.ts` | `clampToValidRange`関数を追加し、全5箇所のbet/raiseアクション生成でValidActionのmin/maxによるクランプを適用 |
| 変更 | `src/domain/cpuStrategy.test.ts` | ショートスタック時のクランプ検証・min/max範囲検証・applyAction結合テスト等6テストケースを追加（全33テスト合格） |

## 確認コマンド
```bash
npx vitest run src/domain/cpuStrategy.test.ts
npm run build
```