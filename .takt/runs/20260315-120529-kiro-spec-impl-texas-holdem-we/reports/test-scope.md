# 変更スコープ宣言

## タスク
タスク9: ゲーム画面ルートと開始・終了・再開のUI — GameScreenコンポーネントとApp.tsxのテスト作成

## 変更予定
| 種別 | ファイル |
|------|---------|
| 作成 | `src/ui/GameScreen.test.tsx` |
| 変更 | `src/App.test.tsx` |

## 推定規模
Medium

## 影響範囲
- `src/ui/GameScreen.tsx`（新規作成予定のコンポーネント）
- `src/App.tsx`（useGameController統合予定）
- `src/ui/TableView.tsx`, `src/ui/PlayerSeats.tsx`, `src/ui/ActionBar.tsx`（子コンポーネントとして配線確認）