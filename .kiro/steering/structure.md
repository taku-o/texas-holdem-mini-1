# Project Structure

## Organization Philosophy

- Kiro に従い Spec Driven Development（`.kiro/specs/`）で機能を定義してから実装する。
- ルートにはプロジェクト説明・ルール類を置き、アプリ本体のソースは仕様に応じて配置する。

## Directory Patterns

### プロジェクトメタ・ルール
**Location**: ルート  
**Purpose**: README、AGENTS.md、CLAUDE.local.md などプロジェクト全体の説明と開発ルール。  
**Example**: `README.md`, `AGENTS.md`, `CLAUDE.local.md`

### ステアリング（プロジェクト記憶）
**Location**: `.kiro/steering/`  
**Purpose**: AI 向けのプロジェクト共通文脈（product / tech / structure）。全対話で参照される。  
**Example**: `product.md`, `tech.md`, `structure.md`

### 仕様
**Location**: `.kiro/specs/`  
**Purpose**: 機能ごとの requirements / design / tasks。実装はここに従う。  
**Example**: `{feature}/requirements.md`, `{feature}/design.md`, `{feature}/tasks.md`

### アプリケーションソース
**Location**: 未定（技術選定後）  
**Purpose**: アプリのソースコード。spec と tech.md のパターンに従って配置する。  
**Example**: 選定後に例を追記する。

## Naming Conventions

- **Files**: 技術選定後に言語・フレームワークに合わせて記載。
- **Components / Modules**: 同様に選定後に記載。

## Import Organization

技術選定後に、使用言語の慣習（例: 絶対パス `@/` など）を記載する。

## Code Organization Principles

- 実装は必ず `.kiro/specs/` の tasks と design に沿う。
- ドキュメントにない機能・拡張は追加しない（CLAUDE.local.md）。

---
_パターンと方針のみ記載。ファイルツリーや一覧は書かない。_
