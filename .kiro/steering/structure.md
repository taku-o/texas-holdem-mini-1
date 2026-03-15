# Project Structure

<!-- updated_at: 2026-03-15 — 設計確定内容を反映 -->

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
**Pattern**:
- UI層のコンポーネント（GameScreen, TableView, PlayerSeats, ActionBar）
- Application層（GameController: 状態管理・フロー制御）
- Domain層（GameEngine, HandEvaluator, CPUStrategy: 純粋ロジック）

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
