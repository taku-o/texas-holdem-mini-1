# タスク計画

## 元の要求
`/kiro:spec-impl texas-holdem-review-fixes 7` — タスク7「ゲーム開始時の乱数関数の結合を契約として明示する」の実装

## 分析結果

### 目的
ゲーム開始時の席決定・デッキシャッフル等に用いる乱数が、引数で渡す形で差し替え可能であることをコメントまたは設計で明記する（Requirement 9）。

### スコープ
- **変更ファイル:** `src/domain/gameSetup.ts` のみ（1ファイル）
- **変更種別:** JSDoc コメントの追加のみ。関数シグネチャ・振る舞いの変更なし

### 現行実装の充足状況

既存の `randomFn` 引数パターンで要件9は**完全に充足**されている。

| 観点 | 現行実装の状態 | 根拠 |
|------|--------------|------|
| `setupNewGame` が `randomFn` を引数で受けている | ✅ 充足 | `gameSetup.ts:6` — `setupNewGame(randomFn: () => number)` |
| 席決定で `randomFn` を使用 | ✅ 充足 | `gameSetup.ts:7-8` — `Math.floor(randomFn() * PLAYER_COUNT)` |
| デッキシャッフルで `randomFn` を使用 | ✅ 充足 | `gameSetup.ts:19` — `shuffleDeck(createDeck(), randomFn)` |
| テストでモック注入可能 | ✅ 充足 | `gameSetup.test.ts` — 全テストが `() => 0.5` 等の固定関数を使用 |
| ドメイン・アプリ層に `Math.random` 直接呼び出しなし | ✅ 充足 | `App.tsx:6` のルートでのみ `Math.random` を渡す設計 |

### 実装アプローチ

タスク指示書に「既存の randomFn 引数で充足している場合は記載のみでよい」と明記されているため、`setupNewGame` 関数に JSDoc コメントを追加する。

**追加位置:** `src/domain/gameSetup.ts` 6行目 `export function setupNewGame` の直前

**コメント内容:**
- `randomFn` パラメータが、ゲーム初期化における全乱数（席決定・デッキシャッフル）の唯一のソースであること
- テスト時には固定値関数やシード付き乱数を注入して決定論的な結果を得られるという設計意図（Why）

## 実装ガイドライン

- JSDoc は `@param randomFn` に設計意図（テスタビリティ・再現性のための依存注入ポイント）を記載する
- コードの動作をそのまま言い換える What/How コメント（例:「randomFn で席を決定する」）は書かない。**なぜ引数で受け取るのか**（Why）を書く
- 形式的な空コメント（`/** ゲームをセットアップする */`）にしない。情報を追加するコメントにする
- 関数シグネチャや振る舞いは一切変更しない
- テストの追加は不要（既存テストが `randomFn` の差し替え可能性を十分に証明している）