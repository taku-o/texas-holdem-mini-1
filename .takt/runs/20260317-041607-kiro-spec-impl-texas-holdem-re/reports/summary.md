# タスク完了サマリー

## タスク
タスク10: リスト表示の key を配列インデックスから安定した識別子（`${card.suit}-${card.rank}`）に変更する。

## 結果
完了

## 変更内容
| 種別 | ファイル | 概要 |
|------|---------|------|
| 変更 | `src/ui/TableView.tsx` | コミュニティカードの `key={index}` → `key={`${card.suit}-${card.rank}`}` に変更 |
| 変更 | `src/ui/PlayerSeat.tsx` | ホールカードの `key={index}` → `key={`${card.suit}-${card.rank}`}` に変更 |
| 変更 | `src/ui/TableView.test.tsx` | 再レンダリング時のカード表示正確性テストを追加 |
| 変更 | `src/ui/PlayerSeat.test.tsx` | showCards切替時の再レンダリングテストを追加 |

## 確認コマンド
```bash
npm test
npm run build
```