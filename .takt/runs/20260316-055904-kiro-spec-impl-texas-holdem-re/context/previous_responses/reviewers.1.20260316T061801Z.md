## arch-review
レビューに必要な情報は揃いました。レビュー結果をまとめます。

---

# アーキテクチャレビュー

## 結果: APPROVE

## サマリー
タスク5（CPUレイズ額クランプ）およびタスク6（handEvaluator改善）の変更は、構造的に健全であり、設計原則に準拠している。`clampToValidRange` 関数の導入は単一責務で凝集度が高く、`DESCRIPTION_TO_CATEGORY` への切り替えはマジックナンバー依存の解消として適切。新規テストは振る舞いをカバーし、applyAction統合テストで呼び出しチェーンも検証されている。

## 変更スコープ
| 項目 | 値 |
|------|-----|
| 変更行数 | +309/-26 (テスト含む) |
| スコープサイズ | Medium |
| ソース変更ファイル | `cpuStrategy.ts` (148行), `handEvaluator.ts` (64行) |
| テスト変更ファイル | `cpuStrategy.test.ts`, `handEvaluator.test.ts` |
| 論理的まとまり | ✅ タスク5・6に対応する変更のみ |

## 検証した観点

### 構造・設計
| 観点 | 結果 | 備考 |
|------|------|------|
| ファイル行数 | ✅ | `cpuStrategy.ts` 148行, `handEvaluator.ts` 64行（いずれも200行未満） |
| 1ファイル1責務 | ✅ | handEvaluator=ハンド評価、cpuStrategy=CPU意思決定 |
| 関数設計（1関数1責務） | ✅ | `clampToValidRange` はクランプのみ、`evaluate` は評価のみ |
| レイヤー設計・依存方向 | ✅ | cpuStrategy→betting, cpuStrategy→handEvaluator（上位→下位） |
| 循環依存 | ✅ | なし |
| パブリックAPI公開範囲 | ✅ | `clampToValidRange` は非export（内部関数） |

### モジュール化・凝集度
| 観点 | 結果 | 備考 |
|------|------|------|
| `clampToValidRange` 導入 | ✅ | ベット/レイズ額の正規化を一箇所に集約。5箇所の呼び出しがすべてこの関数を経由 |
| `DESCRIPTION_TO_CATEGORY` 導入 | ✅ | ライブラリ公開API `rankDescription` を使用。マジックナンバー排除 |
| 操作の一覧性 | ✅ | CPU戦略の判断フロー（strength判定→行動選択→額クランプ）が `decideAction` 内で明確 |

### コード品質
| 観点 | 結果 | 備考 |
|------|------|------|
| `any` 型 | ✅ | なし |
| 未使用コード | ✅ | 旧 `LIB_RANK_TO_CATEGORY`、`as number` キャスト完全除去 |
| TODO コメント | ✅ | なし |
| 説明コメント | ✅ | なし |
| フォールバック濫用 | ✅ | なし |
| エラー握りつぶし | ✅ | なし |
| デッドコード | ✅ | なし |
| DRY | ✅ | クランプ処理が `clampToValidRange` に集約済み |

### 呼び出しチェーン検証
| 観点 | 結果 | 備考 |
|------|------|------|
| `clampToValidRange` の呼び出し元 | ✅ | `decideAction` 内の5箇所すべてで `canBet`/`canRaise` ガード後に `betAction!`/`raiseAction!` を使用。`getValidActions` が `bet`/`raise` に常に `min`/`max` を設定することを `betting.ts:14,25` で確認済み |
| `rankDescription` の戻り値 | ✅ | `@pokertools/evaluator` の公開APIを使用。9種の記述文字列がマッピングに網羅 |
| `evaluate` の呼び出し元 | ✅ | `cpuStrategy.ts:48` からのみ呼ばれ、戻り値 `HandRank` が正しく消費されている |

### テストカバレッジ
| 観点 | 結果 | 備考 |
|------|------|------|
| クランプ動作のテスト | ✅ | 6テスト追加（min/maxクランプ、applyAction統合テスト） |
| handEvaluator追加テスト | ✅ | エースローSF判定、異スートRF判定の2テスト追加 |
| applyAction統合検証 | ✅ | `applyAction` を直接呼び出し、エラーなしを無条件で検証 |

