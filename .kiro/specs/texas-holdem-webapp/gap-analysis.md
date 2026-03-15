# Implementation Gap Analysis: texas-holdem-webapp

**Feature**: texas-holdem-webapp  
**実施日**: 設計書（design.md）策定後  
**言語**: 日本語（spec.json に合わせる）

---

## 1. Current State Investigation

### 1.1 コードベースのスキャン結果

- **アプリケーションソース**: **存在しない**。`.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.html`（アプリ用）, `package.json`, ビルド設定などはリポジトリ内に 0 件。
- **ディレクトリ構成**: ルートに README.md, AGENTS.md, CLAUDE.local.md、および `.kiro/`, `.cursor/`, `.claude/` 等のメタ・ツール用ディレクトリのみ。アプリ本体のディレクトリは未作成。
- **再利用可能なコンポーネント/サービス**: なし。
- **既存のアーキテクチャパターン**: なし（グリーンフィールド）。

### 1.2 コンベンション・統合面

- **命名・レイヤ・依存方向**: 未定義。design.md と structure.md により「仕様に従って配置する」とされている。
- **統合面（API・DB・認証）**: 要件 3 により永続化・バックエンドは不使用。外部連携は役判定ライブラリのラップのみ（design.md で規定）。

### 1.3 結論（現状）

| 項目 | 状態 |
|------|------|
| ドメイン資産 | なし |
| UI / フロント | なし |
| ゲームロジック | なし |
| データ永続化 | 不使用のため不要 |
| 既存パターンへの適合 | 該当なし（新規構築） |

---

## 2. Requirements Feasibility & Requirement-to-Asset Map

要件から導かれる技術要素と、現状資産の有無を対応させた結果。既存コードがないため、すべて **Missing**。

| 要件ID | 技術ニーズ | 既存資産 | ギャップ | 備考 |
|--------|------------|----------|----------|------|
| 1.1–1.4 | 参加者モデル、ディーラー役、席順・ランダム配置 | なし | **Missing** | GameEngine / GameState で新規実装 |
| 2.1–2.3 | チップ初期値・表示・増減、0時の除外/参加不可 | なし | **Missing** | GameState.players, UI で新規実装 |
| 3.1–3.3 | 永続化なし・メモリのみ保持 | なし | **Missing** | 設計どおり永続化しないだけなので制約は満たしやすい |
| 4.1–4.3 | Apple風UI、テーブル・カード・アクションの視認・操作 | なし | **Missing** | GameScreen, TableView, PlayerSeats, ActionBar を新規実装 |
| 5.1–5.5 | ブラインド、配札、ベッティングラウンド、役判定、ポット配分 | なし | **Missing** | GameEngine + HandEvaluator（＋ライブラリ）で新規実装 |
| 6.1–6.3 | 人間用アクションUI、チップ指定、有効アクションのみ有効化 | なし | **Missing** | ActionBar + GameController + GameEngine で新規実装 |
| 7.1–7.3 | CPU行動決定、行動表示、ディーラー業務 | なし | **Missing** | CPUStrategy, GameEngine, UI で新規実装 |
| 8.1–8.3 | ゲーム開始・ハンド継続・終了・再開 | なし | **Missing** | GameController, GameEngine, GameScreen で新規実装 |

**Research Needed**: 役判定ライブラリの選定（design.md / research.md で「実装時に選定」とされている）。それ以外の未知要素は設計でおおむね解消済み。

---

## 3. Implementation Approach Options

既存のアプリケーションコードが存在しないため、**拡張対象がなく、すべて新規作成**となる。

### Option A: Extend Existing Components

- **適用可否**: **該当なし**。拡張すべき既存の UI / ゲームロジックが存在しない。
- **Trade-offs**: 省略。

### Option B: Create New Components（実質的に唯一の選択肢）

- **適用**: 要件・設計で定義されたコンポーネントをすべて新規作成する。
- **対象**:  
  - UI: GameScreen, TableView, PlayerSeats, ActionBar  
  - Application: GameController  
  - Domain: GameEngine, HandEvaluator（＋アダプタ）, CPUStrategy  
  - データ: GameState, Player, Card, HandRank, PlayerAction 等の型
- **統合**: design.md の Architecture Pattern & Boundary Map に従い、UI → GameController → GameEngine / HandEvaluator / CPUStrategy の依存方向で接続する。
- **Trade-offs**:  
  - 新規ファイル数は多くなるが、責務が分かれておりテスト・保守しやすい。  
  - 既存資産がないため、設計どおりにディレクトリ・モジュールを一から定義できる。

### Option C: Hybrid Approach

- **適用**: 既存コードがないため「既存を拡張する部分」が存在せず、実質は Option B と同じ（すべて新規）。  
- 「ハイブリッド」として意味があるのは、例えば「まず GameEngine + HandEvaluator のみ実装してテストし、その後 UI を載せる」といった**段階的実装**の進め方。設計の境界を変えずにフェーズを分けるだけなので、ここでは Option B の進め方の一形態とみなす。

---

## 4. Implementation Complexity & Risk

| 観点 | 評価 | 理由（1行） |
|------|------|-------------|
| **Effort** | **L（1〜2週間）** | ゲームルール・役判定・CPU・UI を一通り実装する機能量があり、既存資産がないため全体を新規実装する必要がある。 |
| **Risk** | **Medium** | 技術スタック（React + TypeScript）とアーキテクチャは設計で定まっており、未知の統合やレガシー制約はない。役判定ライブラリ選定と Apple 風 UI の解釈に多少の余地がある。 |

---

## 5. Recommendations for Design / Implementation

- **設計フェーズ**: 本プロジェクトは設計（design.md）が既にあり、ギャップ分析時点で設計は完了している。設計の修正が必要になった場合のみ、本ギャップ分析を参照して「拡張対象がない」前提で検討すればよい。
- **実装アプローチ**: **Option B（新規コンポーネント作成）** で、design.md のコンポーネント・インターフェース・データモデルに沿って実装する。
- **設計フェーズへ持ち越す項目**: 特になし。役判定ライブラリの選定は design.md 上「実装時に選定」であり、tasks 生成時にタスクとして含めれば足りる。
- **注意**: 既存コードが無いため、validate-gap の主な価値は「要件〜技術ニーズ〜既存資産」の対応を明文化し、**すべて Missing であることを確認した**こと。実装は design.md と spec-tasks のタスク一覧に従って進める。

---

## Output Checklist（要約）

- **Requirement-to-Asset Map**: 上記表のとおり。全要件で既存資産なし → **Missing**。
- **Options**: A は該当なし。B が実質唯一。C は B の段階的実施と同義。
- **Effort**: L（1〜2週間）。**Risk**: Medium。
- **Recommendations**: Option B で design.md に沿って新規実装。設計の追加修正は不要。役判定ライブラリは tasks に含める。
