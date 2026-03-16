import type { Card, Player, GameState } from './types'
import { applyAction, getValidActions, isBettingRoundComplete } from './betting'
import { createDeck } from './deck'

export const card = (rank: Card['rank'], suit: Card['suit']): Card => ({
  rank,
  suit,
})

export function calcTotalChips(state: GameState): number {
  return state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot
}

export function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'test-player',
    isHuman: false,
    chips: 1000,
    holeCards: [card('A', 'spades'), card('K', 'hearts')],
    folded: false,
    currentBetInRound: 0,
    ...overrides,
  }
}

export function executeAllCallCheck(state: GameState): GameState {
  let current = state
  let guard = 0
  while (!isBettingRoundComplete(current) && guard < 100) {
    const playerIdx = current.currentPlayerIndex
    const actions = getValidActions(current, playerIdx)
    const callAction = actions.find((a) => a.type === 'call')
    const checkAction = actions.find((a) => a.type === 'check')
    const action = callAction ?? checkAction
    if (!action) break
    current = applyAction(current, playerIdx, action)
    guard++
  }
  if (guard >= 100) throw new Error('executeAllCallCheck: max iterations reached')
  return current
}

export function executeAllCheck(state: GameState): GameState {
  let current = state
  let guard = 0
  while (!isBettingRoundComplete(current) && guard < 100) {
    const playerIdx = current.currentPlayerIndex
    current = applyAction(current, playerIdx, { type: 'check' })
    guard++
  }
  if (guard >= 100) throw new Error('executeAllCheck: max iterations reached')
  return current
}

export function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'preflop',
    dealerIndex: 0,
    players: Array.from({ length: 5 }, (_, i) =>
      createTestPlayer({ id: `player-${i}`, isHuman: i === 0 })
    ),
    communityCards: [],
    pot: 0,
    currentBet: 0,
    currentPlayerIndex: 0,
    humanPlayerId: 'player-0',
    deck: 'deck' in overrides ? overrides.deck! : createDeck(),
    lastAggressorIndex: null,
    ...overrides,
  }
}
