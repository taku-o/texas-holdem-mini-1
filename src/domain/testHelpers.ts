import type { Card, Player, GameState } from './types'
import { createDeck } from './deck'

export const card = (rank: Card['rank'], suit: Card['suit']): Card => ({
  rank,
  suit,
})

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
