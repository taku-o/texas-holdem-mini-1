npx cc-sdd@latest --lang ja

/kiro:steering


/kiro:spec-requirements "次のレビュー指摘事項に対応したい。
  HIGH

  1. betting.ts — ベット/レイズ額のバリデーション不足
    - applyActionでaction.amountをそのまま使用しており、player.chipsを超える額や不正な額を渡すとチップが負になる。レイズも同様。
  2. betting.ts — isBettingRoundCompleteの無限ループリスク
    - lastAggressorIndexのプレイヤーがオールイン（chips=0）の場合、getNextActivePlayerIndexがそのプレイヤーをスキップするため、currentPlayer
  Index === lastAggressorIndexが永遠にtrueにならず、ベッティングラウンドが終了しない可能性がある。

  MEDIUM

  3. betting.ts — レイズ可否の判定が不十分 — 最低レイズ額を支払えるかのチェックがない
  4. dealing.ts — BB不足時のcurrentBet設定 — ショートスタックのBBでもcurrentBet=BIG_BLINDに設定
  5. showdown.ts — サイドポット未対応 — オールイン時に不正なポット配分が発生しうる（設計上の既知の簡略化）
  6. handProgression.ts — チップ0のプレイヤーが次ハンドに参加 — 除外やシットアウトの処理がない

  LOW

  7. dealing.ts — SB/BBが脱落プレイヤーでもブラインドポストされる
  8. cpuStrategy.ts — ショートスタック時にレイズ額がcurrentBet未満になりうる
  9. handEvaluator.ts — ロイヤルフラッシュ判定がライブラリの内部定数に依存
  10. betting.ts — getValidActionsが返すbet/raiseにamountがなく不完全
  11. gameSetup.ts — 乱数関数の結合（軽微）

  UI / アプリケーション層

  MEDIUM

  12. gameFlow.ts — CPU処理が同期的でメインスレッドをブロック —
  MAX_CPU_ITERATIONS=500のループがsetState内で同期実行。現状のプレイヤー数では問題ないが、アーキテクチャ上の懸念

  LOW

  13. TableView.tsx / PlayerSeat.tsx — key={index}の使用（カードIDベースのキーが望ましい）
  14. ActionBar.tsx — チップ額入力のクライアント側バリデーションなし
  15. アクセシビリティ — スライダー/入力にlabelやaria属性がない、カード裏面にalt textなし
  16. useGameController.ts — startGameがfunctional setStateを使っていない（軽微）
"

/kiro:spec-design texas-holdem-review-fixes
/kiro:spec-tasks texas-holdem-review-fixes


npx cc-sdd@latest --lang ja

takt --task "/kiro:spec-impl texas-holdem-review-fixes 1"

/simplify

/kiro-complete-tasks texas-holdem-review-fixes 1

takt --task "/kiro:spec-impl texas-holdem-review-fixes 2"

/kiro-complete-tasks texas-holdem-review-fixes 2



