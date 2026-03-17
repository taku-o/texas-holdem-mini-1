# 決定ログ

## 1. fireEvent を使用（userEvent ではなく）
- **背景**: ユーザーインタラクションのテストに fireEvent と @testing-library/user-event のどちらを使うか
- **検討した選択肢**: fireEvent（@testing-library/dom 同梱）、@testing-library/user-event（未インストール）
- **理由**: @testing-library/user-event がプロジェクトにインストールされていないため、追加依存なしで使える fireEvent を採用

## 2. インテグレーションテストは不要と判断
- **背景**: ActionBarは新規UIコンポーネントで、親コンポーネント統合はタスク9の範囲
- **検討した選択肢**: ActionBar単体テストのみ、useGameControllerとの統合テスト追加
- **理由**: ActionBarはprops経由のみで外部と通信し、3モジュール以上の横断フローがない。統合はタスク9（GameScreen）で行われるため、現時点ではユニットテストのみで十分