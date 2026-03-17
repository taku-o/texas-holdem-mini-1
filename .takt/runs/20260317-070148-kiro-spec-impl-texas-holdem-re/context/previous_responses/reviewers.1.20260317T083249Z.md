## arch-review
This is in `preparePreflopRound` which calls `postBlinds` first, and `postBlinds` always sets `lastAggressorIndex: bbIndex`. So this is logically safe, but again it's a non-null assertion on a `number | null` type.

Now I have a comprehensive picture. Let me compile my review.

---

# アーキテクチャレビュー

## 前回指摘の追跡

これはアーキテクチャレビューの初回実行（Movement Iteration: 1）であり、前回のopen findingsは存在しない。

## レビュー結果

### 変更スコープ

| 項目 | 値 |
|------|-----|
| サイズ | Large（+2952 / -552 = 約3500行、34ファイル） |
| 論理的一貫性 | ✅ タスク1〜12が一連のレビュー修正対応として一貫 |
| スコープ宣言との一致 | ✅ tasks.md記載のスコープと実際の変更が一致 |

### 構造・設計の検証

| 観点 | 結果 | 備考 |
|------|------|------|
| ファイル行数 | ✅ | 全ソースファイル200行以下（最大: `ActionBar.tsx` 161行） |
| 循環依存 | ✅ | なし。UI→Application→Domainの方向が一貫 |
| モジュール凝集性 | ✅ | 各ファイル1責務（betting, dealing, showdown等） |
| レイヤー設計 | ✅ | 依存方向は上位→下位。逆方向なし |
| イミュータブル設計 | ✅ | 全状態変更関数が新オブジェクトを返す。ローカル変数の変更のみ |
| `any`型 | ✅ | 不使用 |
| TODO/FIXME | ✅ | なし |
| 説明コメント | ✅ | showdown.tsのコメントはWhy（設計判断の理由・不変条件）を説明しており適切 |
| DRY | ✅ | startGame/handleActionの非同期パターンは似ているが責務が異なる（初期化 vs アクション処理） |
| デッドコード | ✅ | AI reviewで指摘された未使用インポート3件は修正済み |
| エラーハンドリング | ✅ | catch節はconsole.error+状態リセット。空catchなし |
| テストカバレッジ | ✅ | 全変更に対応するテストが存在 |
| 操作の一覧性 | ✅ | gameFlow.tsがゲームフロー操作を集約、betting.tsがアクション操作を集約 |
| パブリックAPI | ✅ | gameEngine.tsはドメイン操作のみ公開。内部実装の漏洩なし |

### 検出した問題

#### ARCH-012-01 (new) — `ValidAction` 型が判別共用体でなく、消費側で非null断言・防御チェックを強制

**ファイル**: `src/domain/types.ts:39-43`

**問題**: 新規導入された `ValidAction` 型で `min`/`max` が常にオプショナルだが、`bet`/`raise` では必ず値が存在するという不変条件が型で表現されていない。結果として：

- `src/domain/cpuStrategy.ts:79-80` — `validAction.min!`, `validAction.max!`（非null断言）
- `src/domain/cpuStrategy.ts:110,113,124,127,138` — `betAction!`, `raiseAction!`（非null断言 × 5）
- `src/ui/ActionBar.tsx:37,50,68,76` — `action?.min !== undefined`, `action?.max !== undefined`（防御的undefinedチェック × 4）

これは「関連フィールドのクロスバリデーション欠如」に該当する。`type` と `min`/`max` の存在は意味的に結合しているが、型で強制されていない。

**修正案**: 判別共用体（discriminated union）に変更する。

```typescript
// src/domain/types.ts
export type ValidAction =
  | { type: 'fold' }
  | { type: 'check' }
  | { type: 'call' }
  | { type: 'bet'; min: number; max: number }
  | { type: 'raise'; min: number; max: number }
```

これにより：
- `cpuStrategy.ts` の `!` 断言7箇所が不要になる（`type` で絞り込めば `min`/`max` が必ず存在）
- `ActionBar.tsx` の `?.min !== undefined` チェック4箇所が不要になる
- 将来のアクション型追加時にコンパイラが漏れを検出できる

**影響範囲**: `types.ts`, `betting.ts`（getValidActions の戻り値構築）, `cpuStrategy.ts`, `ActionBar.tsx`, テストファイル

---

## 判定

### 判定: **REJECT**

| 状態 | finding_id | 概要 |
|------|-----------|------|
| new | ARCH-012-01 | `ValidAction` 型が判別共用体でなく、非null断言7箇所・防御チェック4箇所を強制 |

### REJECT根拠
- `new`: 1件（ARCH-012-01）
- `persists`: 0件
- `ValidAction` はこのタスクで新規導入された型であり、設計時点で判別共用体にすべき。修正はスコープ内で完結する

### 非ブロッキング（参考情報）

| 観点 | 内容 |
|------|------|
| gameEngine.ts ファサード | application層（gameFlow.ts, useGameController.ts）がファサードを経由せずドメイン内部モジュールから直接インポートしている。ファサードはテストでのみ使用。変更外ファイルの既存パターンのため記録のみ |
| テストファイル行数 | cpuStrategy.test.ts（1093行）等、大きなテストファイルがある。テストの重複・保守性の問題は現時点で実害なしのためWarning |

---

## supervise
こちらも既に `TaskOutput` で結果を取得済みです（stash前: 2件失敗 → タスク12後: 1件に改善）。検証結果に変更はありません。

**最終判定: APPROVE** — 全要件充足、ビルド成功、テストは既存問題1件を除き全パス。