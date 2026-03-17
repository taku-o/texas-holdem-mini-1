ビルド・テストともに成功です。

---

## 作業結果
- ARCH-001（DRY違反: プリフロップ準備シーケンスの重複）を修正。`gameSetup.ts:35-40`と`handProgression.ts:91-96`で重複していた5行のプリフロップ準備ロジックを`preparePreflopRound`関数に抽出し、両箇所から呼び出すよう統合した。

## 変更内容
| ファイル | 変更内容 |
|---------|----------|
| `src/domain/handProgression.ts` | `preparePreflopRound(state)` 関数を新規追加（L19-26）。`startNextHand`内の重複コードをこの関数の呼び出しに置換（L100） |
| `src/domain/gameSetup.ts` | import変更（dealing/betting → handProgression）。重複コードを`preparePreflopRound(state)`呼び出しに置換（L34） |
| `src/domain/handProgression.test.ts` | `preparePreflopRound`の再発防止テスト2件追加（ブラインド投入・ホールカード配布・UTG設定の確認、イミュータビリティ確認） |

## ビルド結果
- `npx tsc --noEmit` — エラーなし（正常終了）

## テスト結果
- `npx vitest run src/domain/` — 10ファイル、160テスト全パス

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 1 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `src/domain/gameSetup.ts` L34: `return preparePreflopRound(state)` に統合確認
- `src/domain/handProgression.ts` L100: `return preparePreflopRound(nextState)` に統合確認
- `src/domain/handProgression.ts` L19-26: `preparePreflopRound`関数の実装確認
- grep `postBlinds.*dealHoleCards` — `gameSetup.ts`と`startNextHand`に重複なし確認
- TypeScript型チェック通過、160テスト全パス