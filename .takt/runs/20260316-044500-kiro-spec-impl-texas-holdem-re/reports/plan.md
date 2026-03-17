# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 3` — ショーダウン時のポット配分の正当性確保（タスク 3.1）

## 分析結果

### 目的
単一ポットの前提で、ショーダウン時の配分後にいかなるプレイヤーのチップも負にならないことを保証する。オールインが複数いる場合の配分ロジックを確認し、必要なら修正する。仕様として単一ポット・簡略化配分であることをコード上で明記する。

### スコープ
- **変更対象**: `src/domain/showdown.ts`（49行）のみ
- **呼び出し元への影響**: なし（パブリックAPIの型・シグネチャは変更しない）
  - `src/application/gameFlow.ts:47,66,77` から呼ばれるが、振る舞い互換

### 現行コードの安全性検証

`evaluateShowdown`（showdown.ts:28-40）の配分ロジック:
```
share = Math.floor(pot / winners.length)   // 常に 0 以上
remainder = pot - share * winners.length    // 常に 0 以上、< winners.length
winners → chips + share + extra(remainder)  // 加算のみ
non-winners → chips そのまま               // 変更なし
pot → 0
```

| 検証項目 | 結果 | 根拠 |
|---------|------|------|
| chips が負になりうるか | **No** | showdown.ts:36 — `p.chips + share + extra` は加算のみ。減算パスなし |
| pot を超える配分が発生するか | **No** | `share * winners.length + remainder = pot` は算術的に常に成立 |
| ロジック修正が必要か | **No** | 現行ロジックは正しく動作している |
| 仕様コメントがあるか | **No** — 追加が必要 | showdown.ts:28 に JSDoc/コメントなし |
| 防御的チェックがあるか | **No** — 追加が必要 | 不変条件（chips >= 0）のアサーションなし |

`resolveUncontestedPot`（showdown.ts:42-49）も同様に加算のみで安全だが、一貫性のため同じ対応を行う。

### 実装アプローチ

1. **`evaluateShowdown` に JSDoc コメントを追加**
   - 単一ポットの簡略化仕様であること（サイドポット未対応）
   - 配分ルール: 均等分配 + 端数は最初の勝者へ
   - 不変条件: 配分後の全プレイヤー chips >= 0

2. **配分後の防御的アサーションを追加**
   - 配分後に全プレイヤーの `chips >= 0` を検証
   - 違反時は `Error` を throw して不正状態への遷移を防止

3. **`resolveUncontestedPot` にも同様の JSDoc とアサーションを追加**
   - 一貫性のため同じパターンで対応

4. **テストで追加すべきケース**
   - オールインして chips=0 のプレイヤーが勝者に含まれるケース → pot から正しく加算される
   - 複数の異なるチップ額のオールインプレイヤーがいるショーダウン → 全プレイヤー chips >= 0、チップ保存則成立
   - pot=0 のエッジケース → エラーにならない

### 参照すべき既存実装パターン
- **配分ロジック**: `src/domain/showdown.ts:28-40`
- **テストパターン**: `src/domain/showdown.test.ts:211-303` — エッジケーステスト（3人引き分け、奇数ポット、4人引き分け）で `calcTotalChips` によるチップ保存則検証済み
- **テストヘルパー**: `src/domain/testHelpers.ts:10-12` — `calcTotalChips` 関数

### 注意すべきアンチパターン
- サイドポット実装はスコープ外。仕様の明示と防御的チェックに留めること
- アサーション追加時にロジックの書き換えをしないこと（現行ロジックは正しい）