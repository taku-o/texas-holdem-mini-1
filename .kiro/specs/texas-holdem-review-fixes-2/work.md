/kiro:spec-requirements "次のレビュー指摘事項に対応したい。新たにspecを作成して、そこで要件定義書を作成してください。
  CRITICAL

  1. デバッグファイルがリポジトリに含まれている
  - debug_common.ts, debug_common.test.ts, debug_game.ts, debug_game2.ts, debug_game3.ts
  - マージ前に削除が必要

  ---
  MEDIUM

  2. ActionBar.tsx の数値入力でブラウザ上の直接入力が制約されない
  - <input type="number"> でユーザーが手入力した値はmin/maxを超えられる
  - isChipAmountValid() によるConfirmボタン無効化で送信はブロックされるが、入力自体は許容される
  - UX上の問題であり、ロジックバグではない

  3. useGameController.ts の非同期パターン
  - IIFE async パターン (async () => { ... })() で未追跡のPromiseが発生
  - processingRef フラグで競合は防止されているが、コンポーネントアンマウント時のクリーンアップがない
  - 現状動作するが、AbortController等の導入が理想的
"

違います。既存のspecに追加するのでなく、新しいcc-sddのfeatureにしてください。


.claude/commands/kiro-review-spec.md
を更新したい。
既存のドキュメントのフォーマットなどのチェックに加えて、
専門家観点で、要件定義書、設計書、タスクリストの内容をチェックする機能を追加したい。
これは実現できる？


/kiro-review-spec texas-holdem-review-fixes-2


takt --task "/kiro:spec-impl texas-holdem-review-fixes-2 1"
/kiro-complete-tasks texas-holdem-review-fixes-2 1






