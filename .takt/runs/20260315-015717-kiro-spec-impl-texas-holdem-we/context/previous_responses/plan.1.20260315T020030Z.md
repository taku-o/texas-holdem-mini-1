Good. Now I have everything I need to write the plan.

---

## 計画レポート

### タスクの概要

**対象タスク**: tasks.md のタスク 1（1.1 + 1.2）— プロジェクト・フロントエンド基盤の構築

| サブタスク | 内容 | 関連要件 |
|-----------|------|---------|
| 1.1 | React + TypeScript プロジェクト初期化。ビルド・開発サーバーが動作する状態にする | 3.1, 3.2, 3.3 |
| 1.2 | Tailwind CSS 導入。Apple風の余白・タイポグラフィの土台を用意する | 4.1 |

### 現状の調査結果

- **既存ソースコード**: なし（グリーンフィールド）。`package.json` も `src/` も存在しない
- **Node.js**: v24.7.0、npm 11.5.1 利用可能
- **要件上の制約**:
  - DB/サーバー不使用、クライアントのみで動作（要件 3.1–3.3）
  - デザインは Apple 公式アプリ風（要件 4.1）
  - `useEffect` は「どうしても必要な時以外は使用してはならない」（CLAUDE.local.md）

### 設計判断

#### ビルドツール: Vite

- React + TypeScript の SPA として **Vite** を採用する
- 理由: 高速な開発サーバー、React 18+ の公式テンプレートあり、設定が最小限
- `npm create vite@latest . -- --template react-ts` でプロジェクトルートに直接初期化する

#### Tailwind CSS v4

- Tailwind CSS を導入し、Vite + PostCSS で統合する
- Apple風デザインの土台として以下を定義:
  - フォント: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', ...` のシステムフォントスタック
  - 配色: ニュートラルトーン（白/グレー/ブラック基調）、Apple HIG に沿った控えめな装飾
  - 余白・タイポグラフィ: Tailwind のユーティリティで対応（カスタムテーマ拡張は最小限）

#### テストフレームワーク: Vitest

- design.md の Testing Strategy に基づき、Vitest を導入する
- Playwright は後続タスク（10.3）で導入するため、ここでは Vitest のみ
- CLAUDE.local.md が「テストできる機能については単体テストを用意する」と要求しているため、テスト基盤をこのタスクで構築する

### ディレクトリ構成

design.md のアーキテクチャに従い、レイヤード構成を採用する（単一機能アプリのため Vertical Slice は不要）:

```
(project root)
├── src/
│   ├── domain/          # GameEngine, HandEvaluator, CPUStrategy（後続タスク）
│   ├── application/     # GameController（後続タスク）
│   ├── ui/              # React コンポーネント群（後続タスク）
│   │   └── components/
│   ├── App.tsx          # ルートコンポーネント
│   ├── main.tsx         # エントリポイント
│   └── index.css        # Tailwind 読み込み + Apple風ベーススタイル
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts (or vite.config.ts 内で設定)
└── tailwind.config.ts (Tailwind v4ではCSS内で設定する場合あり)
```

### 実装アプローチ

#### タスク 1.1: プロジェクト初期化

1. **Vite でプロジェクトを生成**: `npm create vite@latest . -- --template react-ts`
   - プロジェクトルートに直接展開する
2. **依存関係をインストール**: `npm install`
3. **Vitest を追加**: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
4. **ビルド確認**: `npm run build` が成功すること
5. **テスト確認**: vitest が動作すること
6. **Vite のテンプレートが生成する不要なデモコンテンツ（カウンターアプリ等）を除去**し、最小限の App.tsx にする

#### タスク 1.2: Tailwind CSS 導入 + Apple風土台

1. **Tailwind CSS をインストール**: `npm install -D tailwindcss @tailwindcss/vite`（Tailwind v4 の場合）、または `tailwindcss postcss autoprefixer`（v3 の場合）
2. **CSS に Tailwind ディレクティブを追加**: `@import "tailwindcss"` or `@tailwind base/components/utilities`
3. **Apple風ベーススタイルの定義**:
   - システムフォントファミリーの設定
   - ベースの背景色・テキスト色の設定
   - `body` のアンチエイリアシング設定（`-webkit-font-smoothing: antialiased`）
4. **App.tsx に最小限の表示**: Apple風スタイルが反映されていることを確認できるシンプルな画面
5. **動作確認**: `npm run dev` で開発サーバーが起動し、Tailwind のクラスが適用されること

### Coder 向け実装ガイドライン

#### 参照すべきパターン
- 既存コードなし（グリーンフィールド）。Vite テンプレートの構造に従い、不要なデモコードを除去する

#### 変更の影響範囲
- 全て新規ファイルの作成。既存ファイルへの変更はなし

#### 注意すべきアンチパターン
1. **CLAUDE.local.md の制約を厳守**:
   - `useEffect` は「どうしても必要な時以外は使用してはならない」— タスク 1 では useEffect は不要
   - ドキュメントにない余計な機能は作らない
   - TODO コメント禁止
2. **Knowledge の制約**:
   - 1ファイル 300行超は REJECT
   - 状態の直接変更（ミューテーション）は REJECT
   - 説明コメント（What/How）は REJECT、Why のみ
3. **過剰な実装を避ける**:
   - このタスクはプロジェクトの骨格のみ。ゲームロジック、コンポーネント分割、型定義は後続タスクの責務
   - App.tsx は最小限（「ゲーム開始」ボタンなどの UI は後続タスク 9.1 の責務）
   - Tailwind のカスタムテーマ拡張は最小限にし、Apple風の「土台」としてフォント・色・余白の基本設定のみ

#### 具体的な成果物チェックリスト
- [ ] `npm run dev` で開発サーバーが起動する
- [ ] `npm run build` がエラーなく成功する
- [ ] `npx vitest run` でテストが実行できる（最低 1 つのサンプルテスト）
- [ ] Tailwind CSS のクラスがブラウザで適用される
- [ ] Apple風のフォント・色が反映された最小限の画面が表示される

### 確認事項

なし。タスク 1 の要件は明確であり、全て自己解決可能。