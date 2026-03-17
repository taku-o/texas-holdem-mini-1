## arch-review
Now I have a complete understanding of the changes. Let me compile the review.

---

# アーキテクチャレビュー

## 結果: APPROVE

## サマリー
ブラインド処理のチップ0プレイヤースキップとショートスタック対応（タスク3）の変更。`findNextEligibleIndex` の抽出による DRY 改善、`postBlinds` の `currentBet` 修正、テストの充実化が適切に行われている。構造・設計上のブロッキング問題は検出されなかった。

## 変更スコープ

| 指標 | 値 |
|------|-----|
| 変更ファイル数 | 7（ソース3 + テスト3 + spec1） |
| 変更行数 | +428 / -38（テスト中心） |
| スコープサイズ | Medium |
| 論理的まとまり | ✅ ブラインド処理のスキップロジック統一 |

## 前回指摘の追跡
前回のアーキテクチャレビュー実績なし（初回レビュー）。

## 検証した項目

### 構造・設計

| 観点 | 結果 | 根拠 |
|------|------|------|
| ファイル行数 | ✅ | dealing.ts:60行, showdown.ts:56行, handProgression.ts:123行 — 全て200行未満 |
| 1ファイル1責務 | ✅ | dealing.ts=ディール/ブラインド, showdown.ts=ショーダウン, handProgression.ts=ハンド進行 |
| モジュール結合 | ✅ | handProgression → dealing, betting の一方向依存。循環なし |
| 関数設計 | ✅ | `findNextEligibleIndex`:単一責務（次の有資格プレイヤー検索）、13行 |
| DRY | ✅ | 旧 `getNextDealerIndex` 内のループを `findNextEligibleIndex` に統合し重複排除 |

### コード品質

| 観点 | 結果 | 根拠 |
|------|------|------|
| イミュータブル操作 | ✅ | showdown.ts: `map` + スプレッドで新オブジェクト返却 |
| 未使用コード | ✅ | 旧 `getNextDealerIndex` のインラインループは削除済み。新コードに未使用 import/変数なし |
| コメント品質 | ✅ | showdown.ts:28-30, 46-47 は Why コメント（設計判断の理由を説明） |
| any型 | ✅ | 使用なし |
| TODO | ✅ | なし |
| エラー握りつぶし | ✅ | なし |

### 呼び出しチェーン検証

| チェーン | 結果 | 根拠 |
|---------|------|------|
| `findNextEligibleIndex` の呼び出し元 | ✅ | dealing.ts:20,21（postBlinds内）, handProgression.ts:69（getNextDealerIndex内）— 全て適切に使用 |
| `postBlinds` → `lastAggressorIndex` → `preparePreflopRound` | ✅ | `postBlinds` が常に `lastAggressorIndex: bbIndex` を設定し、`preparePreflopRound` が `nextState.lastAggressorIndex!` で参照。`!` 非null表明は `postBlinds` の事後条件により保証される |
| `findNextEligibleIndex` の -1 返却 | ✅ | `getNextDealerIndex` は `-1` をフォールバック処理。`postBlinds` は `isGameOver` により最低2人のチップ保有者が保証される文脈で呼ばれる |

### パブリック API

| 観点 | 結果 | 根拠 |
|------|------|------|
| `findNextEligibleIndex` のエクスポート | ✅ | ドメインレベルの操作（次の有資格プレイヤー検索）。dealing モジュールの責務に合致し、handProgression から参照される |
| `getNextDealerIndex` | ✅ | private（export なし）。内部関数として適切 |

### `findNextEligibleIndex` vs `getNextActivePlayerIndex` の重複検証

| 関数 | 条件 | 用途 | 返却値 |
|------|------|------|--------|
| `findNextEligibleIndex` | `chips > 0` | ブラインド/ディーラー位置決定 | -1（該当なし） |
| `getNextActivePlayerIndex` | `!folded && chips > 0` | ベッティング順序 | fromIndex（該当なし） |

条件が異なり（folded チェックの有無）、返却値の意味論も異なるため、DRY 違反には該当しない。

### テストカバレッジ

| 対象 | 結果 | 根拠 |
|------|------|------|
| `findNextEligibleIndex` | ✅ | 正常系、スキップ、ラップアラウンド、該当なし（-1）の4ケース |
| `postBlinds` スキップ | ✅ | SB位置/BB位置/連続/lastAggressor更新の各パターン |
| `postBlinds` currentBet | ✅ | BB十分/BBショートスタック/SBのみショートの3パターン |
| showdown ポット配分 | ✅ | オールイン勝者/chips=0勝者/pot=0のエッジケース |
| resolveUncontestedPot | ✅ | chips=0勝者/pot=0 |

### 仕様準拠

| 観点 | 結果 | 根拠 |
|------|------|------|
| 設計判断（coder-decisions.md） | ✅ | 到達不能な防御コード（throw）は前回 AI レビューで削除済み。決定ログの判断自体は前回イテレーションで解消された |
| currentBet の修正 | ✅ | `BIG_BLIND` 固定→`bbAmount`（実際の BB 額）は、ショートスタック BB の仕様に合致 |

## 今回の指摘（new）
なし

## 継続指摘（persists）
なし

## 解消済み（resolved）
なし（初回レビュー）

## Warning（非ブロッキング）

| 観点 | 内容 |
|------|------|
| テストファイル行数 | handProgression.test.ts:552行、showdown.test.ts:492行 — 300行超。現時点では describe ブロックで論理的に分割されており保守性に支障はないが、今後テスト追加時にはファイル分割を検討すること |

## REJECT 判定条件
- `new`、`persists`、`reopened` いずれも0件のため **APPROVE**

---

## supervise
バックグラウンドタスクのテスト結果も確認済みです（exit code 0 — 全テストパス）。

上記の最終検証結果の通り、**APPROVE** です。タスク3.1（ショーダウン時のポット配分の正当性確保）の全要件が充足されており、テストも全パス、スコープ内の変更のみで問題ありません。