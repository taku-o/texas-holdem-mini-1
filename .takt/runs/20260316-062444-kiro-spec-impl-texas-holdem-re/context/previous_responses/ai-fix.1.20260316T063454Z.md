全437テストがパスしました。

---

## 確認したファイル
- `src/domain/gameSetup.ts:6-9` — JSDocコメントの存在を確認

## 実行した検索
- ファイル直接確認のみで十分と判断（指摘箇所が明確なため）

## 修正内容
- **AIR-T7-001**: `src/domain/gameSetup.ts` L6-9 の `@param randomFn` JSDocコメントを削除。型シグネチャ `randomFn: () => number` が契約を既に明示しており、コメントは What/How の説明コメントに該当。さらにコードベース内で唯一の `@param` JSDoc でありパターン不整合であった。

## テスト結果
- `npx vitest run` — 全24ファイル、437テストがパス