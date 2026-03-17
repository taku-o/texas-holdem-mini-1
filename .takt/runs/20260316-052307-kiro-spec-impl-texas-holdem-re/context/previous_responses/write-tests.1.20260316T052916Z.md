## 作業結果
- 計画に基づき、チップ0プレイヤーの次ハンド除外に関するテストを6件作成した
- 全テストは実装前のため期待通り失敗（6 failed）、既存テスト58件は全てパス
- インテグレーションテストは不要と判断（`startNextHand` が既に `dealHoleCards` を内部で呼び出す統合テストとして機能）

## 変更内容

### `src/domain/handProgression.test.ts`（3テスト追加）
| テスト名 | 検証内容 |
|---------|---------|
| `should keep chips-0 player folded in next hand` | チップ0プレイヤーが `folded: true` を維持し、ホールカードが空であること |
| `should not deal hole cards to chips-0 player` | チップ0プレイヤーにカードが配られず、アクティブプレイヤーには配られること |
| `should keep multiple chips-0 players folded in next hand` | 複数のチップ0プレイヤーが同時に `folded: true` を維持すること |

### `src/domain/dealing.test.ts`（3テスト追加）
| テスト名 | 検証内容 |
|---------|---------|
| `should not deal cards to folded players` | foldedプレイヤーにカードが配られないこと |
| `should consume deck cards only for non-folded players` | デッキ消費量がアクティブプレイヤー数に基づくこと |
| `should deal unique cards to non-folded players when some are folded` | folded混在時にも配られるカードがユニークであること |