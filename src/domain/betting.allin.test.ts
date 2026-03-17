import { describe, expect, test } from 'vitest'
import { applyAction, getValidActions } from './betting'
import { BIG_BLIND } from './constants'
import type { GameState } from './types'
import { calcTotalChips, createTestPlayer, createTestState as createBaseTestState } from './testHelpers'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return createBaseTestState({
    pot: 15,
    currentBet: BIG_BLIND,
    currentPlayerIndex: 3,
    deck: [],
    ...overrides,
  })
}

describe('betting all-in scenarios', () => {
  describe('bet with amount equal to player chips (all-in bet)', () => {
    test('should process all-in bet when amount equals player chips exactly', () => {
      // Given: currentBet=0、プレイヤーがちょうど手持ちチップ全額をbet
      const chipAmount = 50
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 0 ? chipAmount : 1000,
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 0,
        pot: 0,
        currentPlayerIndex: 0,
      })

      // When: プレイヤーが全チップをbet
      const result = applyAction(state, 0, { type: 'bet', amount: chipAmount })

      // Then: チップが0になり、ポットに全額が入る
      expect(result.players[0].chips).toBe(0)
      expect(result.players[0].currentBetInRound).toBe(chipAmount)
      expect(result.pot).toBe(chipAmount)
      expect(result.currentBet).toBe(chipAmount)
      expect(result.lastAggressorIndex).toBe(0)
    })

    test('should preserve chip conservation on all-in bet', () => {
      // Given: プレイヤーが全チップをbet
      const chipAmount = 100
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 0 ? chipAmount : 1000,
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 0,
        pot: 0,
        currentPlayerIndex: 0,
      })
      const totalBefore = calcTotalChips(state)

      // When: 全チップbet
      const result = applyAction(state, 0, { type: 'bet', amount: chipAmount })

      // Then: チップ保存則が成立
      expect(calcTotalChips(result)).toBe(totalBefore)
    })
  })

  describe('raise with amount consuming all player chips (all-in raise)', () => {
    test('should process all-in raise when raise total equals player chips plus currentBetInRound', () => {
      // Given: currentBet=10、プレイヤーが全チップでraise
      const chipAmount = 50
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? chipAmount : 1000,
          currentBetInRound: i === 3 ? 0 : BIG_BLIND,
        }),
      )
      const state = createTestState({
        players,
        currentBet: BIG_BLIND,
        pot: BIG_BLIND * 4,
        currentPlayerIndex: 3,
      })
      const raiseTotal = chipAmount // currentBetInRound(0) + chips(50) = 50

      // When: 全チップでraise
      const result = applyAction(state, 3, { type: 'raise', amount: raiseTotal })

      // Then: チップが0になり、currentBetが更新される
      expect(result.players[3].chips).toBe(0)
      expect(result.players[3].currentBetInRound).toBe(raiseTotal)
      expect(result.currentBet).toBe(raiseTotal)
      expect(result.lastAggressorIndex).toBe(3)
    })

    test('should preserve chip conservation on all-in raise', () => {
      // Given: プレイヤーが全チップでraise
      const chipAmount = 80
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? chipAmount : 1000,
          currentBetInRound: i === 3 ? 0 : BIG_BLIND,
        }),
      )
      const state = createTestState({
        players,
        currentBet: BIG_BLIND,
        pot: BIG_BLIND * 4,
        currentPlayerIndex: 3,
      })
      const totalBefore = calcTotalChips(state)
      const raiseTotal = chipAmount

      // When: 全チップraise
      const result = applyAction(state, 3, { type: 'raise', amount: raiseTotal })

      // Then: チップ保存則
      expect(calcTotalChips(result)).toBe(totalBefore)
    })
  })

  describe('all-in call boundary', () => {
    test('should go all-in when player chips equal call amount exactly', () => {
      // Given: コール額とチップがちょうど同額
      const callAmount = BIG_BLIND
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? callAmount : 1000,
          currentBetInRound: i === 3 ? 0 : BIG_BLIND,
        }),
      )
      const state = createTestState({
        players,
        currentBet: BIG_BLIND,
        pot: BIG_BLIND * 4,
        currentPlayerIndex: 3,
      })

      // When: コール
      const result = applyAction(state, 3, { type: 'call' })

      // Then: ちょうどチップが0になる
      expect(result.players[3].chips).toBe(0)
      expect(result.players[3].currentBetInRound).toBe(BIG_BLIND)
    })

    test('should go all-in for less than call amount when chips are insufficient', () => {
      // Given: コール額よりチップが少ない
      const playerChips = 3
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? playerChips : 1000,
          currentBetInRound: i === 3 ? 0 : BIG_BLIND,
        }),
      )
      const state = createTestState({
        players,
        currentBet: BIG_BLIND,
        pot: BIG_BLIND * 4,
        currentPlayerIndex: 3,
      })

      // When: コール（チップ不足）
      const result = applyAction(state, 3, { type: 'call' })

      // Then: 持っている全チップをベット
      expect(result.players[3].chips).toBe(0)
      expect(result.players[3].currentBetInRound).toBe(playerChips)
    })
  })

  describe('getValidActions with all-in edge cases', () => {
    test('should not include raise when chips are insufficient for minimum raise', () => {
      // Given: チップがmin raiseに足りない
      const minRaiseCost = BIG_BLIND // currentBet(10) + BIG_BLIND(10) - currentBetInRound(0) = 20
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? minRaiseCost - 1 : 1000,
          currentBetInRound: i === 3 ? 0 : BIG_BLIND,
        }),
      )
      const state = createTestState({
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 3,
      })

      // When: 有効アクションを取得
      const actions = getValidActions(state, 3)
      const actionTypes = actions.map((a) => a.type)

      // Then: raiseが含まれない（チップ不足）
      expect(actionTypes).not.toContain('raise')
      // callは含まれる
      expect(actionTypes).toContain('call')
    })

    test('should include raise when chips exactly meet minimum raise cost', () => {
      // Given: チップがmin raiseちょうど
      const minRaiseCost = BIG_BLIND * 2 // (currentBet + BIG_BLIND) - currentBetInRound = 20
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? minRaiseCost : 1000,
          currentBetInRound: i === 3 ? 0 : BIG_BLIND,
        }),
      )
      const state = createTestState({
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 3,
      })

      // When: 有効アクションを取得
      const actions = getValidActions(state, 3)
      const actionTypes = actions.map((a) => a.type)

      // Then: raiseが含まれる
      expect(actionTypes).toContain('raise')
    })
  })
})
