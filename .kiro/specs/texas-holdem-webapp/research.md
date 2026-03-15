# Research & Design Decisions Template

---
**Purpose**: 本機能の技術調査・アーキテクチャ検討の記録。設計書（design.md）の根拠とする。
---

## Summary

- **Feature**: texas-holdem-webapp
- **Discovery Scope**: New Feature（グリーンフィールド・ブラウザ専用SPA）
- **Key Findings**:
  - テキサスホールデムのブラウザ実装は React + クライアント状態が一般的。DB不要要件に合致。
  - 役判定は TypeScript/JavaScript の既存ライブラリ（Cactus Kev 系や評価用ライブラリ）の利用が現実的。
  - Apple風UIは HIG の一貫性・階層・余白・タイポグラフィをWebに適用する形で対応可能。

## Research Log

### フロントエンド構成（SPA・状態管理）

- **Context**: データベースを使わず、リロードでデータが消える前提のため、バックエンド不要の構成を確認した。
- **Sources Consulted**: 公開されている React 製 Texas Hold'em リポジトリ（Singleplayer / Multiplayer）、SPA の状態管理パターン
- **Findings**:
  - シングルプレイヤーまたは少人数向けでは React + クライアント状態（useState/useReducer または Zustand 等）で完結する例が多い。
  - マルチプレイヤーでは Socket.IO + Node が使われるが、本件は人間1+CPU4のためサーバー不要でよい。
- **Implications**: フロントエンドのみのSPAとし、ゲーム状態は React state または軽量ストアで保持。永続化は行わない。

### 役判定（ハンドランク）

- **Context**: ショーダウン時の勝者判定に必要。
- **Sources Consulted**: winning-poker-hand-rank（TypeScript）、poker-hand（Cactus Kev）、Poker and TypeScript（OpenReplay ブログ）
- **Findings**:
  - TypeScript 向けには `winning-poker-hand-rank` 等のライブラリが利用可能。
  - Cactus Kev 系アルゴリズムは 7 枚から 5 枚の最良手を求める標準的な方式。
  - 自前実装も可能だが、検証コストを考えると既存ライブラリ利用を推奨。
- **Implications**: 役判定は外部ライブラリを 1 つ採用し、インターフェースを薄くラップしてドメインから利用する形とする。

### 役判定ライブラリの選定と npm メンテ状況（設計フェーズで確定）

- **Context**: 実装前に採用ライブラリを決め、npm の更新・メンテ状況を確認してリスクを抑える。
- **Sources Consulted**: npm registry、@pokertools/evaluator / poker-hand-evaluator / poker-evaluator 等の比較
- **Findings**:
  - **@pokertools/evaluator**: TypeScript・5/6/7 枚対応・零依存。Cactus Kev / Paul Senzee 系。7 枚で約 1,700 万ハンド/秒。npm で公開（v1.0.1）。MIT。
  - poker-hand-evaluator: Cactus Kev 系・5 枚中心。約 102KB のルックアップテーブル。
  - poker-evaluator: Two Plus Two 系・3/5/6/7 枚対応。
- **Implications**: 7 枚を直接サポートし TypeScript と零依存である **@pokertools/evaluator** を採用。設計・tasks で選定済みとし、タスク 3.1 では選定ではなくアダプタ実装に集中する。

### Apple風デザイン

- **Context**: 要件「Apple公式アプリでよくありそうな感じ」を満たすための指針。
- **Sources Consulted**: Apple Human Interface Guidelines、Safari/Web 向け最適化ドキュメント
- **Findings**:
  - HIG の原則は一貫性・調和・階層。Web では「明確な階層・適度な余白・読みやすいタイポグラフィ・控えめな装飾」で再現できる。
  - システムフォント（-apple-system）や SF Pro に近いフォント、角丸・控えめなシャドウがよく使われる。
