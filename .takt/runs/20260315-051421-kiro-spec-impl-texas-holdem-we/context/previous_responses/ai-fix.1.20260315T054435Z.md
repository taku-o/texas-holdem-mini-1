---

## 確認したファイル
- `src/domain/betting.ts:59,69` — `action.amount!` 非nullアサーションの存在を確認
- `src/domain/betting.ts:10-14` — `currentBet > 0` 時にraise選択肢がないことを確認
- `src/domain/betting.ts:92-106` — `lastAggressorIndex === null` 時にBBがスキップされる問題を確認
- `src/domain/dealing.ts:18-24` — `postBlinds`が`lastAggressorIndex`を設定していないことを確認
- `src/domain/gameEngine.ts:6` — `getNextActivePlayerIndex`がパブリックAPIからエクスポートされていることを確認
- `src/domain/gameSetup.test.ts:139-148` — テストがnull期待であることを確認

## 実行した検索
- `grep getNextActivePlayerIndex src/` — gameEngine経由のimport箇所を確認（外部利用なし）
- `grep lastAggressorIndex dealing.test.ts, handProgression.test.ts` — 関連テストへの影響を確認

## 修正内容
| # | finding_id | 修正内容 |
|---|------------|----------|
| 1 | AI-AR-001 | `src/domain/betting.ts` L60-63, L73-76: `action.amount!` → `action.amount === undefined` チェック + throw に変更。Fail Fastパターンに準拠 |
| 2 | AI-AR-002 | `src/domain/betting.ts` L14-16: `currentBet > 0` かつプレイヤーがマッチ済みの場合に `raise` を選択肢に追加。BBプリフロップでレイズ可能に |
| 3 | AI-AR-003 | `src/domain/dealing.ts` L18-24: `postBlinds`の戻り値に`lastAggressorIndex: bbIndex`を設定。BBに到達するまでラウンドが終了しないようにした |
| 4 | AI-AR-004 | `src/domain/gameEngine.ts` L6: `getNextActivePlayerIndex`のre-exportを削除。内部ヘルパーのパブリックAPI漏洩を解消 |
| - | テスト修正 | `src/domain/gameSetup.test.ts` L139-148: `lastAggressorIndex`がnullではなくBBインデックスになることを反映 |

## テスト結果
- 実行コマンド: `npx vitest run src/domain/`
- 結果: **10ファイル、158テスト全パス**