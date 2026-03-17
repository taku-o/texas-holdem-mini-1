## arch-review
Now I have a comprehensive view. Let me write my review.

---

# アーキテクチャレビュー

## 結果: APPROVE

## サマリー
全体として3層構造（domain / application / ui）が明確に分離されており、依存方向も正しく、循環依存なし。全プロダクションファイルが200行未満で、関数も適切に分割されている。ブロッキング問題は検出されなかった。

## 変更スコープ
- **サイズ**: Large（全46ファイル、8,171行の新規コードベース + タスク10のテスト追加）
- **論理的まとまり**: テキサスホールデムゲームの全実装（domain + application + ui）が1つのピースで構築されている。タスク10の変更はテストファイルのみ（5ファイル修正）
- **coder-decisions との一致**: ✅ タスク10は「結合・動作確認とテスト」であり、テストファイルのみの変更は妥当

## 構造・設計の検証

### レイヤー構成

| レイヤー | 役割 | 依存先 | 判定 |
|---------|------|--------|------|
| `src/domain/` | ゲームロジック（純関数） | 外部ライブラリ(`@pokertools/evaluator`)のみ | ✅ |
| `src/application/` | ゲームフロー制御・Reactフック | domain | ✅ |
| `src/ui/` | React UIコンポーネント | domain（型・定数のみ） | ✅ |

依存方向: ui → application → domain ✅（逆方向なし）

### モジュール構成

| 基準 | 判定 |
|------|------|
| 高凝集 | ✅ 各モジュールが単一の責務（betting, dealing, showdown等） |
| 低結合 | ✅ モジュール間の依存が型とインターフェース経由 |
| 循環依存 | ✅ なし（全依存がDAG） |

ドメイン内依存グラフ（循環なし確認済み）:
```
types ← constants
  ↑
deck ← dealing ← handProgression ← gameSetup
  ↑         ↑
handEvaluator ← showdown
  ↑            ↑
betting ← cpuStrategy
```

### ファイルサイズ（プロダクションコード）

| ファイル | 行数 | 判定 |
|---------|------|------|
| `ui/ActionBar.tsx` | 147 | ✅ |
| `domain/cpuStrategy.ts` | 132 | ✅ |
| `domain/betting.ts` | 127 | ✅ |
| `domain/handProgression.ts` | 123 | ✅ |
| `application/gameFlow.ts` | 117 | ✅ |
| 他全ファイル | <100 | ✅ |

全ファイルが200行未満。300行超のファイルなし。

### パブリックAPIの公開範囲

`gameEngine.ts` がfacadeとして `gameSetup`, `betting`, `showdown`, `handProgression` から選択的に再エクスポート。内部実装（`deck`, `dealing`, `handEvaluator`, `testHelpers`）はfacadeに含まれていない。✅

### イミュータビリティ

- `applyAction` (betting.ts:35): `state.players.map((p) => ({ ...p }))` で複製後に変更 ✅
- `postBlinds` (dealing.ts:5): 同様のパターン ✅
- `advancePhase` (handProgression.ts:34): 同様のパターン ✅
- `determineWinners` (showdown.ts:9): 関数内ローカル配列への `.push()` / `.length = 0` — ローカル変数のため外部状態に影響なし ✅
- `shuffleDeck` (deck.ts:13): `[...deck]` で複製後にシャッフル ✅

### 関数設計

- 全関数が単一責務 ✅
- 30行超の関数: `applyAction`(71行) — switch文による分岐が主体で、責務は「アクション適用」の1つ。各caseは独立しており、分割よりも一覧性を優先する判断は妥当 ✅
- `processCpuTurnsAndPhases`(48行) — ゲームループの中核。条件分岐は各ゲーム状態への対応であり、1関数に集約されていることで状態遷移の全体像が把握可能 ✅

### コード品質チェック

| チェック項目 | 結果 |
|-------------|------|
| `any` 型 | ✅ なし |
| TODO/FIXME | ✅ なし |
| 空のcatch | ✅ なし |
| `.skip()` / `.only()` | ✅ なし |
| 説明コメント（What/How） | ✅ なし |
| 未使用import/変数 | ✅ なし（前回AIR-001解消済み） |
| DRY違反 | ✅ なし |
| マジックナンバー | ✅ 定数化済み（`INITIAL_CHIPS`, `BIG_BLIND`等） |

### テストカバレッジ

全プロダクションモジュールに対応するテストファイルが存在:
- `domain/`: 11プロダクションファイルに対し10テストファイル + 1統合テスト
- `application/`: 2プロダクションファイルに対し2テストファイル
- `ui/`: 6プロダクションファイルに対し6テストファイル
- 合計358テスト全パス ✅

## 前回指摘の追跡

前回のアーキテクチャレビューの指摘: なし（初回レビュー）

