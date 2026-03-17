全テスト通過。

---

## 確認したファイル
- `src/application/useGameController.test.ts:501` — 未使用変数 `stateBefore` の存在を確認

## 実行した検索
- `grep stateBefore` → L141（参照あり）、L501（参照なし）の2箇所を確認

## 修正内容
- **AIR-001**: `src/application/useGameController.test.ts:501` の `const stateBefore = result.current.gameState!` を削除。L141の同名変数はL149で参照されているため影響なし。

## テスト結果
- `npx vitest run src/application/useGameController.test.ts` → 26テスト全パス