import type { GameState } from './types'
import { SMALL_BLIND, BIG_BLIND } from './constants'

export function postBlinds(state: GameState): GameState {
  const players = state.players.map((p) => ({ ...p }))
  const count = players.length
  const sbIndex = (state.dealerIndex + 1) % count
  const bbIndex = (state.dealerIndex + 2) % count

  const sbAmount = Math.min(SMALL_BLIND, players[sbIndex].chips)
  players[sbIndex].chips -= sbAmount
  players[sbIndex].currentBetInRound = sbAmount

  const bbAmount = Math.min(BIG_BLIND, players[bbIndex].chips)
  players[bbIndex].chips -= bbAmount
  players[bbIndex].currentBetInRound = bbAmount

  return {
    ...state,
    players,
    pot: state.pot + sbAmount + bbAmount,
    currentBet: BIG_BLIND,
    lastAggressorIndex: bbIndex,
  }
}

export function dealHoleCards(state: GameState): GameState {
  const players = state.players.map((p, i) => ({
    ...p,
    holeCards: [state.deck[i * 2], state.deck[i * 2 + 1]],
  }))
  const deck = state.deck.slice(state.players.length * 2)
  return { ...state, players, deck }
}

export function dealCommunityCards(
  state: GameState,
  count: number,
): GameState {
  const newCards = state.deck.slice(0, count)
  const deck = state.deck.slice(count)
  return {
    ...state,
    communityCards: [...state.communityCards, ...newCards],
    deck,
  }
}
