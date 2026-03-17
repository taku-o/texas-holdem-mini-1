## arch-review
Now I have all the information needed to complete the review. Let me compile my findings.

---

## Architecture Review — タスク6: ゲームコントローラーの実装

**判定: REJECT**

---

### 前回 findings の追跡

| finding_id | 出典 | 内容 | 状態 |
|------------|------|------|------|
| AIR-001 | AI Review | `computeIsHumanTurn` の冗長な実装 | persists — `useGameController.ts:15-19` に `findIndex` パターンが残存。アーキテクチャ観点からも ARCH-002 として指摘 |

---

### ブロッキング問題

#### [ARCH-001] 未使用インポート — `gameFlow.test.ts:5-8` (new)

**ファイル:** `src/application/gameFlow.test.ts:5-8`

**問題:** `applyAction`, `isBettingRoundComplete`（`../domain/betting`）、`advancePhase`, `preparePreflopRound`（`../domain/handProgression`）がインポートされているが、テストコード内で一度も使用されていない。

**現在のコード:**
```typescript
import {
  applyAction,
  isBettingRoundComplete,
} from '../domain/betting'
import { advancePhase, preparePreflopRound } from '../domain/handProgression'
```

**修正案:** 未使用インポートをすべて削除する。

```typescript
// applyAction, isBettingRoundComplete, advancePhase, preparePreflopRound の行を削除
```

**根拠:** ポリシー「未使用コード（「念のため」のコード）」→ REJECT。grep で確認済み — これら4つのシンボルはインポート行以外にテストファイル内で一切参照されていない。

---

#### [ARCH-002] 冗長な式 — `computeIsHumanTurn` (new)

**ファイル:** `src/application/useGameController.ts:15-19`

**問題:** `findIndex` で人間プレイヤーのインデックスを検索し `currentPlayerIndex` と比較するアプローチは冗長。`state.players[state.currentPlayerIndex].isHuman` で直接判定可能。同一プロジェクト内の `gameFlow.ts:90` では `currentPlayer.isHuman` で直接判定しており、パターンが不一致。

**現在のコード:**
```typescript
function computeIsHumanTurn(state: GameState | null): boolean {
  if (!state || state.phase === 'idle') return false
  const humanIndex = state.players.findIndex((p) => p.isHuman)
  return state.currentPlayerIndex === humanIndex
}
```

**修正案:**
```typescript
function computeIsHumanTurn(state: GameState | null): boolean {
  if (!state || state.phase === 'idle') return false
  return state.players[state.currentPlayerIndex].isHuman
}
```

**根拠:**
- `gameFlow.ts:89-91` は `const currentPlayer = current.players[current.currentPlayerIndex]; if (currentPlayer.isHuman)` で直接判定しており、これがプロジェクトの標準パターン
- `findIndex` は O(n) の走査を行うが、インデックスは `currentPlayerIndex` として保持済み
- ポリシー「冗長な式（同値の短い書き方がある）」→ REJECT

---

### 非ブロッキング（参考情報）

なし

---

### 確認済み項目（問題なし）

| 観点 | 結果 |
|------|------|
| ファイル分割 | ✅ `gameFlow.ts`（119行）、`useGameController.ts`（55行）— 200行以下 |
| 1ファイル1責務 | ✅ `gameFlow.ts`＝ゲームフロー制御（CPU自動進行・フェーズ遷移）、`useGameController.ts`＝React状態管理フック |
| レイヤー設計 | ✅ `application/` → `domain/` の一方向依存。逆方向インポートなし |
| 循環依存 | ✅ なし |
| 関数設計（1関数1責務） | ✅ `getNonFoldedCount`, `canAnyoneStillBet`, `finishAsGameOver`, `resolveAndCheckGameOver`, `skipToShowdownAndResolve`, `processCpuTurnsAndPhases` — 各関数が明確な単一責務 |
| 関数サイズ | ✅ 最大関数 `processCpuTurnsAndPhases`（51-103行, 約50行）は若干大きいが、ステートマシンのループとして妥当。分岐が明確で認知負荷は低い |
| DRY | ✅ `processCpuTurnsAndPhases` を共通ロジックとし、`handlePlayerAction` と `advanceUntilHumanTurn` が委譲。重複なし |
| イミュータブル操作 | ✅ スプレッド演算子で新オブジェクトを生成。配列/オブジェクトの直接変更なし |
| `any` 型 | ✅ なし |
| TODO / FIXME | ✅ なし |
| エラーの握りつぶし | ✅ なし |
| 説明コメント | ✅ `gameFlow.ts:71-72` のコメントは設計判断の理由（Why）を説明しており適切 |
| パブリック API | ✅ `gameFlow.ts` は `handlePlayerAction` と `advanceUntilHumanTurn` のみエクスポート。内部ヘルパー関数は非公開 |
| `useGameController.ts` は `useGameController` のみエクスポート。`computeIsHumanTurn`, `computeValidActions`, `GameController` 型は非公開 |
| 呼び出しチェーン | ✅ `useGameController` → `gameFlow` → `domain/*` のチェーンが正しく配線されている。`gameOverReason` フィールドは `gameFlow.ts:25` で設定され、`handProgression.ts:isGameOver` の `reason` を経由して正しく伝搬 |
| テストカバレッジ | ✅ `gameFlow.test.ts`（828行）、`useGameController.test.ts`（400行）— 初期化、人間アクション、CPU自動進行、フェーズ遷移、ハンド終了→次ハンド、ゲーム終了、チップ保存則、all-in時スキップ、非争ポット解決をカバー |
| 変更スコープ | ✅ タスク6.1/6.2/6.3の要件に対して過不足なく実装。新規プロダクションコード174行（Small）。無関係な変更の混入なし |
| 契約文字列のハードコード | ✅ なし（`phase === 'idle'` 等はリテラル型 `GamePhase` と一致） |
| 仕様準拠 | ✅ `gameOverReason?: string` の追加は `GameState` 型の自然な拡張。既存コードとの互換性を保つオプショナルフィールド |
| デッドコード | ✅ プロダクションコード内に未使用の関数・変数なし（テストファイルの未使用インポートは ARCH-001 で指摘済み） |
| 設計判断の妥当性 | ✅ coder-decisions.md の「既存モジュールをそのまま利用しReactフックとして状態管理を追加」は妥当な判断 |

