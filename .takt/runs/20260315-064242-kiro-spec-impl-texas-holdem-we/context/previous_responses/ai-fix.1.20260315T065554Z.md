全テスト213件パス。以下に修正報告をまとめます。

---

## 確認したファイル
- `src/domain/cpuStrategy.ts` — 全体（修正前150行）
- `src/domain/betting.ts:10` — `canCheck` の条件（`player.currentBetInRound >= state.currentBet`）を確認し、`canCheck === false` のとき `costToCall > 0` が常に真であることを検証

## 実行した検索
- `betting.ts` の `getValidActions` を読み、`check` が有効になる条件（L10: `player.currentBetInRound >= state.currentBet`）を確認。逆に `canCheck === false` なら `player.currentBetInRound < state.currentBet` であり `costToCall > 0` は自明。

## 修正内容

### Finding 1: AI-COMMENT-cpuStrategy（What/Howコメント削除）
- **L50-52**: `// three-of-a-kind 以上 → strong` 等の3行コメントを削除（switch文から自明）
- **L77**: `// BIG_BLIND の倍数に切り下げ` を削除（`Math.floor(rawAmount / BIG_BLIND) * BIG_BLIND` から自明）
- **L135**: `// weak` コメントを削除（`strong`/`medium` の条件を通過した後なので自明）
- **L120**: `// タダで見られるならチェック` は Why コメントとして残した（レビュー指示通り）

### Finding 2: AI-DRY-cpuStrategy（DRY違反解消）
- **`strong` ブロック（旧L106+110）**: `calculateBetAmount` の呼び出しをブロック先頭で1回に統合し、`canBet`/`canRaise` の分岐で共用
- **`medium` ブロック（旧L122+126）**: 同様に `roll < 0.3` ブロック先頭で1回計算に統合

### Finding 3: AI-DEAD-cpuStrategy（冗長条件+未使用変数削除）
- **旧L145**: `if (costToCall > 0 && roll < 0.3)` → `if (roll < 0.3)` に簡略化（`canCheck === false` の時点で `costToCall > 0` は常に真のため）
- **旧L96**: `costToCall` 変数宣言を削除（参照箇所がなくなったため）

## テスト結果
- `npm test` — 13ファイル、213テスト全パス