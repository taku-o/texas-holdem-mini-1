# texas-holdem-mini-1

テキサスホールデムのミニ Web アプリです。

## 開発環境での動かし方

Node.js と npm がインストールされている前提です。

```bash
cd /Users/taku-o/Documents/workspaces/texas-holdem-mini-1

# 依存パッケージのインストール（初回のみ）
npm install

# 開発サーバーの起動
npm run dev
```

`npm run dev` 実行後にターミナルに表示される URL（例: `http://localhost:5173/`）をブラウザで開くと、アプリを操作できます。

## ビルドとプレビュー

本番想定のビルドを作成したい場合は次のコマンドを実行します。

```bash
cd /Users/taku-o/Documents/workspaces/texas-holdem-mini-1

# ビルドの作成
npm run build

# ビルド結果のローカルプレビュー
npm run preview
```

`npm run preview` 実行後に表示される URL をブラウザで開くと、`dist/` に出力されたビルドを確認できます。
