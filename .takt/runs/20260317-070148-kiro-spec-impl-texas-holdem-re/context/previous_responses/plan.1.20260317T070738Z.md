調査が完了しました。タスク12の計画をまとめます。

---

## 計画レポート

### タスク概要

タスク12「結合・動作確認とテスト」は3つのサブタスクで構成される:

- **12.1**: 結合動作確認テスト（Req 1,2,3,4,5,6）
- **12.2**: ドメイン層の単体テスト追加/更新（Req 1,2,3,4,5,6,7）
- **12.3***: UIテスト追加（Req 12,13）

### 現状分析: 既存テストのカバレッジ

全475テストがパス。要件ごとにカバレッジを確認した結果:

| 要件 | 既存テスト | カバレッジ状況 |
|------|-----------|-------------|
| Req 1 (ベッティングバリデーション) | `betting-validation.test.ts` 555行 + `betting.test.ts` 459行 | **十分**: amount検証、min/max範囲、レイズ不可判定のテストが網羅的 |
| Req 2 (ラウンド終了判定) | `betting-validation.test.ts` 391-505行 | **十分**: all-in aggressorの5ケースをカバー |
| Req 3 (ブラインド・ショートスタック) | `dealing.test.ts` 487行 | **十分**: ショートスタックBB、脱落プレイヤースキップのテスト |
| Req 4 (ショーダウン配分) | `showdown.test.ts` 493行 | **十分**: 配分後chips>=0の保証、オールイン配分テスト |
| Req 5 (チップ0除外) | `handProgression.test.ts` 616行 | **十分**: chips=0プレイヤーのスキップ、ディーラー移動テスト |
| Req 6 (CPUレイズ額) | `cpuStrategy.test.ts` 1094行 | **十分**: レイズ額下限保証、ショートスタックテスト |
| Req 7 (ロイヤルフラッシュ) | `handEvaluator.test.ts` 200行+ | **十分**: ロイヤルフラッシュ判定の独立テスト |
| Req 12 (クライアント側バリデーション) | `ActionBar.test.tsx` 433-548行 | **十分**: min/max範囲外の無効化テスト |
| Req 13 (アクセシビリティ) | `ActionBar.test.tsx` 550-649行 + `CardView.test.tsx` 105-150行 | **十分**: aria-label、role="img"テスト |
| Req 14 (setState関数形式) | `useGameController.setStateFn.test.ts` 257行 | **十分**: 関数形式の検証テスト |
| 結合テスト | `gameEngine.integration.test.ts` 330行 + `gameFlow.async.test.ts` 356行 | **部分的**: 基本フロー・チップ保存はあるが、ショートスタック・オールイン・チップ0除外の結合シナリオが不足 |

### 変更要/不要の判定

#### 12.1: 結合・動作確認テスト — **変更要**

**根拠**: 既存の `gameEngine.integration.test.ts` にはショートスタック・オールイン・チップ0除外を組み合わせたエンドツーエンドの結合テストがない。

- `gameEngine.integration.test.ts`（330行）: 基本ハンドフロー、全員フォールド、bet/raise含む2ハンド、チップ保存則のテストはあるが、**ショートスタックのBBポスト→オールイン→チップ0除外→次ハンド進行**の一連のシナリオがない。
- `gameFlow.async.test.ts`（356行）: 非同期CPU処理の結合テストはあるが、ドメインロジックの結合確認ではない。

**追加すべきテストシナリオ:**
1. **ショートスタック + オールイン + チップ0除外シナリオ**: プレイヤーがショートスタック（BB未満）でBBポスト → オールイン → ショーダウン → チップ0になったプレイヤーが次ハンドから除外される → ディーラーとブラインドが正しく回る
2. **複数プレイヤーのオールイン結合テスト**: 2名以上がオールイン → ショーダウンでポット配分 → チップ保存則 → チップ0プレイヤーの除外確認
3. **人間プレイヤーアクション結合テスト**: 人間がbet/raise → CPU応答 → フェーズ進行 → ショーダウンまで

#### 12.2: 単体テストの追加/更新 — **変更要（最小限）**

**根拠**: 各モジュールの単体テストはタスク1〜11で個別に追加済みだが、以下の観点で補強が必要。

1. **betting.ts**: amount検証とラウンド終了の境界条件テストは `betting-validation.test.ts` でカバー済み。ただし `applyAction` でオールイン（amount = player.chips）の正常系テストを明示的に追加すべき。
   - 現行: `betting.test.ts:250-280` にオールイン関連テストはあるが、amount = player.chips ちょうどのbet/raiseケースを明示的にテスト。
2. **handProgression.ts**: チップ0除外後の `preparePreflopRound` → `postBlinds` の連携テスト（dealing と handProgression を跨ぐ）。
   - 現行: `handProgression.test.ts` でchips=0スキップのテストあり（startNextHand内）。dealing.test.tsでもショートスタックBBテストあり。ただし**両方を連携させたテスト**がない。
