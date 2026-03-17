# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-webapp 1` — Kiro spec の texas-holdem-webapp タスク 1（1.1 + 1.2）を実装する。プロジェクト・フロントエンド基盤の構築。

## 分析結果

### 目的
テキサスホールデム Web アプリのフロントエンド基盤を構築する。具体的には:
- **タスク 1.1**: React + TypeScript プロジェクトを初期化し、ビルド・開発サーバーが動作する状態にする（要件 3.1, 3.2, 3.3）
- **タスク 1.2**: Tailwind CSS を導入し、Apple 風の余白・タイポグラフィの土台を用意する（要件 4.1）

### 参照資料の調査結果

**現状**: グリーンフィールド。`package.json`、`src/`、その他アプリケーションソースは一切存在しない。gap-analysis.md でも全要件が Missing と確認済み。

**design.md の規定**:
- アーキテクチャ: クライアント単体のレイヤー分離型 SPA（UI → Application → Domain）
- 技術スタック: React 18+、TypeScript、Tailwind CSS、ブラウザのみ（サーバー・DB なし）
- 状態管理: クライアントメモリのみ（リロードで破棄）

**research.md の規定**:
- Apple 風 UI: 一貫性・階層・余白・タイポグラフィ、システムフォント（-apple-system）や角丸・控えめなシャドウ

**CLAUDE.local.md の制約**:
- `useEffect` は「どうしても必要な時以外は使用してはならない」
- ドキュメントにない余計な機能は作らない
- TODO コメント禁止

### スコープ

| 対象 | 変更内容 |
|------|---------|
| プロジェクト設定ファイル群（新規） | package.json, tsconfig.json, vite.config.ts 等 |
| エントリポイント（新規） | index.html, src/main.tsx |
| ルートコンポーネント（新規） | src/App.tsx（最小限） |
| スタイル（新規） | src/index.css（Tailwind + Apple 風ベーススタイル） |
| テスト基盤（新規） | vitest 設定、サンプルテスト 1 件 |

既存ファイルへの変更はなし。

### 検討したアプローチ

| アプローチ | 採否 | 理由 |
|-----------|------|------|
| Vite + react-ts テンプレート | **採用** | 高速な開発サーバー、React 18+ の公式テンプレートあり、設定最小限。design.md の技術スタックと整合 |
| Create React App | 不採用 | メンテナンス停止済み、非推奨 |
| Next.js | 不採用 | サーバー機能が不要（要件 3.1: DB/サーバー不使用）。過剰 |
| Tailwind CSS v4（@tailwindcss/vite プラグイン） | **採用** | Vite とのネイティブ統合、CSS-first 設定で設定ファイル最小化 |
| Tailwind CSS v3（postcss + tailwind.config.js） | 代替案 | v4 の `@tailwindcss/vite` が問題を起こした場合のフォールバック |
| Vitest（テストフレームワーク） | **採用** | Vite ネイティブ、Jest 互換 API。CLAUDE.local.md が単体テストを要求 |

### 実装アプローチ

**タスク 1.1: プロジェクト初期化**

1. `npm create vite@latest . -- --template react-ts` でプロジェクトルートに Vite テンプレートを展開
2. `npm install` で依存関係をインストール
3. `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` でテスト基盤を追加
4. vite.config.ts に vitest の設定を追加（test セクション: environment: 'jsdom'）
5. Vite テンプレートのデモコンテンツ（カウンターアプリ、assets/react.svg 等）を除去し、最小限の App.tsx にする
6. `npm run build` と `npx vitest run` で動作確認

**タスク 1.2: Tailwind CSS + Apple 風土台**

1. `npm install -D tailwindcss @tailwindcss/vite` をインストール
2. vite.config.ts に `@tailwindcss/vite` プラグインを追加
3. src/index.css に `@import "tailwindcss"` を追加
4. Apple 風ベーススタイルを index.css に定義:
   - フォントファミリー: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif`
   - アンチエイリアシング: `-webkit-font-smoothing: antialiased`
   - ベース配色: 白/グレー基調のニュートラルトーン
5. App.tsx に Tailwind クラスを使った最小限の表示を配置（Apple 風スタイルの確認用）
6. `npm run dev` で開発サーバー起動・Tailwind クラス適用を確認

**ディレクトリ構成**（design.md のアーキテクチャに準拠、後続タスク用のディレクトリは作成不要）:

```
(project root)
├── src/
│   ├── App.tsx           # ルートコンポーネント（最小限）
│   ├── App.test.tsx      # サンプルテスト
│   ├── main.tsx          # エントリポイント
│   └── index.css         # Tailwind 読み込み + Apple 風ベーススタイル
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

`src/domain/`、`src/application/`、`src/ui/` は後続タスクで必要になった時に作成する。

## 実装ガイドライン

- **Vite テンプレートのデモコード除去**: カウンター、ロゴ SVG、App.css のデモスタイルは全て除去する。App.tsx は Tailwind クラスのみで最小限のレイアウトを表示する
- **App.tsx の内容**: 後続タスク 9.1（ゲーム画面ルートと開始 UI）の責務を侵さないよう、「Texas Hold'em」等のタイトル文字を表示する程度の最小限にとどめる。「ゲーム開始」ボタン等は含めない
- **useEffect 禁止**: タスク 1 では useEffect は不要。使用しないこと（CLAUDE.local.md）
- **TODO コメント禁止**: コードに TODO を書かない（Knowledge ポリシー）
- **1 ファイル 300 行上限**: 超えないこと（Knowledge ポリシー）。タスク 1 では問題にならないはず
- **イミュータブル操作**: 配列・オブジェクトの直接変更（push, splice 等）は禁止（Knowledge ポリシー）
- **説明コメント禁止**: What/How のコメントは書かない。Why のみ許容（Knowledge ポリシー）
- **テスト**: App コンポーネントが正しくレンダリングされることを確認する最小限のテストを 1 件作成する
- **Tailwind v4 が動作しない場合**: v3 にフォールバックする（`npm install -D tailwindcss postcss autoprefixer` + `tailwind.config.ts` + PostCSS 設定）。ただし、まず v4 を試みること

## スコープ外

| 項目 | 除外理由 |
|------|---------|
| ゲームロジック・型定義（タスク 2〜6） | 後続タスクの責務 |
| UI コンポーネント分割（タスク 7〜9） | 後続タスクの責務 |
| ゲーム開始ボタン・画面遷移（タスク 9.1） | 後続タスクの責務 |
| Playwright E2E テスト（タスク 10.3） | 後続タスクの責務 |
| `src/domain/`, `src/application/`, `src/ui/` ディレクトリ作成 | ファイルが入る時に作成する |
| Tailwind のゲーム固有カスタムテーマ | 後続タスクで必要に応じて追加 |

## 確認事項

なし。タスク 1 の要件は明確であり、設計・技術選定ともに design.md・research.md で規定済み。