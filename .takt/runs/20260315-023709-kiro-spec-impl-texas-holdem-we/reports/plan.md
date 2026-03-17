# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 2` — タスク2「ゲーム用データ型と定数の定義」の実装。

## 分析結果

### 目的
カード・プレイヤー・ゲーム状態・役ランク・プレイヤーアクションを表す型と、初期チップ数などの定数を定義する。参加者6（ディーラー1・プレイヤー5）、人間1・CPU4の構成を型で表現し、ブラウザメモリのみで保持する前提で設計する。

### スコープ
- 新規ファイル追加のみ。既存ファイルへの変更なし
- 後続タスク（3〜10）が全てこれらの型・定数をインポートして使用する
- 要件カバレッジ: 1.1, 1.2, 2.1, 3.3

### 要件ごとの変更要否

| 要件 | 内容 | 判定 | 根拠 |
|------|------|------|------|
| 1.1 | 参加者6（ディーラー1+プレイヤー5）を型で表現 | 変更要 | `src/domain/` が存在せず該当する型定義がない |
| 1.2 | 人間1+CPU4の構成を型で表現 | 変更要 | 同上 |
| 2.1 | 初期チップ1000の定数化 | 変更要 | 同上 |
| 3.3 | ブラウザメモリのみで保持する設計 | 変更要 | GameStateを永続化なし前提で設計する（型レベル） |

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| 型と定数を1ファイルにまとめる | 不採用 | 型宣言（コンパイル時のみ）と定数（ランタイム値）は責務が異なる。1ファイル複数責務はナレッジでREJECT |
| `types.ts` + `constants.ts` に分離 | **採用** | 責務が明確に分離される。定数は型に依存するが逆はなく、依存方向が単方向 |
| enum を使用する | 不採用 | TypeScriptのイディオムとしてstring literal unionが推奨。enumは過度な抽象化に該当 |

### 実装アプローチ

**ファイル構成:**

| ファイル | 責務 | 推定行数 |
|---------|------|---------|
| `src/domain/types.ts` | Card, Suit, Rank, Player, PlayerAction, GamePhase, GameState, HandRank の型定義 | 80〜120行 |
| `src/domain/constants.ts` | INITIAL_CHIPS, PLAYER_COUNT, CPU_COUNT, SMALL_BLIND, BIG_BLIND 等の定数 | 20〜30行 |

**`src/domain/types.ts` の型一覧:**

| 型名 | 種別 | 説明 | 根拠 |
|------|------|------|------|
| `Suit` | string literal union | `'spades' \| 'hearts' \| 'diamonds' \| 'clubs'` | design.md:409 Card定義 |
| `Rank` | string literal union | `'2' \| '3' \| ... \| 'A'` | design.md:409 Card定義 |
| `Card` | type | `{ suit: Suit; rank: Rank }` | design.md:409 |
| `Player` | type | id, isHuman, chips, holeCards, folded, currentBetInRound | design.md:399-405 |
| `ActionType` | string literal union | `'fold' \| 'check' \| 'call' \| 'bet' \| 'raise'` | design.md:382, 要件5.3 |
| `PlayerAction` | type | `{ type: ActionType; amount?: number }` | design.md:382 |
| `GamePhase` | string literal union | `'idle' \| 'preflop' \| 'flop' \| 'turn' \| 'river' \| 'showdown'` | design.md:388-389 |
| `GameState` | type | phase, dealerIndex, players, communityCards, pot, currentBet, currentPlayerIndex, humanPlayerId, deck | design.md:388-397 |
| `HandRankCategory` | string literal union | ハイカード〜ロイヤルストレートフラッシュの10種 | 要件5.5 |
| `HandRank` | type | `{ category: HandRankCategory; score: number }` | design.md:381, 要件5.4 |

**GameStateに `deck: Card[]` を追加する理由:**
design.md のGameState定義（388-397行）には `deck` が明示されていないが、タスク4.2「各プレイヤーにホールカード2枚を配る」、フロップ3枚・ターン1枚・リバー1枚の配布を実装するにはデッキ管理が不可欠。状態をブラウザメモリのみで保持する要件3.3を踏まえると、GameStateにデッキを含めるのが自然。

**`src/domain/constants.ts` の定数一覧:**

| 定数名 | 値 | 根拠 |
|--------|-----|------|
| `INITIAL_CHIPS` | `1000` | 要件2.1「各プレイヤーに初期チップを1000枚」 |
| `PLAYER_COUNT` | `5` | 要件1.1「プレイヤー5名」 |
| `CPU_COUNT` | `4` | 要件1.2「CPU4人」 |
| `SMALL_BLIND` | `5` | design.md:82「例: SB=5」初期チップ1000の0.5%で妥当 |
| `BIG_BLIND` | `10` | design.md:82「例: BB=10」初期チップ1000の1%で妥当 |

## 実装ガイドライン

- **参照すべき設計**: design.md の Data Models セクション（374〜411行）を直接参照して型を定義すること
- **ディレクトリ作成**: `src/domain/` を新規作成する
- **string literal union を使用**: enum ではなく `type Suit = 'spades' | 'hearts' | ...` 形式で定義する
- **any 禁止**: tech.md に明記。全型を明示的に定義する
- **過度な汎用化禁止**: サイドポット・複数テーブル・将来拡張を見越した型を追加しない。design.md で定義されたフィールドのみ（+ `deck` の例外）に留める
- **マジックナンバー禁止**: 定数は必ず `constants.ts` に名前付きで定義。型定義内にハードコードしない
- **`as const` の活用**: 定数値が型推論に使われる場合は `as const` で narrowing する
- **export**: 全ての型・定数を named export する。default export は使用しない

## 確認事項

なし。要件・設計ドキュメントから全ての情報が得られており、ユーザーに確認すべき事項はない。