# Requirements Document: レビュー指摘対応（第2弾）

## Introduction

本仕様は、テキサスホールデム Web アプリ（`texas-holdem-webapp`）に対する第2弾レビュー指摘事項を要件として定義する。既存の `texas-holdem-webapp` および `texas-holdem-review-fixes` の仕様を前提とし、リポジトリに残存したデバッグ用ファイルの排除、`ActionBar` のチップ額入力 UX の改善、`useGameController` における非同期処理パターンの健全化を目的とする。

## Project Description (Input)

次のレビュー指摘事項に対応したい。

**CRITICAL**

1. デバッグファイルがリポジトリに含まれている
   - `debug_common.ts`, `debug_common.test.ts`, `debug_game.ts`, `debug_game2.ts`, `debug_game3.ts`
   - マージ前に削除が必要

---

**MEDIUM**

2. `ActionBar.tsx` の数値入力でブラウザ上の直接入力が制約されない
   - `<input type="number">` でユーザーが手入力した値は `min` / `max` を超えられる
   - `isChipAmountValid()` による Confirm ボタン無効化で送信はブロックされるが、入力自体は許容される
   - UX 上の問題であり、ロジックバグではない

3. `useGameController.ts` の非同期パターン
   - IIFE async パターン (`(async () => { ... })()`) で未追跡の Promise が発生
   - `processingRef` フラグで競合は防止されているが、コンポーネントアンマウント時のクリーンアップがない
   - 現状動作するが、`AbortController` 等の導入が理想的

---

## Requirements

### 1. デバッグ用ファイルの排除（リポジトリ全体）

**目的:** デバッグ専用ファイルが本番想定ブランチに含まれないようにし、意図しないデバッグコードの混入を防ぐ。

#### 受け入れ基準

1. The repository shall 本番想定のブランチ（`master` / `main` 相当）に、`debug_common.ts`, `debug_common.test.ts`, `debug_game.ts`, `debug_game2.ts`, `debug_game3.ts` などのデバッグ専用ファイルを含めない。
2. If 本番想定ブランチへのマージ前に上記デバッグ専用ファイルが作業ツリーに存在する場合、the development process shall それらを削除するか、開発専用のディレクトリ（ビルド対象外）へ移動してからマージする。

---

### 2. ActionBar の数値入力 UX（ActionBar.tsx）

**目的:** 人間プレイヤーのチップ額入力時に、`min` / `max` / 所持チップの範囲外の値がフィールドに残り続けないようにし、UX を改善する。

#### 受け入れ基準

1. While 人間プレイヤーが `ActionBar` の数値入力フィールドにベット/レイズ額を手入力している場合、the Game UI shall 入力値が `min` / `max` およびプレイヤーの所持チップ残高の範囲外にならないように制約し（例: 入力直後に範囲内へクリップする）、範囲外の値がフィールドに残り続けないようにする。
2. If プレイヤーが一時的に範囲外の値を入力した場合、the Game UI shall 即座に値を許可範囲に補正するか、明示的なエラーメッセージ表示と Confirm ボタンの無効化を行い、プレイヤーが有効な値に修正するとエラーが解消されるようにする。

---

### 3. useGameController の非同期パターンとキャンセル（useGameController.ts）

**目的:** IIFE async パターンによる未追跡 Promise や、コンポーネントアンマウント後の不要な処理実行を防ぎ、安全な非同期制御を行う。

#### 受け入れ基準

1. When `useGameController` がゲーム開始・次のハンド進行・CPU アクション処理などの非同期処理を開始する場合, the Game Controller shall 各非同期処理に対して `AbortController` などのキャンセルハンドルを保持し、呼び出し元からキャンセル可能にする。
2. If `useGameController` を利用する React コンポーネントがアンマウントされる場合, the Game Controller shall 進行中の非同期処理をキャンセルし（`AbortController.abort()` など）、アンマウント後に状態更新や副作用が発生しないようにする。
3. If 新しいゲームアクションが開始される時点で、同一カテゴリの非同期処理がまだ進行中である場合, the Game Controller shall 既存の処理を明示的にキャンセルするか、完了を待機するポリシーを定義し、未追跡の Promise が蓄積しないようにする。

---

## 要件とレビュー指摘の対応表

| 要件 | 優先度 | 指摘番号（第2弾） |
|------|--------|--------------------|
| 1. デバッグ用ファイルの排除 | CRITICAL | 1 |
| 2. ActionBar の数値入力 UX | MEDIUM | 2 |
| 3. useGameController の非同期パターンとキャンセル | MEDIUM | 3 |

---
_実装は既存の `texas-holdem-webapp` のコードベース（`src/`）に対して行う。設計・タスクは本 spec の requirements 承認後に生成する。_

