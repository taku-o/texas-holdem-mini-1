調査完了。計画をまとめます。

---

## 計画レポート

### タスク概要

`createTestState()` が常に `createDeck()` を呼び出して52枚のカードを生成するが、`betting.test.ts` や `showdown.test.ts` のローカルラッパーで `deck: []` に即座に上書きされるため、デッキ生成が無駄になっている。

### 現状分析

**対象ファイル:** `src/domain/testHelpers.ts`（33行目）

```typescript
deck: createDeck(),  // 常に52枚生成される
...overrides,        // overridesにdeckがあれば上書きされる
```

**影響を受けるテストファイル:**
- `betting.test.ts`: ローカル`createTestState`ラッパーが常に`deck: []`を設定（約25テストケース）
- `showdown.test.ts`: ローカル`createTestState`ラッパーが常に`deck: []`を設定（約5テストケース）
- `types.test.ts`: 直接`deck: []`を渡す箇所が6つ
- `testHelpers.test.ts`: `deck: []`を渡す箇所が1つ

**デッキが実際に必要なテストファイル:**
- `handProgression.test.ts`: ローカルラッパーはdeckを上書きしない → `createDeck()`が必要
- `dealing.test.ts`: ローカルラッパーはdeckを上書きしない → `createDeck()`が必要

### 実装アプローチ

**変更ファイル:** `src/domain/testHelpers.ts` のみ（1ファイル変更）

**方針:** `overrides`に`deck`が含まれているかを`'deck' in overrides`で事前チェックし、含まれている場合は`createDeck()`の呼び出しをスキップする。

**変更内容（33行目）:**

```typescript
// Before:
deck: createDeck(),

// After:
deck: 'deck' in overrides ? overrides.deck! : createDeck(),
```

**この方針の利点:**
- 変更が1行のみで最小限
- `createDeck()`のimportと既存のデフォルト動作（52枚デッキ生成）は維持される
- `deck`を上書きしないテスト（`handProgression.test.ts`, `dealing.test.ts`）は影響を受けない
- 既存の`testHelpers.test.ts`のテスト（52枚デッキの検証）はそのまま通る
- `...overrides`のスプレッドで再度上書きされるが、同じ値なので無害

**テストへの影響:**
- 全既存テストが変更なしで通る（振る舞いは同一）
- `testHelpers.test.ts`の158-173行目のテスト（デフォルト52枚デッキ検証）は引き続き正常動作（`overrides`にdeckがないケース）

### Coder向け実装ガイドライン

1. **変更箇所:** `src/domain/testHelpers.ts` 33行目のみ
   - `deck: createDeck(),` → `deck: 'deck' in overrides ? overrides.deck! : createDeck(),`
2. **参照パターン:** 同ファイル内の他のデフォルト値は単純な定数なので、条件付き評価はdeckのみで十分
3. **注意点:** `createDeck`のimportは削除しないこと（`overrides`にdeckが含まれない場合は引き続き使用される）
4. **テスト:** 全既存テストがそのまま通ることを確認すること（振る舞い変更なし、パフォーマンス改善のみ）