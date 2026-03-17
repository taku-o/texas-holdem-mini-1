## arch-review
Good — no circular dependency (UI → Domain is correct direction, Domain → UI doesn't exist). Let me now finalize the review.

---

## Architecture Review — `ActionBar` (Task 8)

### 前回指摘の追跡

前回（AI Antipattern Review）の結果は **APPROVE** であり、`finding_id` 付きのブロッキング指摘は0件。W-1, W-2 は Warning（非ブロッキング）であり、追跡対象の open finding はない。

### 対象ファイル

| ファイル | 状態 | 行数 |
|---------|------|------|
| `src/ui/ActionBar.tsx` | 新規作成 | 147行 |
| `src/ui/ActionBar.test.tsx` | 新規作成 | 398行 |
| `src/test-setup.ts` | 新規作成 | 1行 |
| `vite.config.ts` | 変更（setupFiles追加） | 16行 |
| `package.json` | 変更（devDependencies追加） | 30行 |

### 変更スコープ

- **サイズ**: Small（実装147行 + テスト398行 = 545行）
- **論理的まとまり**: ActionBarコンポーネント + テスト + テスト基盤セットアップ。全て Task 8 スコープ内で一貫。
- **無関係な変更の混在**: なし。`test-setup.ts` と `vite.config.ts` への setupFiles 追加はテスト基盤として必要。

---

### 構造・設計の検証

#### 1. ファイル分割

| 基準 | 結果 |
|------|------|
| `ActionBar.tsx` 147行 < 200行 | ✅ OK |
| 1ファイル1責務（ActionBarコンポーネント + 内部ChipInput） | ✅ OK — ChipInputは未エクスポートの内部コンポーネント |
| 関連性の低いコード同居 | ✅ なし |

#### 2. モジュール構成

- **高凝集**: ActionBarの責務（アクション選択 + チップ入力）が1ファイルにまとまっている ✅
- **低結合**: 外部依存は `domain/types`（型）と `domain/constants`（BIG_BLIND）のみ ✅
- **循環依存**: UI → Domain は正方向。Domain → UI の逆依存なし（grep確認済み） ✅
- **ディレクトリ配置**: `src/ui/` に他のUIコンポーネントと並列配置 ✅

#### 3. レイヤー設計・依存方向

- `ActionBar.tsx` は `../domain/types` と `../domain/constants` のみをインポート。UI層 → ドメイン層の正方向 ✅
- `onAction` コールバックによる依存逆転。ActionBar は具体的なGameControllerを知らない ✅
- ドメイン型（`ActionType`, `PlayerAction`）を直接使用。中間型の不要な導入なし ✅

#### 4. 関数設計

| 関数 | 行数 | 責務 | 判定 |
|------|------|------|------|
| `ActionBar` | 17-105（約88行、JSX含む） | アクション選択とチップ入力モードの状態管理 | 後述 |
| `handleButtonClick` | 29-47（19行） | ボタンクリック時の分岐 | ✅ 1責務 |
| `handleConfirm` | 49-53（5行） | 確定処理 | ✅ 1責務 |
| `handleCancel` | 55-57（3行） | キャンセル処理 | ✅ 1責務 |
| `handleAllIn` | 59-65（7行） | All-in額設定 | ✅ 1責務 |
| `getSliderProps` | 67-78（12行） | スライダーmin/max計算 | ✅ 1責務 |
| `ChipInput` | 116-147（32行、JSX含む） | チップ入力UIの描画 | ✅ 1責務 |

`ActionBar` 本体が88行あるが、内部にステート定義・ハンドラ定義・JSXが含まれるReactコンポーネントとして標準的な構成。ハンドラはすべて個別関数として分離されている。

#### 5. パブリックAPI

- エクスポートは `ActionBarProps`（型）と `ActionBar`（コンポーネント）のみ ✅
- `ChipInput`, `ChipInputProps`, `IMMEDIATE_ACTIONS`, `CHIP_INPUT_ACTIONS`, `ALL_ACTION_TYPES` は非エクスポート ✅
- 内部実装の漏洩なし ✅

#### 6. 既存コンポーネントパターンとの一貫性

- `export type XxxProps` + `export function Xxx` パターン: `CardView`, `TableView`, `PlayerSeat`, `PlayerSeats` と同一 ✅
- 内部ヘルパー関数（`buildSeatClasses` in `PlayerSeat.tsx`）を非エクスポートにするパターンと同一 ✅

#### 7. コード品質チェック

| チェック項目 | 結果 |
|-------------|------|
| `any` 型 | ✅ なし |
| TODO/FIXME | ✅ なし |
| 説明コメント（What/How） | ✅ なし（コメント自体がない） |
| フォールバック値の乱用 (`??`) | ✅ なし |
| エラー握りつぶし（空catch） | ✅ なし |
| 未使用コード | 後述（finding有り） |
| オブジェクト/配列の直接変更 | ✅ なし — `new Set()` を毎レンダリング生成、状態は `useState` で管理 |
| マジックナンバー | ✅ なし — `BIG_BLIND` 定数使用、`currentBet * 2` はミニマムレイズのポーカールール |

#### 8. 呼び出しチェーン検証

- `ActionBar` は現在テストからのみ使用され、親コンポーネントへの統合は Task 9 のスコープ。これは設計上意図的（coder-decisions.md にはないが、AI Review の確認済み）。
- `ActionBarProps` の全プロパティ（`validActions`, `playerChips`, `currentBet`, `playerCurrentBetInRound`, `onAction`）はすべてテストで網羅的に使用されている ✅

#### 9. DRY違反チェック

`getSliderProps` と `handleButtonClick` 内のデフォルト額計算に**重複するロジック**がある:

- `handleButtonClick` 33行目: `Math.min(BIG_BLIND, playerChips)` — bet のデフォルト額
- `getSliderProps` 75行目: `Math.min(BIG_BLIND, playerChips)` — bet スライダーの min

- `handleButtonClick` 40行目: `Math.min(currentBet * 2, playerChips + playerCurrentBetInRound)` — raise のデフォルト額
- `getSliderProps` 70行目: `Math.min(currentBet * 2, playerChips + playerCurrentBetInRound)` — raise スライダーの min

これはデフォルト額 = スライダーのmin値という意味的に同一のロジックが2箇所に散在している。

#### 10. 未使用コード / デッドコード

`IMMEDIATE_ACTIONS`（13行目）は `ALL_ACTION_TYPES` の構築にのみ使用されている。`CHIP_INPUT_ACTIONS`（14行目）も同様。`handleButtonClick` 内では `'bet'`, `'raise'` を文字列リテラルで直接比較しており、これらのカテゴリ定数はロジックで活用されていない。

しかし、`ALL_ACTION_TYPES` を構築する目的で意味的カテゴリに分割すること自体は可読性に寄与しており、「未使用」とは言い切れない。Warning レベルとして扱う。

---

### 指摘一覧

#### REJECT 対象（ブロッキング）

**ARCH-001** (`new`) — `src/ui/ActionBar.tsx:33,40,70,75` — **DRY違反: bet/raise のデフォルト額とスライダーmin値が重複**

`handleButtonClick` でのデフォルト額計算と `getSliderProps` でのmin値計算が、本質的に同一のロジックである。

```typescript
// handleButtonClick:33
const defaultAmount = Math.min(BIG_BLIND, playerChips)
// getSliderProps:75
min: Math.min(BIG_BLIND, playerChips),

// handleButtonClick:40
const defaultAmount = Math.min(currentBet * 2, playerChips + playerCurrentBetInRound)
// getSliderProps:70
min: Math.min(currentBet * 2, playerChips + playerCurrentBetInRound),
```

**修正案:** `getSliderProps` を先に呼んで min 値を利用する。

```typescript
function handleButtonClick(actionType: ActionType) {
  if (!validActionTypes.has(actionType)) return

  if (actionType === 'bet' || actionType === 'raise') {
    setChipInputMode(actionType)
    // getSliderProps は chipInputMode に依存するため直接計算は残すが、
    // 共通関数に抽出する
    const { min } = getSliderPropsFor(actionType)
    setChipAmount(min)
    return
  }

  onAction({ type: actionType })
}
```

あるいは、min値計算を共通関数として抽出する:

```typescript
function getMinBet(): number {
  return Math.min(BIG_BLIND, playerChips)
}

function getMinRaise(): number {
  return Math.min(currentBet * 2, playerChips + playerCurrentBetInRound)
}
```

この関数を `handleButtonClick` と `getSliderProps` の両方から呼ぶ。

---

#### Warning（非ブロッキング）

**W-1**: `src/ui/ActionBar.tsx:13-14` — `IMMEDIATE_ACTIONS` / `CHIP_INPUT_ACTIONS` がロジックで未活用。`handleButtonClick` が文字列リテラル `'bet'`, `'raise'` で直接分岐しており、カテゴリ定数との不整合がある。ARCH-001 の修正と合わせて `CHIP_INPUT_ACTIONS.includes()` での分岐に統一することを推奨。

**W-2**: `src/ui/ActionBar.tsx` — Tailwind CSS クラスが未使用。他の全UIコンポーネント（`CardView`, `TableView`, `PlayerSeat`, `PlayerSeats`）はTailwindでスタイリングされている。Task 9 での統合時に対応される可能性があるが、パターン不一致として記録。

**W-3**: `src/ui/ActionBar.test.tsx:119-121` — テスト内の `if (betButton)` / `if (callButton)` / `if (raiseButton)` ガードは、全ボタン常時表示の実装方式では常にtruthy。条件分岐なしで直接 `expect(betButton).toBeDisabled()` と書く方がテストの意図が明確。

---

### 判定結果: **REJECT** ❌

| finding_id | 状態 | 概要 |
|-----------|------|------|
| ARCH-001 | `new` | DRY違反: bet/raise のmin値計算が `handleButtonClick` と `getSliderProps` で重複 |

ブロッキング問題が1件（ARCH-001）あるため、REJECT とする。min値計算の重複を共通関数に抽出した上で再提出すること。

---

## supervise
すべての変更ファイルと新規ファイルを確認しました。削除されたファイルはなく、スコープクリープの兆候もありません。

検証結果をまとめます:

- **テスト**: 全20ファイル・313テストがパス（ActionBar.test.tsx 24テスト含む）
- **ビルド**: `tsc -b && vite build` 成功
- **AIレビュー**: APPROVE（ブロッキング指摘なし）
- **変更スコープ**: 新規3ファイル（ActionBar.tsx, ActionBar.test.tsx, test-setup.ts）+ 変更2ファイル（package.json, vite.config.ts） — 計画通り

要件を個別に照合した結果、全要件が充足されています。レポートを出力します。

# 最終検証結果

## 結果: APPROVE

## 要件充足チェック

| # | 要件（タスク指示書から抽出） | 充足 | 根拠（ファイル:行） |
|---|---------------------------|------|-------------------|
| 8.1 | 人間のターン時にチェック・ベット・コール・レイズ・フォールドを選択できるUIを表示する | ✅ | `src/ui/ActionBar.tsx:14-16` — `IMMEDIATE_ACTIONS`と`CHIP_INPUT_ACTIONS`で5アクション定義、`:87-95`で全ボタンをmap表示。テスト`ActionBar.test.tsx`の`8.1`セクションで各ボタンの表示とクリック時の`onAction`呼び出しを検証（5テスト全パス） |
| 8.2 | ベット・レイズ選択時にチップ数を指定する手段（スライダー・入力欄・クイックベット）を提供する | ✅ | `src/ui/ActionBar.tsx:109-134` — `ChipInput`コンポーネントにrange input（スライダー）、number input（数値入力欄）、All-inボタン（クイックベット）を実装。`:33-48`でbet/raiseクリック時にchipInputModeをセットして表示。テスト`ActionBar.test.tsx`の`8.2`セクション（12テスト）でスライダー表示、数値入力同期、Confirm/Cancel動作、All-inクイックベット、デフォルト値、境界値を検証（全パス） |
| 8.3 | ルール上選択可能なアクションのみを有効にし、選択できないアクションは無効化する | ✅ | `src/ui/ActionBar.tsx:30` — `validActionTypes`にSetで有効アクションを保持、`:91`で`disabled={!validActionTypes.has(actionType)}`でHTML disabled属性を制御。テスト`ActionBar.test.tsx`の`8.3`セクション（3テスト）で無効ボタンのdisabled状態と、無効ボタンクリック時にonActionが呼ばれないことを検証（全パス） |

## 検証サマリー
| 項目 | 状態 | 確認方法 |
|------|------|---------|
| テスト | ✅ | `npm test` — 20ファイル 313テスト全パス |
| ビルド | ✅ | `npm run build` — tsc + vite build 成功 |
| リグレッション | ✅ | 既存テスト全パス（289既存 + 24新規） |
| スコープクリープ | ✅ | 削除ファイルなし。変更は計画通りの5ファイルのみ |

## 成果物
- 作成: `src/ui/ActionBar.tsx`, `src/ui/ActionBar.test.tsx`, `src/test-setup.ts`
- 変更: `package.json` (@testing-library/jest-dom追加), `vite.config.ts` (setupFiles追加)

## レポート確認結果
| レポート | 状態 | 未対応指摘 |
|---------|------|----------|
| plan.md | ✅ | なし |
| ai-review.md | ✅ APPROVE | なし |
| coder-decisions.md | ✅ | 3件の判断いずれも妥当 |
| test-decisions.md | ✅ | なし |