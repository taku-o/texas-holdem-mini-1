import { describe, expect, test } from 'vitest'
import { setupNewGame } from './gameSetup'
import { applyAction, getValidActions, isBettingRoundComplete } from './betting'
import { advancePhase, startNextHand, isGameOver } from './handProgression'
import { evaluateShowdown, resolveUncontestedPot } from './showdown'
import { INITIAL_CHIPS, PLAYER_COUNT, BIG_BLIND } from './constants'
import type { GameState } from './types'

describe('gameEngine integration', () => {
  describe('完全なハンドフロー', () => {
    test('should complete a full hand from setup through showdown', () => {
      // Given: 新しいゲーム
      const state = setupNewGame(() => 0.5)

      // When: プリフロップで全員コール→フロップ→全員チェック→...→ショーダウン
      let current: GameState = state

      // プリフロップ: 全員コール（BB以降のプレイヤー）
      while (!isBettingRoundComplete(current)) {
        const playerIdx = current.currentPlayerIndex
        const actions = getValidActions(current, playerIdx)
        const callAction = actions.find((a) => a.type === 'call')
        const checkAction = actions.find((a) => a.type === 'check')
        const action = callAction ?? checkAction
        if (!action) break
        current = applyAction(current, playerIdx, action)
      }

      // フロップ
      current = advancePhase(current)
      expect(current.phase).toBe('flop')
      expect(current.communityCards).toHaveLength(3)

      // フロップ: 全員チェック
      while (!isBettingRoundComplete(current)) {
        const playerIdx = current.currentPlayerIndex
        current = applyAction(current, playerIdx, { type: 'check' })
      }

      // ターン
      current = advancePhase(current)
      expect(current.phase).toBe('turn')
      expect(current.communityCards).toHaveLength(4)

      // ターン: 全員チェック
      while (!isBettingRoundComplete(current)) {
        const playerIdx = current.currentPlayerIndex
        current = applyAction(current, playerIdx, { type: 'check' })
      }

      // リバー
      current = advancePhase(current)
      expect(current.phase).toBe('river')
      expect(current.communityCards).toHaveLength(5)

      // リバー: 全員チェック
      while (!isBettingRoundComplete(current)) {
        const playerIdx = current.currentPlayerIndex
        current = applyAction(current, playerIdx, { type: 'check' })
      }

      // ショーダウン
      current = advancePhase(current)
      expect(current.phase).toBe('showdown')
      current = evaluateShowdown(current)

      // Then: チップの合計が初期値と一致する（ゼロサム）
      const totalChips =
        current.players.reduce((sum, p) => sum + p.chips, 0) + current.pot
      expect(totalChips).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })

    test('should handle all-fold scenario with uncontested pot', () => {
      // Given: 新しいゲーム
      const state = setupNewGame(() => 0.5)
      let current: GameState = state

      // When: BB以外が全員フォールド
      let foldCount = 0
      while (!isBettingRoundComplete(current) && foldCount < PLAYER_COUNT - 1) {
        const playerIdx = current.currentPlayerIndex
        const actions = getValidActions(current, playerIdx)
        const hasFold = actions.some((a) => a.type === 'fold')
        if (hasFold) {
          current = applyAction(current, playerIdx, { type: 'fold' })
          foldCount++
        } else {
          break
        }
      }

      // 1人残り → 無争のポット解決
      const nonFolded = current.players.filter((p) => !p.folded)
      if (nonFolded.length === 1) {
        current = resolveUncontestedPot(current)
      }

      // Then: チップの合計が初期値と一致する
      const totalChips =
        current.players.reduce((sum, p) => sum + p.chips, 0) + current.pot
      expect(totalChips).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })

    test('should handle multiple hands with dealer rotation', () => {
      // Given: 新しいゲーム
      let current: GameState = setupNewGame(() => 0.5)
      const initialDealerIndex = current.dealerIndex

      // When: 1ハンド目を簡易的に完了（全員チェック/コール）
      while (!isBettingRoundComplete(current)) {
        const playerIdx = current.currentPlayerIndex
        const actions = getValidActions(current, playerIdx)
        const callAction = actions.find((a) => a.type === 'call')
        const checkAction = actions.find((a) => a.type === 'check')
        const action = callAction ?? checkAction
        if (!action) break
        current = applyAction(current, playerIdx, action)
      }

      // フロップ→ショーダウンまで進める
      current = advancePhase(current) // flop
      while (!isBettingRoundComplete(current)) {
        const playerIdx = current.currentPlayerIndex
        current = applyAction(current, playerIdx, { type: 'check' })
      }
      current = advancePhase(current) // turn
      while (!isBettingRoundComplete(current)) {
        const playerIdx = current.currentPlayerIndex
        current = applyAction(current, playerIdx, { type: 'check' })
      }
      current = advancePhase(current) // river
      while (!isBettingRoundComplete(current)) {
        const playerIdx = current.currentPlayerIndex
        current = applyAction(current, playerIdx, { type: 'check' })
      }
      current = advancePhase(current) // showdown
      current = evaluateShowdown(current)

      // ゲームが終了していなければ次のハンドを開始
      const gameOverResult = isGameOver(current)
      if (!gameOverResult.over) {
        current = startNextHand(current, () => 0.5)

        // Then: ディーラーが移動している
        expect(current.dealerIndex).not.toBe(initialDealerIndex)
        expect(current.phase).toBe('preflop')
        expect(current.communityCards).toHaveLength(0)
        expect(current.currentBet).toBe(BIG_BLIND)
      }
    })
  })

  describe('チップ保存則', () => {
    test('should preserve total chips through any action sequence', () => {
      // Given: 新しいゲーム
      const state = setupNewGame(() => 0.5)
      const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT

      // When: 初期状態でチップ合計を確認
      const initialTotal =
        state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot

      // Then: ゲーム内の全チップがINITIAL_CHIPS × PLAYER_COUNTと一致する
      expect(initialTotal).toBe(expectedTotal)
    })
  })
})
