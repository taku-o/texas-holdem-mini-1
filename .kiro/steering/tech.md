# Technology Stack

<!-- updated_at: 2026-03-16 — 実装済み構成・コマンドを反映 -->

## Architecture

クライアント単体のレイヤー分離型SPA。UI層・Application層・Domain層の3層構成。バックエンド・DBなし。

- **UI層**: React コンポーネント（GameScreen, TableView, PlayerSeats, ActionBar）
- **Application層**: GameController（状態保持・アクションルーティング・ゲームフロー制御）
- **Domain層**: GameEngine, HandEvaluator, CPUStrategy（純粋なゲームロジック、UIに依存しない）

## Core Technologies

- **Language**: TypeScript（strict mode、any禁止）
- **Framework**: React 18+
- **Styling**: Tailwind CSS（Apple HIG風：余白・タイポグラフィ・控えめな装飾）
- **Runtime**: ブラウザのみ（Node.jsバックエンドなし）

## Key Libraries

- **@pokertools/evaluator** (v1.0.1): 役判定。Cactus Kev系、7枚対応、零依存、TypeScript。アダプタ経由で利用。

## Development Standards

- ドキュメント（要件・設計）にない機能は実装しない（CLAUDE.local.md 準拠）
- 将来拡張・最適化は考慮しない。必要時のみ追加する
- ゲームロジックはUIから分離し、単体テスト可能にする
- useEffectはどうしても必要な場合以外使用しない

## Development Environment

### Required Tools

- Git
- Node.js / npm

### Common Commands

```bash
npm run dev     # 開発サーバー（Vite）
npm run build   # TypeScript ビルド + Vite ビルド
npm run test    # 単体テスト（Vitest）
npm run preview # ビルド後のプレビュー
```

## Key Technical Decisions

- **クライアント完結SPA**: DB不要要件に合致、サーバー不要
- **役判定は外部ライブラリ**: @pokertools/evaluator を採用。自前実装の検証コストを回避
- **アダプタパターン**: 外部ライブラリはアダプタで薄くラップし、ドメインから直接依存しない
- **単一ポット**: サイドポットは扱わない（要件5.3）

---
_依存関係の完全な一覧は書かない。パターンと方針のみ記載。_
