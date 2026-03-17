## 作業結果
- 計画レポートのサブタスク1.1〜1.4に対応するテストを23ケース作成した
- 既存プロダクションコードで動作する11テストはパス、実装予定の新機能に対する12テストは想定通り失敗することを確認した

## 変更内容
- **作成**: `src/domain/betting-validation.test.ts` — 以下の4カテゴリのテスト
  - `getValidActions - chip-based filtering (1.2)`: チップ残高によるbet/raise可否判定（5テスト）
  - `getValidActions - min/max range (1.4)`: bet/raiseアクションのmin/max範囲返却（5テスト）
  - `applyAction - amount validation (1.1)`: ベット・レイズ額のバリデーション（8テスト）
  - `isBettingRoundComplete - all-in aggressor (1.3)`: オールインaggressorのラウンド終了判定（5テスト）