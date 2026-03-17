# アーキテクチャレビュー

## 結果: APPROVE

## サマリー
前回指摘の ARCH-001（デッドコード）と ARCH-002（DRY違反・配線漏れ）が両方とも適切に修正された。新規のブロッキング問題は検出されない。

## 確認した観点
- [x] 構造・設計
- [x] コード品質
- [x] 変更スコープ
- [x] テストカバレッジ
- [x] デッドコード
- [x] 呼び出しチェーン検証

## 解消済み（resolved）
| finding_id | 解消根拠 |
|------------|----------|
| ARCH-001-betting-L38 | `src/domain/betting.ts:38-39` — バイパス削除済み、単純 `throw` に復元。回帰テスト2件追加（`betting-validation.test.ts:508-553`） |
| ARCH-002-actionbar-L33 | `src/ui/ActionBar.tsx:23-25,60-68` — `findAction()` で `ValidAction.min/max` を取得。`getMinBet`/`getMinRaise` 完全削除。`ActionBarProps` から不要 props 3件削除、`GameScreen.tsx:49-52` で対応済み |