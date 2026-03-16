# Project Structure

<!-- updated_at: 2026-03-16 — 実装済み src 構成を反映 -->

## Organization Philosophy

- Kiro に従い Spec Driven Development（`.kiro/specs/`）で機能を定義してから実装する。
- ルートにはプロジェクト説明・ルール類を置き、アプリ本体のソースは `src/` 配下に配置する。
- ゲームロジック（Domain層）はUIから分離し、単体テスト可能な境界を設ける。

## Directory Patterns

### プロジェクトメタ・ルール
**Location**: ルート
**Purpose**: README、CLAUDE.md などプロジェクト全体の説明と開発ルール。
**Example**: `README.md`, `CLAUDE.md`, `package.json`, `tsconfig.json`

### ステアリング（プロジェクト記憶）
**Location**: `.kiro/steering/`
**Purpose**: AI 向けのプロジェクト共通文脈（product / tech / structure）。全対話で参照される。
**Example**: `product.md`, `tech.md`, `structure.md`

### 仕様
**Location**: `.kiro/specs/`
**Purpose**: 機能ごとの requirements / design / tasks。実装はここに従う。
**Example**: `{feature}/requirements.md`, `{feature}/design.md`, `{feature}/tasks.md`

### アプリケーションソース
**Location**: `src/`
**Purpose**: React + TypeScript のソースコード。レイヤー分離型。
**Layout**: `src/domain/`（ゲームロジック）、`src/application/`（GameController・フロー）、`src/ui/`（コンポーネント）。
**Pattern**:
- UI層（`src/ui/`）: GameScreen, TableView, PlayerSeats, ActionBar, CardView 等
- Application層（`src/application/`）: useGameController, gameFlow（状態管理・フロー制御）
- Domain層（`src/domain/`）: gameEngine, handEvaluator, cpuStrategy, dealing, betting, showdown 等の純粋ロジック

## Naming Conventions

- **Files**: TypeScript（`.ts` / `.tsx`）
- **Components**: PascalCase（例: `GameScreen.tsx`）
- **Types / Interfaces**: PascalCase（例: `GameState`, `Player`, `Card`）
- **関数・変数**: camelCase

## Import Organization

- 外部ライブラリ → プロジェクト内部の順
- 外部ライブラリ（@pokertools/evaluator等）はアダプタ経由で利用

## Code Organization Principles

- 実装は必ず `.kiro/specs/` の tasks と design に沿う
- ドキュメントにない機能・拡張は追加しない（CLAUDE.local.md）
- Domain層はUI・フレームワークに依存しない純粋なロジックとする

---
_パターンと方針のみ記載。ファイルツリーや一覧は書かない。_
