## Overview

本機能は、既存のテキサスホールデム Web アプリに対する第2弾レビュー指摘（デバッグ用ファイルの排除、`ActionBar` の数値入力 UX の改善、`useGameController` の非同期処理パターン健全化）を、既存アーキテクチャに沿って安全に反映することを目的とする。  
ユーザーはこれまでどおりゲームをプレイしつつ、デバッグ用コードが本番ブランチに混入しないこと、チップ額の入力体験が直感的で安全であること、非同期処理による予期せぬ副作用が抑制されることの恩恵を受ける。  
影響範囲はリポジトリルート直下のデバッグファイル群、UI 層の `ActionBar` コンポーネント、Application 層の `useGameController` に限定され、ドメインロジックや他 UI コンポーネントへの変更は行わない。

### Goals
- 本番想定ブランチからデバッグ専用ファイルを排除し、ビルド成果物に影響しない状態にする。
- `ActionBar` の数値入力において、`min` / `max` / 所持チップ範囲外の値が残り続けないようにしつつ、既存のスライダー・ボタン UI を維持する。
- `useGameController` の非同期処理にキャンセル可能な仕組みとアンマウント時のクリーンアップを導入し、未追跡 Promise による副作用を防ぐ。

### Non-Goals
- 新しいデバッグ用ユーティリティやデバッグ UI の追加は行わない。
- `ActionBar` の見た目・レイアウト・ボタン構成など、UX 指摘と無関係な UI デザインの変更は行わない。
- `useGameController` の公開 API（返却する `GameController` 型のプロパティ構造）やドメイン層の関数シグネチャに対する大幅な再設計は行わない。

## Architecture

### Existing Architecture Analysis
- 既存アーキテクチャは UI 層（`src/ui`）、Application 層（`src/application`）、Domain 層（`src/domain`）の 3 層構成であり、本機能は UI 層と Application 層への局所的な変更で完結する。
- チップ額入力は `ActionBar`（UI 層）が `validActions`（Domain 層で算出）を受け取り、`onAction` 経由で `PlayerAction` を Application 層に伝播する構造になっている。
- ゲーム進行は `useGameController`（Application 層）が `setupNewGame`、`advanceUntilHumanTurn`、`handlePlayerAction`（Domain / Application 層）をラップし、UI に `gameState` / `validActions` を提供する構造である。

### Architecture Pattern & Boundary Map

選択パターンは既存アーキテクチャの踏襲（3 層分離）とし、責務境界は以下のとおり維持する。

- デバッグファイル排除: ビルド設定および運用ルールの範囲で扱い、ドメイン・アプリケーションロジックには手を入れない。
- ActionBar UX: UI 層の状態更新ロジック（`onChange`）のみで完結させ、Domain 層の `ValidAction` 型や `getValidActions` 実装は変更しない。
- useGameController 非同期: Application 層で `AbortController` とマウント状態管理を導入し、Domain / Application の既存関数に対してはオプション引数の追加程度にとどめる。

```mermaid
flowchart LR
  DebugFiles[デバッグ用ファイル群<br/>debug_common.ts など] -. 運用/ビルド除外 .- BuildConfig[ビルド/ブランチ運用]

  subgraph UI["UI 層 (src/ui)"]
    ActionBar[ActionBar.tsx<br/>チップ入力 UX]
  end

  subgraph Application["Application 層 (src/application)"]
    useGameController[useGameController.ts<br/>AbortController + マウント管理]
    gameFlow[gameFlow.ts<br/>advanceUntilHumanTurn / handlePlayerAction]
  end

  subgraph Domain["Domain 層 (src/domain)"]
    betting[betting.ts<br/>getValidActions]
    gameSetup[gameSetup.ts<br/>setupNewGame]
  end

  ActionBar -->|onAction(PlayerAction)| useGameController
  useGameController -->|呼び出し| gameFlow
  useGameController -->|呼び出し| gameSetup
  useGameController -->|gameState / validActions| ActionBar
  gameFlow --> betting
```

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Frontend UI | React 18 + TypeScript | `ActionBar` の状態管理とイベントハンドリングを拡張 | 既存コンポーネントに最小限のロジック追加のみ |
| Application | React hooks (`useState`, `useCallback`, `useMemo`, `useRef`) + `AbortController` | 非同期処理の開始・キャンセル・マウント状態管理 | ブラウザ標準の AbortController を利用 |
| Domain | 既存 TypeScript モジュール (`betting`, `gameSetup`, `gameFlow`) | 変更対象外（必要に応じて signal 引数を追加する程度） | ビジネスロジックはそのまま再利用 |
| Runtime | ブラウザ | Abort signal に対応した処理はブラウザ標準の挙動に依存 | Node バックエンドは関与しない |

