十分な調査ができました。以下が計画レポートです。

---

## 計画レポート: タスク7 — テーブル・カード・席の表示UI

### タスク概要

タスク7は2つのサブタスクで構成される:
- **7.1**: テーブル上にコミュニティカード（0〜5枚）とポット額を表示（Requirements: 4.2, 5.1, 5.2）
- **7.2**: 各席のプレイヤー（人間/CPU）・チップ数・手札・フォールド状態を表示し、人間の席を強調（Requirements: 1.1, 1.2, 2.2, 4.2, 7.2）

### 現状分析

**既存の実装:**
- Domain層（`src/domain/`）: 完成済み — types, betting, dealing, gameEngine, handEvaluator, cpuStrategy, showdown, handProgression
- Application層（`src/application/`）: 完成済み — `useGameController.ts`（React Hook）、`gameFlow.ts`
- UI層: **未実装** — `App.tsx` はプレースホルダーの「Texas Hold'em」テキストのみ

**利用可能なデータ（`useGameController` が提供する）:**
- `gameState: GameState | null` — phase, players[], communityCards[], pot, currentBet, currentPlayerIndex, humanPlayerId, dealerIndex
- `validActions: PlayerAction[]` — 有効なアクション一覧
- `isHumanTurn: boolean`
- `startGame(): void`
- `handleAction(action: PlayerAction): void`

**UI層に未だディレクトリがない。** `src/` 直下にはUI用のコンポーネントディレクトリが存在しない。

### 設計方針

#### ファイル構成

design.md のコンポーネント設計に従い、以下のファイルを新規作成する:

| ファイル | 責務 | 見込み行数 |
|---------|------|-----------|
| `src/ui/TableView.tsx` | コミュニティカード表示 + ポット額表示 | 40-60行 |
| `src/ui/PlayerSeat.tsx` | 1席分のプレイヤー表示（チップ・手札・状態） | 60-80行 |
| `src/ui/PlayerSeats.tsx` | 全席の配置レイアウト（楕円配置） | 40-60行 |
| `src/ui/CardView.tsx` | 1枚のカード表示（スート・ランク・裏面） | 40-60行 |

`App.tsx` はこの時点では変更しない（タスク9でGameScreenとして統合される）。ただし、コンポーネントの動作確認のためにタスク9が先に必要になる可能性があるが、タスク7の範囲はUI部品の作成のみ。

#### コンポーネント設計

**CardView** — 最小の表示単位
- Props: `card: Card | null`, `faceDown?: boolean`
- カードが `null` または `faceDown` の場合は裏面を表示
- スートに応じた色分け（♠♣ = 黒, ♥♦ = 赤）
- Apple風: 角丸、薄いシャドウ、クリーンな余白

**TableView** (Requirements: 4.2, 5.1, 5.2)
- Props: `communityCards: Card[]`, `pot: number`
- コミュニティカード0〜5枚をCardViewで横並びに表示
- ポット額を目立つように表示
- テーブル中央のゾーンとして配置される想定

**PlayerSeat** (Requirements: 1.1, 1.2, 2.2, 4.2, 7.2)
- Props: `player: Player`, `isHuman: boolean`, `isDealer: boolean`, `isCurrentTurn: boolean`, `showCards: boolean`
- 人間の席: 手札2枚を表面で表示、席を強調（ボーダー色やバッジ）
- CPU の席: 通常は裏面表示、ショーダウン時（`showCards=true`）のみ表面表示
- チップ数を常時表示
- フォールド状態: 不透明度を下げる等で視覚的に区別
- ディーラーボタン(D): ディーラーの席にマーカー表示
- 現在ターンのプレイヤー: ハイライト表示

**PlayerSeats**
- Props: `players: Player[]`, `humanPlayerId: string`, `dealerIndex: number`, `currentPlayerIndex: number`, `phase: GamePhase`
- 全5席を楕円/円形に配置
- `showCards` の判定: `phase === 'showdown'` のときCPUのカードも表示

#### カード表示の手札公開ルール

- 人間プレイヤー: **常に表面** を表示
- CPUプレイヤー: **ショーダウン時のみ** 表面を表示（`phase === 'showdown'` かつフォールドしていない場合）
- フォールド済みCPU: ショーダウン時でも裏面（または非表示）

根拠: design.md PlayerSeats セクション「CPUの手札はショーダウン時またはフォールド後など、ルールで見せてよいタイミングでのみ表示する」

#### スタイリング方針

- Tailwind CSS を使用（既にセットアップ済み）
- Apple HIG風: `rounded-xl`, `shadow-sm`, 充分な `p-*`/`gap-*`, `font-medium`/`font-semibold`
- カラー: 白ベース（`bg-white`）、テーブル面はグリーン系（`bg-emerald-700`/`bg-emerald-800`）
- カードサイズ: 適度な固定幅・高さ（`w-12 h-16` 程度、調整可能）

### 実装ガイドライン（Coder向け）

#### 参照すべき既存パターン

- **型定義**: `src/domain/types.ts` — `Card`, `Player`, `GameState`, `GamePhase` の型を使用
- **状態取得**: `src/application/useGameController.ts:1-45` — UIが受け取るデータの形
- **定数**: `src/domain/constants.ts` — `PLAYER_COUNT` (5) など
- **Apple風スタイル基盤**: `src/index.css:4-6` — フォントファミリー設定済み

#### 配線が必要な箇所

このタスクではUIコンポーネントを作成するのみ。親コンポーネント（GameScreen/App）との統合はタスク9で行うため、以下の配線は不要:
- App.tsx の変更は **しない**（タスク9のスコープ）
- useGameController との接続は **しない**（タスク9のスコープ）

各コンポーネントは props のみに依存するプレゼンテーションコンポーネントとして作成する。

#### 注意すべきアンチパターン

1. **300行超ファイル禁止**: 各コンポーネントは1ファイル200行以下を厳守。CardViewを独立ファイルに分離する理由
2. **ビジネスロジックのUI漏れ禁止**: 「ショーダウンかどうか」の判定は props の `showCards` で受け取る。UIコンポーネント内で `phase === 'showdown'` を判定しない（PlayerSeatsが変換してPlayerSeatに渡す）
3. **直接ミューテーション禁止**: props のオブジェクトを変更しない
4. **TODOコメント禁止**: 実装するか、しないか
5. **説明コメント（What/How）禁止**: コード自体が意図を語る状態にする

#### テスト方針

- 各コンポーネントの単体テストを作成（`@testing-library/react` 使用、既にdevDependenciesにある）
- テスト観点:
  - CardView: 表面/裏面の切り替え、スート色の表示
  - TableView: コミュニティカード0〜5枚の表示、ポット額表示
  - PlayerSeat: 人間/CPU表示の違い、フォールド状態、チップ表示、ディーラーマーカー
  - PlayerSeats: 5席の配置、ショーダウン時のカード公開

### 変更要/不要の判定

| 要件 | 判定 | 根拠 |
|------|------|------|
| 4.2 テーブル・カード・チップの視覚判別 | **変更要** | UI未実装 |
| 5.1 コミュニティカード表示 | **変更要** | UI未実装 |
| 5.2 ホールカード配布後の表示 | **変更要** | UI未実装 |
| 1.1, 1.2 参加者表示 | **変更要** | UI未実装 |
| 2.2 チップ数表示 | **変更要** | UI未実装 |
| 7.2 CPU行動の表示 | **変更要** | UI未実装 |

### 確認事項

なし。タスク指示書・design.md・既存コードから必要な情報はすべて取得済み。