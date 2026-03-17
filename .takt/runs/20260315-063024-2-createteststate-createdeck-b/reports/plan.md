# タスク計画

## 元の要求
レビューで指摘事項がありました。こちらを修正してください。
createTestState() での不要な createDeck() 呼び出し: betting.test.ts や showdown.test.ts では deck: [] で即座に上書きされるため、52枚のカード生成が無駄になっています（約31テストケース分）。

## 分析結果

### 目的
`createTestState()` が `overrides` で `deck` を上書きされる場合に、不要な `createDeck()`（52枚のカード生成）の呼び出しをスキップし、テストのパフォーマンスを改善する。

### スコープ
- **変更ファイル:** `src/domain/testHelpers.ts`（1ファイル、1行のみ）
- **影響を受けるテスト:**
  - `betting.test.ts`: ローカルラッパーが常に `deck: []` を設定（約25テストケース）
  - `showdown.test.ts`: ローカルラッパーが常に `deck: []` を設定（約5テストケース）
  - `types.test.ts`: 直接 `deck: []` を渡す箇所が6つ
  - `testHelpers.test.ts`: `deck: []` を渡す箇所が1つ
- **影響を受けないテスト（デッキが必要）:**
  - `handProgression.test.ts`: ローカルラッパーは deck を上書きしない → `createDeck()` が引き続き呼ばれる
  - `dealing.test.ts`: ローカルラッパーは deck を上書きしない → `createDeck()` が引き続き呼ばれる

### 実装アプローチ

`src/domain/testHelpers.ts` 33行目を以下のように変更する:

```typescript
// Before (33行目):
deck: createDeck(),

// After:
deck: 'deck' in overrides ? overrides.deck! : createDeck(),
```

`overrides` オブジェクトに `deck` キーが含まれているかを `in` 演算子で事前チェックし、含まれている場合は `createDeck()` の呼び出しをスキップする。`...overrides` のスプレッドは残すため、最終的に overrides の値で上書きされる（同じ値なので無害）。

**この方針の根拠:**
- 変更が1行のみで最小限
- `createDeck` の import と既存のデフォルト動作（52枚デッキ生成）は維持される
- 全既存テストが変更なしで通る（振る舞いは同一、パフォーマンス改善のみ）

## 実装ガイドライン

- **変更箇所:** `src/domain/testHelpers.ts` 33行目のみ
- **参照パターン:** 同ファイル内の他のデフォルト値は単純な定数のため、条件付き評価は `deck` のみで十分
- **`createDeck` の import を削除しないこと:** `overrides` に `deck` が含まれない場合は引き続き使用される
- **テスト確認:** 全既存テストがそのまま通ることを確認すること（`testHelpers.test.ts` の158-173行目で52枚デッキのデフォルト動作を検証済み）