## System Flows

### 1. デバッグファイルの扱いフロー（簡略）

- 開発中は `debug_*.ts` ファイルをローカル開発用として利用可能とするが、ビルド対象外ディレクトリ（例: `tools/`）に移動するか、feature ブランチ上で削除しておく。
- 本番相当ブランチへマージする前に、CI / レビューのチェックリストで当該ファイルの有無を確認し、存在する場合は差し戻す運用とする。

### 2. ActionBar のチップ入力フロー（拡張点のみ）

- ユーザーが `<input type="number">` にチップ額を直接入力した際、`onChange` で受け取った値を `findRangeAction(mode)` の `min` / `max` でクリップしてから `setChipAmount` に渡す。
- これにより、表示上も常に許可レンジ内の値だけが残り、`isChipAmountValid()` は常に `true` かつ Confirm ボタンは有効で、ロジック上のバリデーションと UX が一致する。

### 3. useGameController の非同期・キャンセルフロー

- `startGame` / `handleAction` 実行時に、新しい `AbortController` を生成し、前回分が存在すれば `abort()` してから上書きする。
- `advanceUntilHumanTurn` / `handlePlayerAction` に `signal?: AbortSignal` を渡し、ループ内部で `signal?.aborted` を監視しつつ、必要に応じて早期リターンする。
- `useEffect` のクリーンアップで、コンポーネントアンマウント時に最新の `AbortController` に対して `abort()` を呼び出し、アンマウント後の `setGameState` 呼び出しを抑制する。

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1 | デバッグ専用ファイルを本番ブランチから排除する | ビルド/運用ルール（README / CI 設定） | Git ブランチ運用・ビルド設定 | デプロイ前チェックフロー |
| 2 | ActionBar の数値入力を許可レンジ内に制約する | `ActionBar` コンポーネント | `ActionBarProps`, 内部 `ChipInputProps` | チップ入力フロー |
| 3 | useGameController の非同期処理をキャンセル可能にし、副作用を防ぐ | `useGameController` フック、`gameFlow` 補助関数 | `GameController` 型、`advanceUntilHumanTurn`, `handlePlayerAction` | ゲーム開始・アクション処理フロー |

## Components and Interfaces

### UI 層

#### ActionBar（`src/ui/ActionBar.tsx`）

| Field | Detail |
|-------|--------|
| Intent | 人間プレイヤーのアクション選択とチップ額入力を行う UI コンポーネント |
| Requirements | 2 |

**Responsibilities & Constraints**
- `validActions` から有効なアクションタイプとベット/レイズの `min` / `max` レンジを抽出する。
- 数値入力フィールドに入力された値を、常に `min` / `max` の範囲にクリップしてから内部状態に反映する。
- `onAction` には既存どおり `PlayerAction` を渡し、ドメインロジックには変更を波及させない。

**Dependencies**
- Inbound: 親コンポーネント（通常は GameScreen）から `validActions` / `onAction` を受け取る。
- Outbound: `onAction` コールバックを通じて Application 層にユーザー操作を通知する。

**Contracts**
- State 管理: `chipAmount` は常に `RangeAction.min` >= `chipAmount` <= `RangeAction.max` の不変条件を満たす。

