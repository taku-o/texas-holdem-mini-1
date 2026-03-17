# 変更スコープ宣言

## タスク
タスク3: ショーダウン時のポット配分の正当性確保 - テスト作成（追加不要）

## 変更予定
| 種別 | ファイル |
|------|---------|
| なし | - |

## 推定規模
Small（変更なし）

## 影響範囲
- なし

## 判断根拠

既存テスト `src/domain/showdown.test.ts`（492行）がタスク3の全要件を既にカバーしているため、テストの追加は不要と判断しました。

### 既存テストのカバレッジ確認結果

| 要件 | 対応テスト | 状態 |
|------|-----------|------|
| chips=0（オールイン）複数プレイヤーのポット配分 | `evaluateShowdown ポット配分の正当性` > all-in players with different chip amounts win | ✅ カバー済み |
| chips=0の勝者へのpot全額加算 | `evaluateShowdown ポット配分の正当性` > correctly distribute pot to a winner with chips=0 | ✅ カバー済み |
| pot=0のエッジケース | `evaluateShowdown ポット配分の正当性` > handle pot=0 without error | ✅ カバー済み |
| 3-way タイの端数処理 | `evaluateShowdown エッジケース` > split pot among 3 tied players with remainder | ✅ カバー済み |
| 4-way タイの端数処理 | `evaluateShowdown エッジケース` > split pot among 4 tied players with remainder | ✅ カバー済み |
| 奇数ポットの2人分割 | `evaluateShowdown エッジケース` > handle odd pot with 2 tied players | ✅ カバー済み |
| resolveUncontestedPot でchips=0の勝者 | `resolveUncontestedPot ポット配分の正当性` > winner had chips=0 | ✅ カバー済み |
| resolveUncontestedPot でpot=0 | `resolveUncontestedPot ポット配分の正当性` > handle pot=0 | ✅ カバー済み |
| チップ保存則の検証 | `calcTotalChips` による検証が複数テストで実施 | ✅ カバー済み |
| 不変性（元状態の非破壊） | `evaluateShowdown` / `resolveUncontestedPot` の not mutate テスト | ✅ カバー済み |

### 構造的安全性

配分ロジック（`showdown.ts:36-41`）は `p.chips + share + extra` と加算のみで構成されており、`share`（`Math.floor(pot / winners.length)`）と `extra`（`remainder`）はいずれも非負値です。chips に対する減算操作が存在しないため、配分後に chips が負になる経路は構造的に存在しません。