### 契約文字列・ハードコード
| 観点 | 結果 | 備考 |
|------|------|------|
| `DESCRIPTION_TO_CATEGORY` のキー文字列 | ✅ | ライブラリの `rankDescription` 公開APIが返す文字列にマッピング。旧数値マッピングより安定（公開APIの契約） |
| `ROYAL_FLUSH_SCORE = 1` | ✅ | ライブラリのスコア体系に基づく定数。テストで動作確認済み |

## 今回の指摘（new）
なし

## 継続指摘（persists）
なし（前回のアーキテクチャレビューなし — 初回レビュー）

## 解消済み（resolved）
なし（前回指摘なし）

## 再開指摘（reopened）
なし

## Warning（非ブロッキング）

**W-001: テストの条件付きアサーション**
`cpuStrategy.test.ts` の「レイズ/ベット額がgetValidActionsのmin/max範囲にクランプされる」セクション内4テスト（行815〜968付近）で `if (action.type === 'raise')` / `if (action.type === 'bet')` によるガード付きアサーションが使われている。現在の入力条件では期待通りの分岐に入ることをトレースで確認したが、CPU戦略ロジックの変更時にアサーションがスキップされるリスクがある。`applyAction` 統合テスト（行970〜1028）が無条件で動作検証しているため、実害は限定的。

## REJECT判定条件
- `new`、`persists`、`reopened` いずれも0件のため **APPROVE**

---

## supervise
検証完了。全項目を確認しました。

---

# 最終検証結果

## 結果: APPROVE

## 要件充足チェック

タスク6/6.1 の根拠要件: **Requirement 7** — 「役判定（ロイヤルフラッシュ含む）を、外部ライブラリの内部定数に直接依存しない形で利用する（アダプタでラップする、または必要な定数をアプリ側で定義して比較する等）」

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1 | ライブラリ内部の数値enum（0-8）への直接依存を排除する | ✅ | `src/domain/handEvaluator.ts:31-41` — `LIB_RANK_TO_CATEGORY`（数値キー）を `DESCRIPTION_TO_CATEGORY`（文字列キー）に置換。`rankDescription`公開APIを使用 |
| 2 | ロイヤルフラッシュ判定をアプリ側定数で行う | ✅ | `src/domain/handEvaluator.ts:57-58` — `baseCategory === 'straight-flush' && score === ROYAL_FLUSH_SCORE` でアプリ定義定数により判定 |
| 3 | `as number` キャスト（内部型への依存）を除去 | ✅ | `src/domain/handEvaluator.ts:53` — `rankBoard(boardStr)` の戻り値をそのまま使用、キャスト除去済み |
| 4 | `evaluate` 関数のシグネチャ・戻り値型は不変 | ✅ | `src/domain/handEvaluator.ts:49,63` — シグネチャ `evaluate(cards: Card[]): HandRank` 不変 |
| 5 | 旧コード（`LIB_RANK_TO_CATEGORY`、`libRank === 0`）が完全除去されていること | ✅ | git diff確認済み。旧定数・旧ロジック完全除去 |
| 6 | 7枚入力時のロイヤルフラッシュ誤判定（AR-001）が解消されていること | ✅ | `src/domain/handEvaluator.test.ts` — K-high SF+別スートAのテスト追加済み、`straight-flush`と正しく判定 |

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` — 24ファイル・437テスト全パス |
| 型チェック | ✅ | `npx tsc --noEmit` エラーなし |
| 動作確認 | ✅ | 全10カテゴリ判定、エッジケース（7枚入力、エースロー、スート違い）確認済み |
| スコープクリープ | ✅ | 変更ファイル3件（handEvaluator.ts, handEvaluator.test.ts, work.md）のみ。削除ファイルなし |
| AIレビュー指摘 | ✅ | AR-001は修正・解消済み。未対応指摘なし |

## 成果物

- 変更: `src/domain/handEvaluator.ts` — `rankDescription`公開API使用、文字列ベースのカテゴリマッピング、スコアベースのロイヤルフラッシュ判定
- 変更: `src/domain/handEvaluator.test.ts` — エッジケーステスト2件追加（エースロー判定、スート非依存ロイヤルフラッシュ）
- 変更: `.kiro/specs/texas-holdem-review-fixes/work.md` — 進捗更新