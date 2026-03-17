# 変更スコープ宣言

## タスク
ゲームコントローラー（gameFlow）の実装 - 人間アクション処理とCPU自動ターン進行

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/domain/types.ts` |
| 作成 | `src/application/gameFlow.ts` |
| 変更 | `src/application/gameFlow.test.ts` |

## 推定規模
Medium

## 影響範囲
- GameState型にgameOverReasonフィールドを追加（domain層の型定義）
- application層の新規モジュール gameFlow（domain層のbetting, handProgression, showdown, cpuStrategyに依存）
- テストファイルの修正（デッキ設定の修正、handlePlayerActionがハンド全体を処理する設計に伴うアサーション調整、humanIndex前提の修正、maxIterations増加）