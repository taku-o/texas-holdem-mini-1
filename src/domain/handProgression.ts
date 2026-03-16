import type { Card, GamePhase, GameState } from './types'
import { createDeck, shuffleDeck } from './deck'
import {
  dealCommunityCards,
  dealHoleCards,
  findNextEligibleIndex,
  postBlinds,
} from './dealing'
import { getNextActivePlayerIndex } from './betting'

const NEXT_PHASE: Partial<Record<GamePhase, GamePhase>> = {
  preflop: 'flop',
  flop: 'turn',
  turn: 'river',
  river: 'showdown',
}

const DEAL_COUNTS: Partial<Record<GamePhase, number>> = {
  preflop: 3,
  flop: 1,
  turn: 1,
}

export function preparePreflopRound(state: GameState): GameState {
  let nextState = postBlinds(state)
  nextState = dealHoleCards(nextState)

  const bbIndex = nextState.lastAggressorIndex!
  const utg = getNextActivePlayerIndex(nextState, bbIndex)
  return { ...nextState, currentPlayerIndex: utg }
}

export function advancePhase(state: GameState): GameState {
  const nextPhase = NEXT_PHASE[state.phase]
  if (!nextPhase) {
    throw new Error(`Cannot advance from phase: ${state.phase}`)
  }

  const players = state.players.map((p) => ({
    ...p,
    currentBetInRound: 0,
  }))

  let nextState: GameState = {
    ...state,
    phase: nextPhase,
    players,
    currentBet: 0,
    lastAggressorIndex: null,
  }

  const cardCount = DEAL_COUNTS[state.phase]
  if (cardCount) {
    nextState = dealCommunityCards(nextState, cardCount)
  }

  if (nextPhase !== 'showdown') {
    const firstPlayer = getNextActivePlayerIndex(
      nextState,
      nextState.dealerIndex,
    )
    nextState = { ...nextState, currentPlayerIndex: firstPlayer }
  }

  return nextState
}

function getNextDealerIndex(state: GameState): number {
  const result = findNextEligibleIndex(state.players, state.dealerIndex)
  return result === -1 ? state.dealerIndex : result
}

export function startNextHand(
  state: GameState,
  randomFn: () => number,
): GameState {
  const newDealerIndex = getNextDealerIndex(state)
  const deck = shuffleDeck(createDeck(), randomFn)

  const players = state.players.map((p) => ({
    ...p,
    holeCards: [] as Card[],
    folded: false,
    currentBetInRound: 0,
  }))

  const nextState: GameState = {
    ...state,
    phase: 'preflop' as const,
    dealerIndex: newDealerIndex,
    players,
    communityCards: [],
    pot: 0,
    currentBet: 0,
    currentPlayerIndex: 0,
    deck,
    lastAggressorIndex: null,
  }

  return preparePreflopRound(nextState)
}

export function isGameOver(
  state: GameState,
): { over: boolean; reason?: string } {
  const human = state.players.find((p) => p.isHuman)
  if (human && human.chips === 0) {
    return { over: true, reason: 'Human player has no chips remaining' }
  }

  const cpuWithChips = state.players.filter(
    (p) => !p.isHuman && p.chips > 0,
  )
  if (cpuWithChips.length === 0) {
    return { over: true, reason: 'All CPU players eliminated' }
  }

  return { over: false }
}

export function getActivePlayerCount(state: GameState): number {
  return state.players.filter((p) => p.chips > 0).length
}
