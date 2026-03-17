## 確認したファイル
- `src/domain/showdown.ts:40-44` — `evaluateShowdown` 内の `if (newChips < 0) throw` ブロック（到達不能な防御コード）
- `src/domain/showdown.ts:58-62` — `resolveUncontestedPot` 内の `if (newChips < 0) throw` ブロック（到達不能な防御コード）

## 実行した検索
- `Read` で `src/domain/showdown.ts` を読み、L40-44 と L58-62 に到達不能な `if (newChips < 0)` ガードが存在することを確認

## 修正内容
- **AI-001-showdown-dead-guard**: `evaluateShowdown`（旧L40-44）と `resolveUncontestedPot`（旧L58-62）の `if (newChips < 0) { throw ... }` ブロック（4行×2箇所）を削除。`const newChips` 変数と `return { ...p, chips: newChips }` はそのまま維持。
  - 理由: `p.chips`、`share`、`extra`、`state.pot` はすべて非負であり、加算結果が負になることは論理的にあり得ない。「念のため」コードであり到達不能。

## テスト結果
- `npm test` — 24ファイル、423テスト全件パス