3. **cpuStrategy.ts**: getValidActions が返すmin/maxの範囲内でCPUが選択することの検証。
   - 現行: `cpuStrategy.test.ts` に多数のテストあり。ただしgetValidActionsのmin/maxとの整合性を明示的に検証するテストを追加。

#### 12.3*: UIテスト — **変更不要**

**根拠**:
- `ActionBar.test.tsx:433-548`: チップ額バリデーション（min/max範囲外の無効化、confirm無効化）テスト7件
- `ActionBar.test.tsx:550-649`: aria-labelテスト5件（スライダー・数値入力・bet/raise区別）
- `CardView.test.tsx:105-150`: カード裏面のrole="img"とaria-labelテスト4件
- これらは要件12, 13のUIテスト要件を十分満たしている

### 設計判断

- **テストファイル配置**: 結合テストは既存の `gameEngine.integration.test.ts` に追加。新たな結合シナリオのdescribeブロックを追加する。
- **単体テスト補強**: 各モジュールの既存テストファイルに追加。
- **テストヘルパー**: 既存の `testHelpers.ts` の `createTestPlayer`, `createTestState`, `executeAllCallCheck` を活用。

### 実装アプローチ

**ファイル変更一覧:**

| ファイル | 変更内容 | 変更理由 |
|---------|---------|---------|
| `src/domain/gameEngine.integration.test.ts` | ショートスタック・オールイン・チップ0除外の結合テストシナリオ追加 | 12.1 |
| `src/domain/betting.test.ts` or `betting-validation.test.ts` | オールイン（amount=player.chips）の正常系テスト追加 | 12.2 |
| `src/domain/handProgression.test.ts` | dealing連携テスト追加（チップ0除外後のpreflopRound） | 12.2 |
| `src/domain/cpuStrategy.test.ts` | getValidActionsのmin/max範囲内の選択検証テスト追加 | 12.2 |

### Coder向け実装ガイドライン

#### 参照すべき既存実装パターン

1. **結合テストのパターン**: `src/domain/gameEngine.integration.test.ts:28-128` — setupNewGame → executeAllCallCheck → advancePhase → evaluateShowdown のフローと、calcTotalChipsでのチップ保存則検証
2. **テスト状態構築**: `src/domain/testHelpers.ts:55-71` — createTestState の使い方。chips, folded, currentBetInRound を個別指定
3. **ショートスタックテスト**: `src/domain/dealing.test.ts` — postBlinds のショートスタック系テスト（既存パターンを結合テストでも利用）
4. **チップ0除外テスト**: `src/domain/handProgression.test.ts` — startNextHand でchips=0プレイヤーがスキップされるテスト
5. **CPUテストパターン**: `src/domain/cpuStrategy.test.ts` — decideAction の呼び出しとamount検証

#### 影響範囲

テスト追加のみ。プロダクションコードの変更なし。

#### 注意すべきアンチパターン

1. **テストの過度な結合**: 結合テストでも各アサーションは明確に1つの要件を検証する。1テストに複数の独立した要件を詰め込まない。
2. **マジックナンバー**: チップ額はconstants.tsの定数（INITIAL_CHIPS, BIG_BLIND, SMALL_BLIND）を使用する。ハードコードしない。
3. **テストの脆さ**: 乱数に依存するテストは `() => 0.5` のような固定randomFnを使用する（既存パターンに従う）。
4. **不必要な重複**: 既に十分なカバレッジがあるテストケースを重複して書かない。12.3*（UIテスト）は既存テストで十分と判定したため追加しない。

#### テストシナリオの詳細

**12.1 結合テスト — ショートスタック + オールイン + チップ0除外**:
```
1. setupNewGame で開始
2. 特定のプレイヤーをショートスタックにした状態を作成（createTestStateで構築）
3. ショートスタックBBがpostBlindsで実際のチップ額をcurrentBetに設定されることを確認
4. プレイヤーがオールイン → ショーダウン → evaluateShowdown
5. チップ0のプレイヤーが発生
6. startNextHand → チップ0プレイヤーがスキップされる
7. 次ハンドのディーラー・ブラインドが正しく計算される
8. 全工程でcalcTotalChipsが一定
```

**12.2 単体テスト補強 — オールイン正常系**:
- `applyAction(state, idx, { type: 'bet', amount: player.chips })` が正常にオールイン処理される
- `applyAction(state, idx, { type: 'raise', amount: currentBetInRound + player.chips })` が正常にオールイン処理される

**12.2 単体テスト補強 — CPUとgetValidActions整合性**:
- `decideAction` が返すamountが、`getValidActions` が返すbet/raiseのmin/max範囲内であること