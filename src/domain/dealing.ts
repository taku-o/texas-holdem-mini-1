import type { GameState, Player } from './types'
import { SMALL_BLIND, BIG_BLIND } from './constants'

export function findNextEligibleIndex(
  players: Player[],
  fromIndex: number,
): number {
  const count = players.length
  let index = (fromIndex + 1) % count
  const start = index
  do {
    if (players[index].chips > 0) return index
    index = (index + 1) % count
  } while (index !== start)
  return -1
}

export function postBlinds(state: GameState): GameState {
  const players = state.players.map((p) => ({ ...p }))
  const sbIndex = findNextEligibleIndex(players, state.dealerIndex)
  const bbIndex = findNextEligibleIndex(players, sbIndex)

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
    currentBet: bbAmount,
    lastAggressorIndex: bbIndex,
  }
}

export function dealHoleCards(state: GameState): GameState {
  let deckIndex = 0
  const players = state.players.map((p) => {
    if (p.folded) {
      return { ...p, holeCards: [] }
    }
    const holeCards = [state.deck[deckIndex], state.deck[deckIndex + 1]]
    deckIndex += 2
    return { ...p, holeCards }
  })
  const deck = state.deck.slice(deckIndex)
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
