全テストがパスしました。

---

## 確認したファイル
- `src/domain/cpuStrategy.validation.test.ts:5` — `ValidAction` がインポートされているがファイル内で未使用であることを確認
- `src/domain/gameEngine.shortstack.integration.test.ts:5` — `resolveUncontestedPot` がインポートされているがファイル内で未使用であることを確認
- `src/domain/gameEngine.shortstack.integration.test.ts:6` — `SMALL_BLIND` がインポートされているがファイル内で未使用であることを確認

## 実行した検索
- `grep ValidAction cpuStrategy.validation.test.ts` → インポート行のみでヒット、使用箇所なし
- `grep resolveUncontestedPot gameEngine.shortstack.integration.test.ts` → インポート行のみでヒット、使用箇所なし
- `grep SMALL_BLIND gameEngine.shortstack.integration.test.ts` → インポート行のみでヒット、使用箇所なし

## 修正内容
- **AIR-012-01**: `cpuStrategy.validation.test.ts:5` — `import type { GameState, ValidAction }` → `import type { GameState }` に変更
- **AIR-012-02**: `gameEngine.shortstack.integration.test.ts:5` — `import { evaluateShowdown, resolveUncontestedPot }` → `import { evaluateShowdown }` に変更
- **AIR-012-03**: `gameEngine.shortstack.integration.test.ts:6` — `import { INITIAL_CHIPS, PLAYER_COUNT, BIG_BLIND, SMALL_BLIND }` → `import { INITIAL_CHIPS, PLAYER_COUNT, BIG_BLIND }` に変更

## テスト結果
- `npx vitest run src/domain/cpuStrategy.validation.test.ts src/domain/gameEngine.shortstack.integration.test.ts` → 2ファイル14テスト全てパス