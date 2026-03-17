import { describe, expect, test } from 'vitest'
import { decideAction } from './cpuStrategy'
import { applyAction, getValidActions } from './betting'
import { BIG_BLIND } from './constants'
import type { GameState } from './types'
import { card, createTestPlayer, createTestState as createBaseTestState } from './testHelpers'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return createBaseTestState({
    pot: 15,
    currentBet: BIG_BLIND,
    currentPlayerIndex: 1,
    deck: [],
    ...overrides,
  })
}

const alwaysLow = () => 0.1
const alwaysMid = () => 0.5
const alwaysHigh = () => 0.9

describe('cpuStrategy getValidActions consistency', () => {
  describe('bet amount within getValidActions min/max range', () => {
    test('should return bet amount within valid range for strong hand', () => {
      // Given: strong handでbet可能な状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('A', 'diamonds'),
          card('5', 'clubs'),
          card('9', 'hearts'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)
      const validActions = getValidActions(state, 1)

      // Then: betアクションの場合、amountがmin/max範囲内
      if (action.type === 'bet') {
        const betSpec = validActions.find((a) => a.type === 'bet')!
        expect(action.amount).toBeGreaterThanOrEqual(betSpec.min!)
        expect(action.amount).toBeLessThanOrEqual(betSpec.max!)
      }
    })

    test('should return bet amount within valid range for weak hand bluff', () => {
      // Given: weak handだがbluff可能な状態（low randomでbet）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('2', 'clubs'), card('7', 'diamonds')]
              : [card('A', 'spades'), card('K', 'hearts')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('J', 'hearts'),
          card('9', 'spades'),
          card('4', 'diamonds'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（low乱数で攻撃的）
      const action = decideAction(state, 1, alwaysLow)
      const validActions = getValidActions(state, 1)

      // Then: betの場合、min/max範囲内
      if (action.type === 'bet') {
        const betSpec = validActions.find((a) => a.type === 'bet')!
        expect(action.amount).toBeGreaterThanOrEqual(betSpec.min!)
        expect(action.amount).toBeLessThanOrEqual(betSpec.max!)
      }
    })
  })

  describe('raise amount within getValidActions min/max range', () => {
    test('should return raise amount within valid range for strong preflop hand', () => {
      // Given: strong handでraise可能な状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysLow)
      const validActions = getValidActions(state, 1)

      // Then: raiseの場合、amountがmin/max範囲内
      if (action.type === 'raise') {
        const raiseSpec = validActions.find((a) => a.type === 'raise')!
        expect(action.amount).toBeGreaterThanOrEqual(raiseSpec.min!)
        expect(action.amount).toBeLessThanOrEqual(raiseSpec.max!)
      }
    })

    test('should return raise amount within valid range for medium hand', () => {
      // Given: medium handでraise可能な状態（low乱数で攻撃的）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('Q', 'spades'), card('J', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（low乱数で30%未満→raise可能性）
      const action = decideAction(state, 1, alwaysLow)
      const validActions = getValidActions(state, 1)

      // Then: raiseの場合、min/max範囲内
      if (action.type === 'raise') {
        const raiseSpec = validActions.find((a) => a.type === 'raise')!
        expect(action.amount).toBeGreaterThanOrEqual(raiseSpec.min!)
        expect(action.amount).toBeLessThanOrEqual(raiseSpec.max!)
      }
    })
  })

  describe('shortstack CPU action validity', () => {
    test('should return valid action when CPU has very few chips', () => {
      // Given: CPUがBIG_BLIND未満のチップ
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 1 ? 5 : 1000,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)
      const validActions = getValidActions(state, 1)
      const validTypes = validActions.map((a) => a.type)

      // Then: 返されたアクションは有効アクションに含まれる
      expect(validTypes).toContain(action.type)
    })

    test('should produce action that applyAction accepts for shortstack CPU', () => {
      // Given: ショートスタックCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 1 ? 8 : 1000,
          holeCards:
            i === 1
              ? [card('K', 'spades'), card('Q', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定し、applyActionに渡す
      const action = decideAction(state, 1, alwaysMid)

      // Then: applyActionがエラーなく処理する
      expect(() => applyAction(state, 1, action)).not.toThrow()
    })
  })

  describe('CPU action is always applicable via applyAction', () => {
    test('should produce action that applyAction accepts in all random scenarios', () => {
      // Given: 通常の状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('10', 'spades'), card('J', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When/Then: 異なるrandomFn値でもapplyActionが受け入れる
      for (const randomFn of [alwaysLow, alwaysMid, alwaysHigh]) {
        const action = decideAction(state, 1, randomFn)
        expect(() => applyAction(state, 1, action)).not.toThrow()
      }
    })

    test('should produce action that applyAction accepts in postflop with bet', () => {
      // Given: ポストフロップでbet可能な状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('A', 'diamonds'),
          card('5', 'clubs'),
          card('9', 'hearts'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When/Then: applyActionが受け入れる
      for (const randomFn of [alwaysLow, alwaysMid, alwaysHigh]) {
        const action = decideAction(state, 1, randomFn)
        expect(() => applyAction(state, 1, action)).not.toThrow()
      }
    })
  })
})