**Implementation Notes**
- `onChipAmountChange` に渡す前に、`findRangeAction(mode)` の結果から `min` / `max` を取得し、`Math.min(Math.max(input, min), max)` でクリップする。
- スライダー (`type="range"`) の挙動は現状維持とし、数値入力との双方向同期は既存の `chipAmount` state をそのまま利用する。

### Application 層

#### useGameController（`src/application/useGameController.ts`）

| Field | Detail |
|-------|--------|
| Intent | ゲーム開始・進行・プレイヤーアクションを管理し、UI に `gameState` / `validActions` を提供する React フック |
| Requirements | 3 |

**Responsibilities & Constraints**
- `startGame` と `handleAction` から起動される非同期処理に、キャンセル手段とマウント状態に応じた安全な状態更新を提供する。
- 既存の `GameController` 型のプロパティ（`gameState`, `validActions`, `isHumanTurn`, `startGame`, `handleAction`）は維持する。

**Dependencies**
- Outbound: `setupNewGame`, `advanceUntilHumanTurn`, `handlePlayerAction`, `getValidActions`。
- 内部: `AbortController`、`useRef` による `gameStateRef` と `processingRef`。

**Contracts**
- Service: `startGame` / `handleAction` を呼び出した時、前回と同カテゴリの処理が進行中であれば、それを `abort()` してから新しい処理を開始する。
- State: コンポーネントアンマウント後に `setGameState` が呼ばれないよう、マウント状態を `isMountedRef` などで管理する。

**Implementation Notes**
- `const abortControllerRef = useRef<AbortController | null>(null)` を追加し、`startGame` / `handleAction` それぞれで `new AbortController()` を生成するヘルパー関数を用意する。
- `advanceUntilHumanTurn` / `handlePlayerAction` のシグネチャを、影響範囲が許容できる場合に限り `signal?: AbortSignal` 付きに拡張する。拡張が困難な場合は、少なくとも `isMountedRef` による「アンマウント後は `setGameState` しない」ガードを導入する。
- `useEffect`（依存配列空）を導入し、クリーンアップで `abortControllerRef.current?.abort()` を呼び出す。

## Data Models

- 本機能では新しいドメインモデルやデータ構造は導入しない。
- 既存の `ValidAction` 型に含まれる `min` / `max` 情報、および `PlayerAction` 型をそのまま利用し、UI ロジックのみを追加する。
- `GameState` やプレイヤー・ポット構造も変更しない。

## Error Handling

- デバッグファイル排除:
  - CI などで検出した場合はビルドエラーにはせず、レビューで差し戻す運用とする（実装側では扱わない）。
- ActionBar:
  - 入力値はクリップされるため、通常はエラーメッセージを表示しない。
  - 将来的に UX 向上のためエラーメッセージを追加する場合でも、本 spec の範囲外とする。
- useGameController:
  - `AbortController` によるキャンセルは例外ではなく通常フローとして扱い、`console.error` を増やさない。
  - `advanceUntilHumanTurn` / `handlePlayerAction` 内で `signal.aborted` を検出した場合は、静かに早期リターンする。

## Testing Strategy

- Unit Tests:
  - ActionBar: 数値入力に範囲外の値（`min - step`, `max + step` など）を入力した際に、内部 `chipAmount` がレンジ内にクリップされることを確認する。
  - useGameController: `startGame` 実行後にアンマウント相当のクリーンアップを呼び出し、その後に非同期処理が `setGameState` を呼ばないことを確認する。
- Integration Tests:
  - GameScreen レベルで、`startGame` → 自動 CPU アクション → 人間ターンまでのフロー中に `AbortController` をトリガしても、UI がクラッシュせず次の操作が行えることを確認する。
- E2E/UI Tests:
  - Playwright で「チップ額を入力 → 範囲外の値をタイプ → 自動的に範囲内に補正される」フローを確認する。

