全テストパス、型チェックもエラーなし。

この`family_tag`（refactoring-artifact）は構造的な問題ではなく単純な修正漏れなので、再発防止テストの追加は不要です（`let`/`const`の区別はリンターやTypeScriptコンパイラの領域であり、ランタイムテストで検出するものではありません）。

## 作業結果
- ARCH-002（refactoring-artifact: `let`→`const`変更漏れ）を修正。`preparePreflopRound`抽出後に再代入が不要になった2箇所の`let`を`const`に変更。

## 変更内容
| ファイル | 変更 |
|---------|------|
| `src/domain/gameSetup.ts:21` | `let state: GameState` → `const state: GameState` |
| `src/domain/handProgression.ts:87` | `let nextState: GameState` → `const nextState: GameState` |

## ビルド結果
- `npx tsc --noEmit` — エラーなし

## テスト結果
- `npx vitest run src/domain/` — 10ファイル、160テスト全パス

## 収束ゲート
| 指標 | 件数 |
|------|------|
| new（今回修正） | 1 |
| reopened（再発修正） | 0 |
| persists（前回から継続、今回未着手） | 0 |

## 証拠
- `src/domain/gameSetup.ts:21` — `const state` に変更確認済み
- `src/domain/handProgression.ts:87` — `const nextState` に変更確認済み
- 同`family_tag`の潜在箇所: `handProgression.ts:20`（`let nextState`）は再代入あり（L21）のため`let`が正当
- `advancePhase`内の`let nextState`（L39）も再代入あり（L49, L57）のため`let`が正当