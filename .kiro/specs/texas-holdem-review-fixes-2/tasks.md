# Implementation Tasks: texas-holdem-review-fixes-2

- 本タスク群は `.kiro/specs/texas-holdem-review-fixes-2/requirements.md` および `design.md` に基づき、第2弾レビュー指摘への対応を行うための実装ステップを定義する。
- 作業は原則シーケンシャルに進める前提とし、(P) マーカーは付与しない。

---

- [x] 1. デバッグ用ファイルの扱い方針の決定と反映
- [x] 1.1 デバッグ用ファイルの最終的な配置/削除ポリシーを決める
  - README または開発ドキュメントに「`debug_*.ts` 系ファイルは本番ブランチに含めない」方針を明文化する。
  - ローカル専用で保持したい場合は `tools/` などビルド対象外ディレクトリに移動する方針とし、そうでなければ削除する方針を採用する。
  - _Requirements: 1_
- [x] 1.2 リポジトリからデバッグ用ファイルを整理する
  - 現在ルート直下に存在する `debug_common.ts`, `debug_common.test.ts`, `debug_game.ts`, `debug_game2.ts`, `debug_game3.ts` を、1.1 で決めた方針に従って削除またはビルド対象外のディレクトリに移動する。
  - Vite や TypeScript の設定（`tsconfig.json` や `vite.config`）にデバッグ用ディレクトリを含めないことを確認する。
  - _Requirements: 1_

---

- [ ] 2. ActionBar の数値入力 UX 改善
- [ ] 2.1 ActionBar の数値入力ロジックを設計どおりに拡張する
  - `src/ui/ActionBar.tsx` の `ChipInput` 内 `onChange` ハンドラ（`onChipAmountChange` に渡している部分）に対して、`findRangeAction(mode)` の `min` / `max` を用いたクリップ処理を追加する。
  - 入力値が `min` 未満の場合は `min` に、`max` を超える場合は `max` に丸めてから `setChipAmount` を呼ぶように実装する。
  - スライダー (`type="range"`) と数値入力 (`type="number"`) の双方から同じクリップロジックを通るようにし、UI 上の表示と内部状態が常に一致するようにする。
  - _Requirements: 2_
- [ ]* 2.2 ActionBar の数値入力に対するテスト追加
  - 単体テストまたはコンポーネントテストで、`min - step` や `max + step` など範囲外の値を入力した際に内部の `chipAmount` がレンジ内にクリップされることを確認する。
  - 既存の `isChipAmountValid()` と Confirm ボタンの有効/無効状態が、クリップ後の値と整合していることを確認する。
  - Playwright などの E2E テストがあれば、ブラウザ上でユーザーが範囲外の値を直接入力した場合でも、最終的に表示値がレンジ内になっていることを確認する。
  - _Requirements: 2_

---

- [ ] 3. useGameController の非同期キャンセルとクリーンアップ
- [ ] 3.1 useGameController に AbortController とマウント状態管理を追加する
  - `src/application/useGameController.ts` に `abortControllerRef` と `isMountedRef` を追加し、`startGame` / `handleAction` 実行時に新しい `AbortController` を生成、前回値があれば `abort()` するように実装する。
  - `useEffect`（依存配列空）を導入し、クリーンアップで `abortControllerRef.current?.abort()` と `isMountedRef.current = false` を設定する。
  - `setGameState` を呼び出す箇所では `isMountedRef.current` を確認し、アンマウント後は状態更新を行わないようにする。
  - _Requirements: 3_
- [ ] 3.2 非同期処理関数への signal 伝播の検討と実装（可能な範囲で）
  - `advanceUntilHumanTurn` / `handlePlayerAction` のシグネチャに `signal?: AbortSignal` を追加できるか検討し、影響範囲が許容できる場合のみ `AbortSignal` を渡してループ内で `signal.aborted` を監視する実装を行う。
  - シグネチャ拡張が困難な場合は、`isMountedRef` によるガードのみで要件を満たす方針とし、理由を設計ドキュメントかコメント（意図説明用）に残す。
  - _Requirements: 3_
- [ ]* 3.3 useGameController のキャンセル動作に対するテスト追加
  - 単体テストまたはフックのテストで、`startGame` 実行後すぐにクリーンアップ相当の処理（アンマウント）を呼び出しても、後続の非同期完了時に `setGameState` が呼ばれないことを確認する。
  - 可能であれば、`AbortController` の `abort()` を手動で呼び出したケースでも同様に安全に処理が終了することを確認する。
  - _Requirements: 3_