- **Implications**: デザインでは「クリーンなレイアウト・余白・タイポグラフィ・アクションの明確さ」を設計原則に含める。具体的なフォント/色は実装で指定。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 単一SPA + クライアント状態 | React 単体、状態はメモリのみ | シンプル、DB不要と一致、デプロイが容易 | 複雑なゲーム状態の分割設計が必要 | 本要件に適合 |
| ゲームロジック分離 | UI とルール/状態更新をレイヤ分離 | テスト容易、役判定・CPU ロジックの差し替えが容易 | レイヤ間のインターフェース定義が必要 | 採用推奨 |

## Design Decisions

### Decision: フロントエンドのみの SPA とする

- **Context**: 要件 3（DB 不使用、リロードでデータ消失でよい）。
- **Alternatives Considered**: 1) バックエンド + DB で永続化 2) バックエンドのみ（セッション） 3) クライアントのみ
- **Selected Approach**: クライアントのみ。ゲーム状態は React の state または 1 つの軽量ストアで保持し、リロードで破棄。
- **Rationale**: 要件で永続化が不要と明示されているため、構成を最小限にできる。
- **Trade-offs**: 複数デバイス・複数タブ間の同期は行わない。同一タブ内の 1 セッションに限定する。
- **Follow-up**: 実装時に state 構造（ゲームフェーズ・プレイヤー・ポット・カード）を型で固定する。

### Decision: ゲームロジック層を UI から分離する

- **Context**: 役判定・ベッティングラウンド・CPU 行動・ポット配分など、テスト可能な純粋ロジックが必要。
- **Alternatives Considered**: 1) コンポーネント内にロジックを直書き 2) 専用のゲームロジック層（ドメイン）を設ける
- **Selected Approach**: ゲームロジックを「ゲームエンジン」として分離し、UI は状態とイベント（ユーザーアクション）のみを扱う。
- **Rationale**: 単体テストでルール・役判定・配分を検証でき、UI 変更の影響を限定できる。
- **Trade-offs**: 初期のモジュール分割の手間は増えるが、保守性とテスト容易性が上がる。
- **Follow-up**: design.md で GameEngine / HandEvaluator / CPUPlayer などの境界とインターフェースを定義する。

### Decision: 役判定は既存ライブラリを採用する

- **Context**: テキサスホールデムの役順・比較は仕様が明確であり、実績ある実装の利用が安全。
- **Alternatives Considered**: 1) 自前実装 2) 既存の TypeScript/JavaScript ライブラリを利用
- **Selected Approach**: **@pokertools/evaluator** を採用し、アプリ側は「7 枚カード → 役ランク」のインターフェースでラップする。
- **Rationale**: TypeScript 対応・5/6/7 枚対応・Cactus Kev 系アルゴリズム・零依存・高性能。npm で公開されており、7 枚評価を直接サポートする。
- **Trade-offs**: ライブラリの API（evaluateBoard / evaluate + getCardCode）に合わせた薄いアダプタが必要。
- **Follow-up**: 実装はタスク 3.1 で @pokertools/evaluator を用いたアダプタを実装する。

## Risks & Mitigations

- **ゲーム状態の複雑さ**: フェーズ・プレイヤー・ポット・サイドポット・オールインなどで状態が膨らむ可能性 → 設計で状態モデルと遷移を明確にし、1 つの state ツリーに正規化する。
- **CPU の行動アルゴリズム**: 初版はシンプルなルールベース（例: 役の強さとポットオッズに基づく）とし、高度な AI は対象外とする。
- **Apple風の解釈差**: 「Apple風」は主観になりうる → 設計書に「クリーン・余白・階層・判別しやすさ」を原則として書き、具体の色・フォントは実装で定義する。

## References

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) — 一貫性・階層・余白の参照
- [Optimizing Your Website for Safari](https://developer.apple.com/documentation/webkit/optimizing-your-website-for-safari) — Web での見た目・フォント
- [Poker and TypeScript (OpenReplay)](https://blog.openreplay.com/forever-functional-poker-and-typescript/) — 役判定の型・ロジックの参考
- [@pokertools/evaluator (npm)](https://www.npmjs.com/package/@pokertools/evaluator) — 採用役判定ライブラリ。7 枚対応・TypeScript・零依存。Cactus Kev / Paul Senzee 系 Perfect Hash。
