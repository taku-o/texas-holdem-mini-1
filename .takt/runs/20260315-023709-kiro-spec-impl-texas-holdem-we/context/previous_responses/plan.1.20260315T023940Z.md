十分な調査が完了しました。以下に計画レポートをまとめます。

---

## 計画レポート: タスク 2 — ゲーム用データ型と定数の定義

### タスク概要

**タスク 2.1**: カード・プレイヤー・ゲーム状態・役ランク・プレイヤーアクションを表す型と、初期チップ数などの定数を定義する。

**関連要件**: 1.1, 1.2, 2.1, 3.3

### 現状分析

- `src/` には `App.tsx`, `main.tsx`, `App.test.tsx`, `index.css`, `vite-env.d.ts` のみ存在。ドメイン層のコードは一切ない。
- `@pokertools/evaluator` は未インストール（タスク3で対応予定）。
- 本タスクは純粋な型・定数定義のみ。ロジックの実装は後続タスク（3〜6）が担当する。

### 要件ごとの変更要否判定

| 要件 | 内容 | 判定 | 根拠 |
|------|------|------|------|
| 1.1 | 参加者6（ディーラー1+プレイヤー5）を型で表現 | **変更要** | 該当する型定義が存在しない |
| 1.2 | 人間1+CPU4の構成を型で表現 | **変更要** | 同上 |
| 2.1 | 初期チップ1000の定数化 | **変更要** | 同上 |
| 3.3 | ブラウザメモリのみで保持する想定の設計 | **変更要（設計レベル）** | GameStateを永続化なし前提で設計する |

### ファイル構成

design.md のレイヤー構成に従い、Domain層に型定義ファイルを配置する。

| ファイル | 責務 | 推定行数 |
|---------|------|---------|
| `src/domain/types.ts` | Card, Suit, Rank, Player, PlayerAction, GamePhase, GameState, HandRank の型定義 | 80〜120行 |
| `src/domain/constants.ts` | INITIAL_CHIPS, PLAYER_COUNT, CPU_COUNT, SMALL_BLIND, BIG_BLIND 等の定数 | 20〜30行 |

**2ファイルに分ける理由:**
- `types.ts`: 型定義（型はランタイムに影響しない宣言）
- `constants.ts`: 定数（ランタイムの値定義）。定数は types に依存するが逆は不可。
- 合計150行以下のため、200行上限を余裕でクリア。

### 型設計の詳細

#### `src/domain/types.ts`

design.md の Data Models セクション（374〜411行）に基づく。

```typescript
// カード関連
Suit: 'spades' | 'hearts' | 'diamonds' | 'clubs'
Rank: '2' | '3' | ... | 'A'
Card: { suit: Suit; rank: Rank }

// プレイヤー関連
Player: {
  id: string
  isHuman: boolean
  chips: number
  holeCards: Card[]    // 最大2枚
  folded: boolean
  currentBetInRound: number
}

// アクション関連
ActionType: 'fold' | 'check' | 'call' | 'bet' | 'raise'
PlayerAction: { type: ActionType; amount?: number }

// ゲームフェーズ
GamePhase: 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

// ゲーム状態（集約ルート）
GameState: {
  phase: GamePhase
  dealerIndex: number
  players: Player[]
  communityCards: Card[]
  pot: number
  currentBet: number
  currentPlayerIndex: number
  humanPlayerId: string
  deck: Card[]   // 残りデッキ（配り切り管理用）
}

// 役ランク（HandEvaluator の出力型）
HandRankCategory: 'high-card' | 'one-pair' | ... | 'royal-flush'
HandRank: { category: HandRankCategory; score: number }
```

**設計判断:**

1. **GamePhase に `'setup'` を含めない**: design.md の state diagram では Setup が独立状態だが、実際のコード上では `'idle'` → `setupNewGame()` → `'preflop'` の遷移で Setup は一時的な処理であり、状態として保持する必要がない。ただし design.md には Setup が明示されているため、Coder判断で `'setup'` を追加してもよいが、不要であれば省略可。

2. **`deck: Card[]` の追加**: design.md の GameState には明示されていないが、「各プレイヤーにホールカード2枚を配る」「フロップ3枚・ターン1枚・リバー1枚」を実装するには残りデッキの管理が不可欠。タスク4で必要になるため、型定義の時点で含める。

3. **HandRank の `score`**: `@pokertools/evaluator` が返す数値ランク（比較可能）をそのまま保持する想定。タスク3でアダプタを実装する際に具体化する。

#### `src/domain/constants.ts`

```typescript
INITIAL_CHIPS = 1000          // 要件 2.1
PLAYER_COUNT = 5              // 要件 1.1（プレイヤー5名）
CPU_COUNT = 4                 // 要件 1.2
SMALL_BLIND = 5               // design.md: SB=5 を例示
BIG_BLIND = 10                // design.md: BB=10 を例示
```

design.md（80〜84行）に「具体値は実装時に定義する（例: SB=5, BB=10 など、初期チップ1000に対して妥当な水準）」と記載あり。SB=5, BB=10 は初期チップ1000の 0.5%/1% で妥当。

### Coder向け実装ガイドライン

1. **参照すべき既存パターン**: 既存のドメインコードはないため、design.md の Data Models セクション（374〜411行）を直接参照して型を定義すること。

2. **ディレクトリ作成**: `src/domain/` ディレクトリを新規作成する。

3. **TypeScript strict mode**: `tsconfig.app.json` で `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` が有効。未使用の型はエクスポートしても問題ないが、未使用の変数・関数は禁止。

4. **any 禁止**: tech.md に明記（`any禁止`）。全型を明示的に定義する。

5. **イミュータブル設計**: ナレッジに状態の直接変更（ミューテーション）がREJECTと記載あり。型定義の段階では `Readonly` ラッパーは不要（実装側で対応）だが、型自体が mutable を前提とした設計にしないこと。

6. **string literal union vs enum**: TypeScript のイディオムとして `string literal union` を推奨（`type Suit = 'spades' | ...`）。enum は避ける（non-Goals の過度な抽象化に該当）。

7. **注意すべきアンチパターン**:
   - **マジックナンバー**: 定数は必ず `constants.ts` に名前付きで定義。型定義内にハードコードしない。
   - **God Object**: GameState が肥大化しやすい。design.md で定義されたフィールドのみに留め、タスク範囲外のフィールドを追加しない。
   - **過度な汎用化**: 将来の拡張（サイドポット、複数テーブル等）を見越した型を追加しない。

8. **影響範囲**: 本タスクは新規ファイル追加のみ。既存ファイルへの変更なし。後続タスク（3〜10）がこれらの型・定数をインポートして使用する。

### 確認事項

なし。要件・設計ドキュメントから全ての情報が得られており、ユーザーに確認すべき事項はない。