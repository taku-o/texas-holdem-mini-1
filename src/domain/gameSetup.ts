import type { Card, GameState } from './types'
import { PLAYER_COUNT, INITIAL_CHIPS } from './constants'
import { createDeck, shuffleDeck } from './deck'
import { preparePreflopRound } from './handProgression'

export function setupNewGame(randomFn: () => number): GameState {
  const humanIndex = Math.floor(randomFn() * PLAYER_COUNT)
  const dealerIndex = Math.floor(randomFn() * PLAYER_COUNT)

  const players = Array.from({ length: PLAYER_COUNT }, (_, i) => ({
    id: `player-${i}`,
    isHuman: i === humanIndex,
    chips: INITIAL_CHIPS,
    holeCards: [] as Card[],
    folded: false,
    currentBetInRound: 0,
  }))

  const deck = shuffleDeck(createDeck(), randomFn)

  const state: GameState = {
    phase: 'preflop',
    dealerIndex,
    players,
    communityCards: [],
    pot: 0,
    currentBet: 0,
    currentPlayerIndex: 0,
    humanPlayerId: `player-${humanIndex}`,
    deck,
    lastAggressorIndex: null,
  }

  return preparePreflopRound(state)
}
