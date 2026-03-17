# アーキテクチャレビュー

## 結果: REJECT

## サマリー
betting.ts に DRY違反2箇所、説明コメント2箇所、ActionBar の単一真実源違反（計算式乖離）、applyAction のアクション種別バリデーション欠如を検出。ブロッキング6件のため REJECT。

## 確認した観点
- [x] 構造・設計
- [x] コード品質
- [x] 変更スコープ（Small: 87行差分、論理的にまとまっている）
- [x] テストカバレッジ（betting-validation.test.ts で新規振る舞いをカバー）
- [x] デッドコード
- [x] 呼び出しチェーン検証

## 今回の指摘（new）
| # | finding_id | family_tag | スコープ | 場所 | 問題 | 修正案 |
|---|------------|------------|---------|------|------|--------|
| 1 | ARCH-DRY-01 | dry-violation | スコープ内 | `src/domain/betting.ts:18-23` vs `27-32` | getValidActions 内の raise ロジック（minRaiseTotal/minRaiseCost/maxRaiseTotal 計算+push）が2分岐で完全重複 | raise 判定を if/else の外に出し共通パスで処理する。check/call の分岐後に `if (state.currentBet > 0)` で raise を一度だけ処理 |
| 2 | ARCH-DRY-02 | dry-violation | スコープ内 | `src/domain/betting.ts:139-141` vs `144-146` | isBettingRoundComplete 内の `nonFolded.every((p) => p.chips === 0 \|\| p.currentBetInRound >= state.currentBet)` が完全重複 | aggressor がアクティブ(chips>0)で currentPlayer===aggressor の場合のみ true を早期リターンし、それ以外は末尾の共通 `nonFolded.every(...)` に統一 |
| 3 | ARCH-WIRING-01 | single-source-of-truth | スコープ内 | `src/ui/ActionBar.tsx:29-35,73-78` | ActionBar が ValidAction.min/max を無視し getMinBet/getMinRaise/getSliderProps で独自計算。レイズ最小額がドメイン(`currentBet+BIG_BLIND`)とUI(`currentBet*2`)で乖離（例: currentBet=30→ドメイン40, UI 60） | getMinBet/getMinRaise/getSliderProps を削除し `validActions.find(a => a.type === chipInputMode)` の min/max を使用 |
| 4 | ARCH-COMMENT-01 | explanation-comment | スコープ内 | `src/domain/betting.ts:43` | `// bet/raise は個別のバリデーションで検証するため、ここでは fold/check/call のみチェック` — 直後の条件式の動作をそのまま言い換えた What コメント | コメントを削除 |
| 5 | ARCH-COMMENT-02 | explanation-comment | スコープ内 | `src/domain/betting.ts:138` | `// lastAggressor がオールイン → 全アクティブプレイヤーが currentBet に揃ったか` — 直後の return 式の動作を言い換えた What コメント | コメントを削除（ARCH-DRY-02 の修正で該当行自体が消える） |
| 6 | ARCH-VALIDATION-01 | validation-gap | スコープ内 | `src/domain/betting.ts:44` | applyAction が bet/raise のアクション種別妥当性を未検証。currentBet>0 で bet を送信すると currentBetInRound がセット（+=ではなく=）され金額計算が狂う。設計決定#1 の動機は妥当だが種別チェック丸ごとスキップは過剰 | 全種別で getValidActions チェックを行うか、種別妥当性を直接検証（`bet → currentBet===0` / `raise → currentBet>0`）した上で金額バリデーションを実施 |

## 継続指摘（persists）
なし

## 解消済み（resolved）
なし

## 再開指摘（reopened）
なし