## 今回の指摘（new）

### ブロッキング
なし

### Warning（非ブロッキング）

**ARCH-W001**: `gameEngine.ts` facadeがプロダクションコードで未使用

`gameEngine.ts` はドメイン層のパブリックAPIを定義するfacadeだが、`gameFlow.ts` と `useGameController.ts` は個別モジュールから直接インポートしている。facadeはテスト（`gameEngine.integration.test.ts`）でのみ使用されている。

- 現状の影響: facadeの存在がアーキテクチャ上の期待を生むが、実際には使われていない
- 提案: (a) application層のimportをfacade経由に統一する、または (b) facadeを削除してテストも個別モジュールからインポートする

**ARCH-W002**: `isGameOver` の戻り値型が判別共用体でない

`src/domain/handProgression.ts:103-118` — `isGameOver` は `{ over: boolean; reason?: string }` を返すが、`gameFlow.ts:34` で `gameOverCheck.reason!` と非nullアサーションが必要になっている。

```typescript
// 現状
export function isGameOver(state: GameState): { over: boolean; reason?: string }

// 改善案: 判別共用体で型安全にする
type GameOverResult =
  | { over: true; reason: string }
  | { over: false }
```

## 継続指摘（persists）
なし

## 解消済み（resolved）
なし

## 再開指摘（reopened）
なし

---

## supervise
検証完了。すべてのファイルで641行の追加のみ、削除なし。スコープクリープなし。

全要件を検証し、結果をまとめます。

---

# 最終検証結果

## 結果: APPROVE

## 要件充足チェック

タスク指示書（タスク10）から要件を抽出し、各要件を実コードで個別に検証。

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 10.1 | ゲーム開始〜1ハンド進行（プリフロップ〜ショーダウン）の結合フロー検証 | ✅ | `gameEngine.integration.test.ts:10-71` 完全なハンドフロー、`gameFlow.test.ts:812` 統合テスト |
| 10.1 | 人間のアクション・CPUの自動行動 | ✅ | `useGameController.test.ts:485-519` 混合アクション統合、`gameFlow.test.ts:811-880` handlePlayerAction統合 |
| 10.1 | ポット配分 | ✅ | `gameEngine.integration.test.ts:308-347` ショーダウン後ポット=0検証、`showdown.test.ts:129-304` 勝者配分+端数処理 |
| 10.1 | 次ハンド | ✅ | `useGameController.test.ts:464-519` 連続ハンド+チップ保存則 |
| 10.1 | ゲーム終了 | ✅ | `useGameController.test.ts:522-549` CPU全員脱落ゲーム終了、`gameFlow.test.ts:851` fold繰り返しゲーム終了 |
| 10.2 | GameEngine単体テスト — advancePhaseエラーハンドリング | ✅ | `handProgression.test.ts:432-448` idle/showdownでエラースロー |
| 10.2 | HandEvaluator単体テスト — 役判定 | ✅ | `handEvaluator.test.ts` 23テスト、全10カテゴリ+エッジケース |
| 10.2 | CPUStrategy単体テスト — bet/raise amount有効性 | ✅ | `cpuStrategy.test.ts:709-811` amount範囲検証+クランプ検証 |
| 10.2 | GameEngine facadeエクスポート検証 | ✅ | `gameEngine.integration.test.ts:349-401` 全11関数エクスポート+過不足検証 |
| 10.3* | E2E/UIテスト | ✅ (スキップ) | タスク指示書に「MVP後でも実施可能な場合は任意」と明記。計画でスキップ判断済み |

## 検証サマリー

| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` — 21ファイル、358テスト全パス |
| 型チェック | ✅ | `npx tsc --noEmit` エラーなし |
| ビルド | ✅ | `npm run build` 成功（67モジュール、666ms） |
| スコープクリープ | ✅ | 削除ファイルなし、641行追加のみ（テストファイル5つ） |
| AIレビュー指摘 | ✅ | AIR-001（未使用変数）解消済み、未対応指摘なし |
| プロダクションコード変更 | ✅ | なし（タスク10はテスト追加のみ、計画通り） |

## 成果物

- 変更: `src/application/useGameController.test.ts` — ゲーム再開テスト2件、混合アクション統合テスト1件、CPU全員脱落テスト1件
- 変更: `src/domain/gameEngine.integration.test.ts` — ショーダウン後ポット配分検証1件、完全セッション+チップ保存則2件、facadeエクスポート検証2件
- 変更: `src/domain/handProgression.test.ts` — advancePhaseエラーケース2件、チップ0ブラインドスキップ2件
- 変更: `src/domain/cpuStrategy.test.ts` — bet/raise amount範囲検証3件
- 変更: `src/domain/showdown.test.ts` — ポット端数分配エッジケース3件

## 未完了項目
なし