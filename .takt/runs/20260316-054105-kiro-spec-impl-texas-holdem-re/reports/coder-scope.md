# 変更スコープ宣言

## タスク
CPUのレイズ/ベット額をgetValidActionsのmin/max範囲にクランプする

## 変更予定
| 種別 | ファイル |
|------|---------|
| 変更 | `src/domain/cpuStrategy.ts` |

## 推定規模
Small

## 影響範囲
- CPUの行動決定ロジック（decideAction関数）
- bet/raiseアクション生成時の金額計算