---

## supervise
全情報が揃いました。検証結果をまとめます。

**重要な発見**: AI Reviewで REJECT された AIR-001（`computeIsHumanTurn` の冗長な実装）が未修正のまま残っています。

`src/application/useGameController.ts:17-18`:
```typescript
const humanIndex = state.players.findIndex((p) => p.isHuman)
return state.currentPlayerIndex === humanIndex
```

`gameFlow.ts:90` の標準パターン:
```typescript
currentPlayer.isHuman  // 直接アクセス
```

---

# 最終検証結果

## 結果: REJECT

## 要件充足チェック

タスク指示書（タスク6: ゲームコントローラーの実装）からサブタスク 6.1, 6.2, 6.3 の要件を抽出し、実コードで個別に検証。

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 1 | 6.1: ゲーム状態を1つ保持する | ✅ | `src/application/useGameController.ts:30` — `useState<GameState \| null>(null)` |
| 2 | 6.1: ゲーム開始操作で参加者・席順・初期チップを設定して最初のハンドを開始する | ✅ | `src/application/useGameController.ts:32-36` — `setupNewGame(randomFn)` + `advanceUntilHumanTurn` |
| 3 | 6.2: 人間プレイヤーのアクションを受け取り、ゲームエンジンで検証・状態更新する | ✅ | `src/application/useGameController.ts:38-46` — `handlePlayerAction(prev, action, randomFn)` に委譲 |
| 4 | 6.2: 必要ならCPUターンを連続で進める | ✅ | `src/application/gameFlow.ts:105-112` — `handlePlayerAction` 内で `processCpuTurnsAndPhases` が自動実行 |
| 5 | 6.3: CPUのターンでは自動で行動決定し、結果を状態に反映して次のプレイヤーまたはラウンドへ進める | ✅ | `src/application/gameFlow.ts:94-99` — `decideAction` → `applyAction` のループ |
| 6 | 返却型に `gameState`, `startGame`, `handleAction`, `validActions`, `isHumanTurn` が含まれる | ✅ | `src/application/useGameController.ts:7-13, 54` |
| 7 | テストが書かれている | ✅ | `src/application/useGameController.test.ts` — 21テスト |
| 8 | テストが通る | ✅ | `npx vitest run` — 253テスト全パス |
| 9 | ビルドが通る | ✅ | `npx tsc --noEmit` 成功 |
| 10 | AI Review指摘（AIR-001）が修正されている | ❌ | `src/application/useGameController.ts:17-18` — `findIndex` による冗長な実装が未修正 |

## 検証サマリー
| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npx vitest run` (253 passed) |
| ビルド | ✅ | `npx tsc --noEmit` 成功 |
| 型チェック | ✅ | エラーなし |
| 動作確認 | ✅ | テストでゲーム開始→アクション→CPU進行→ゲーム終了まで検証済み |
| レビュー指摘対応 | ❌ | AIR-001 未修正 |

## 成果物
- 作成: `src/application/useGameController.ts`
- 作成: `src/application/useGameController.test.ts`

## 未完了項目（REJECTの理由）
| # | finding_id | 項目 | 理由 |
|---|------------|------|------|
| 1 | AIR-001-verbose-isHumanTurn | `computeIsHumanTurn` の冗長な実装 | AI Review で REJECT された指摘が未修正。`src/application/useGameController.ts:17-18` で `findIndex` による O(n) 走査を行っているが、`state.players[state.currentPlayerIndex].isHuman` で直接アクセスすべき（`gameFlow.ts:90` の標準パターン）。修正案: `const humanIndex = state.players.findIndex((p) => p.isHuman)` と `return state.currentPlayerIndex === humanIndex` を `return state.players[state.currentPlayerIndex].isHuman` に置換する |