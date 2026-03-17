# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 7` — テーブル・カード・席の表示UIの実装（タスク7.1, 7.2）

## 分析結果

### 目的
ゲーム中のテーブル上にコミュニティカード（0〜5枚）とポット額を表示し、各席のプレイヤー（人間/CPU）・チップ数・手札・フォールド状態を表示するUIコンポーネント群を作成する。人間プレイヤーの席は強調表示する。

### スコープ
- **新規ファイル作成**: `src/ui/` ディレクトリ配下にUIコンポーネント4ファイル + テストファイル
- **既存ファイル変更なし**: `App.tsx` との統合はタスク9のスコープ
- **Domain層・Application層への変更なし**: UIはpropsのみに依存するプレゼンテーションコンポーネント

### 検討したアプローチ（設計判断がある場合）

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| 全UIを1ファイルに実装 | 不採用 | 300行超REJECT基準に違反。複数責務が同居する |
| CardView を PlayerSeat 内にインライン実装 | 不採用 | TableViewでも同じカード表示が必要で重複する。DRY違反 |
| CardView を独立コンポーネントに分離 | **採用** | TableView・PlayerSeatの両方から利用。1責務1ファイル |
| PlayerSeat と PlayerSeats を1ファイル | 不採用 | 責務が異なる（1席の表示 vs 全席のレイアウト配置） |
| UIコンポーネント内で phase を直接判定 | 不採用 | ビジネスロジックのUI漏れ。`showCards` props で受け取る |
| PlayerSeats 内で phase → showCards 変換 | **採用** | PlayerSeats がレイアウト責務と合わせて変換を担当し、PlayerSeat は純粋な表示に徹する |

### 実装アプローチ

#### ファイル構成

| ファイル | 責務 | 見込み行数 |
|---------|------|-----------|
| `src/ui/CardView.tsx` | 1枚のカード表示（表面/裏面） | 40-60行 |
| `src/ui/TableView.tsx` | コミュニティカード + ポット額 | 40-60行 |
| `src/ui/PlayerSeat.tsx` | 1席分のプレイヤー情報表示 | 60-80行 |
| `src/ui/PlayerSeats.tsx` | 全5席の配置レイアウト | 40-60行 |
| `src/ui/CardView.test.tsx` | CardView のテスト | 50-70行 |
| `src/ui/TableView.test.tsx` | TableView のテスト | 40-60行 |
| `src/ui/PlayerSeat.test.tsx` | PlayerSeat のテスト | 60-80行 |
| `src/ui/PlayerSeats.test.tsx` | PlayerSeats のテスト | 50-70行 |

#### コンポーネント設計

**CardView**
- Props: `{ card: Card | null; faceDown?: boolean }`
- `card === null` または `faceDown === true` → 裏面表示（背景パターン）
- 表面: ランク + スートを表示。♠♣ = 黒、♥♦ = 赤
- スタイル: 角丸（`rounded-lg`）、薄いシャドウ、白背景、固定幅高さ

**TableView**
- Props: `{ communityCards: Card[]; pot: number }`
- コミュニティカード0〜5枚を横並びで `CardView` を使って表示
- ポット額を下部にテキスト表示（例: "Pot: 120"）
- テーブル面はグリーン系背景（`bg-emerald-700` / `bg-emerald-800`）

**PlayerSeat**
- Props: `{ player: Player; isHuman: boolean; isDealer: boolean; isCurrentTurn: boolean; showCards: boolean }`
- 人間: 手札を表面で表示、席をリング/ボーダーで強調
- CPU: `showCards` が true のとき表面、それ以外は裏面
- チップ数を常時表示
- フォールド: opacity を下げて視覚的に区別（`opacity-50` 等）
- ディーラー: "D" バッジをマーカーとして表示
- 現在ターン: ハイライト（ボーダー色変更やグロー効果）

**PlayerSeats**
- Props: `{ players: Player[]; humanPlayerId: string; dealerIndex: number; currentPlayerIndex: number; phase: GamePhase }`
- 5席を配置（flex レイアウト。上段3席 + 下段2席、または類似の楕円的配置）
- `showCards` の判定をここで行う: `phase === 'showdown' && !player.folded`
- 各席に `PlayerSeat` を渡す

#### カード公開ルール（design.md PlayerSeats セクション準拠）

| プレイヤー | 条件 | 表示 |
|-----------|------|------|
| 人間 | 常時 | 表面 |
| CPU（非フォールド） | ショーダウン時 | 表面 |
| CPU（非フォールド） | ショーダウン以外 | 裏面 |
| CPU（フォールド済み） | 常時 | 裏面（またはカードなし） |

## 実装ガイドライン

### 参照すべき既存パターン

- **型定義**: `src/domain/types.ts:1-59` — `Card`（suit, rank）、`Player`（id, isHuman, chips, holeCards, folded, currentBetInRound）、`GameState`、`GamePhase` を import して使用
- **Application層の出力形式**: `src/application/useGameController.ts:7-13` — UIが受け取るデータ形状（`GameController` 型）。このタスクでは直接接続しないが、propsの設計はこの形に合わせる
- **定数**: `src/domain/constants.ts:3` — `PLAYER_COUNT = 5`
- **スタイル基盤**: `src/index.css:4-6` — Apple系フォントファミリー設定済み。Tailwind CSS 4 が `@import "tailwindcss"` でセットアップ済み

### 配線に関する注意

- このタスクで `App.tsx` は **変更しない**。GameScreen としての統合はタスク9のスコープ
- `useGameController` との接続は **しない**。各コンポーネントは props のみに依存するプレゼンテーションコンポーネントとして作成する
- タスク9で統合する際に必要な props インターフェースが明確になるよう、各コンポーネントの Props 型を export する

### スート表示文字のマッピング

```
spades → ♠, hearts → ♥, diamonds → ♦, clubs → ♣
```

この変換はCardView内にマップとして定義する（汎用ユーティリティにしない）。

### 注意すべきアンチパターン

1. **300行超ファイル禁止** — 各ファイル200行以下を厳守
2. **ビジネスロジックのUI漏れ禁止** — PlayerSeat内でphase判定しない。showCardsはpropsで受け取る
3. **直接ミューテーション禁止** — propsのオブジェクトを変更しない
4. **TODOコメント禁止** — 実装するか、しないか
5. **説明コメント（What/How）禁止** — コード自体が意図を語る状態にする
6. **DRY違反禁止** — カード表示ロジックはCardViewに集約。PlayerSeatとTableViewで重複させない

### テスト方針

- `@testing-library/react`（devDependencies にあり）を使用
- テスト観点:
  - **CardView**: 表面でランク・スートが表示される / 裏面で内容が隠される / スート色（赤/黒）の切り替え
  - **TableView**: コミュニティカード0枚・3枚・5枚の表示 / ポット額の表示
  - **PlayerSeat**: 人間の手札が表面で表示 / CPUの手札が裏面 / フォールド時の視覚変化 / チップ数の表示 / ディーラーマーカー / 現在ターンのハイライト
  - **PlayerSeats**: 5席分が表示される / ショーダウン時にCPUカードが公開される

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| App.tsx の変更・GameScreen統合 | タスク9のスコープ |
| useGameController との接続 | タスク9のスコープ |
| アクションバー（チェック/ベット/フォールド等のUI） | タスク8のスコープ |
| ゲーム開始/終了ボタン | タスク9のスコープ |
| CPUアクション結果のテキスト表示（「CPU1がコール」等） | 要件7.2はPlayerSeatsでのCPU状態表示を指す。アクションログはtasks.mdに含まれていない |