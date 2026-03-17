レビューに必要な全ファイルの確認が完了しました。分析結果をまとめます。

---

## AI Antipattern Review Report

### レビュー対象
| ファイル | 変更内容 |
|---------|---------|
| `src/domain/dealing.ts` | `dealHoleCards`: foldedプレイヤーへのカード配布スキップ |
| `src/domain/handProgression.ts` | `startNextHand`: `folded: false` → `folded: p.chips === 0` |

### タスク要件との照合（Task 4.1, 4.2）

- **4.1** 「チップ0のプレイヤーを次ハンドに参加させない」
  - ✅ `startNextHand` で `folded: p.chips === 0` を設定 → `dealHoleCards` が `p.folded` をチェックしてカードを配らない
- **4.2** 「ディーラー・席順・ブラインドの計算でチップ0のプレイヤーをスキップする」
  - ✅ `findNextEligibleIndex` は既に `chips > 0` をチェック済み（変更なし・元から対応済み）
  - ✅ `postBlinds` は `findNextEligibleIndex` を使用（変更なし・元から対応済み）
  - ✅ `getNextActivePlayerIndex` は `!player.folded && player.chips > 0` をチェック済み

### AI Antipattern チェック結果

| 観点 | 結果 |
|------|------|
| 幻覚API・存在しないメソッド | ✅ 問題なし — 使用している全API・プロパティは型定義に存在 |
| 仮定の妥当性 | ✅ 問題なし — `folded` フィールドで「ハンド不参加」を表すのはドメイン的に正しい。`showdown.ts:12` は `folded` をチェック済み、`getNextActivePlayerIndex` は `!folded && chips > 0` で二重チェック |
| 既存コードベースとの整合性 | ✅ 問題なし — `map` + スプレッド構文による不変更新パターンはプロジェクト全体で統一されている |
| スコープクリープ | ✅ 問題なし — 変更は最小限で、要求された機能のみを実装 |
| スコープ縮小（要件取りこぼし） | ✅ 問題なし — Task 4.1, 4.2 の要件を網羅 |
| フォールバック・デフォルト値の濫用 | ✅ 問題なし — 不要なフォールバックは追加されていない |
| デッドコード | ✅ 問題なし — 不要なコードの追加・残存はない |
| 不要な後方互換コード | ✅ 問題なし |
| 配線忘れ | ✅ 問題なし — `startNextHand` → `preparePreflopRound` → `dealHoleCards` のフローで正しく接続 |
| オブジェクト/配列の直接変更 | ✅ 問題なし — `state.players.map((p) => ({...p}))` でコピー生成後に変更。`let deckIndex` はローカルプリミティブ変数の更新であり、入力オブジェクトの変更ではない |
| コピペパターン | ✅ 問題なし |
| 冗長な条件分岐 | ✅ 問題なし |

### ボーイスカウトルール確認

変更ファイル内の既存コードについても確認：

- **`dealing.ts`**: `findNextEligibleIndex`、`postBlinds`、`dealCommunityCards` — 問題なし
- **`handProgression.ts`**: `preparePreflopRound`、`advancePhase`、`getNextDealerIndex`、`isGameOver`、`getActivePlayerCount` — 問題なし。未使用コード・不適切な命名・壊れた抽象化なし

### テストカバレッジ確認

- `dealHoleCards` のfoldedスキップ: テスト3件追加済み（`should not deal cards to folded players`、`should consume deck cards only for non-folded players`、`should deal unique cards to non-folded players when some are folded`）
- `startNextHand` のchips=0除外: テスト4件追加済み（単一チップ0プレイヤー、複数チップ0プレイヤー、ホールカード未配布、ディーラースキップ）

---

## 判定: **APPROVE**

ブロッキング問題は検出されませんでした。変更は最小限かつ正確で、タスク要件を網羅しています。AI特有の問題（幻覚API、過剰エンジニアリング、フォールバック濫用、デッドコード、配線忘れ等）はいずれも該当しません。