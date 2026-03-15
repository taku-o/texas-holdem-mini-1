import type { GameState, Player, Card } from './types'
import { evaluate } from './handEvaluator'

export function determineWinners(
  players: Player[],
  communityCards: Card[],
): number[] {
  let bestScore = Infinity
  const winners: number[] = []

  for (let i = 0; i < players.length; i++) {
    if (players[i].folded) continue
    const allCards = [...players[i].holeCards, ...communityCards]
    const hand = evaluate(allCards)

    if (hand.score < bestScore) {
      bestScore = hand.score
      winners.length = 0
      winners.push(i)
    } else if (hand.score === bestScore) {
      winners.push(i)
    }
  }

  return winners
}

export function evaluateShowdown(state: GameState): GameState {
  const winners = determineWinners(state.players, state.communityCards)
  const share = Math.floor(state.pot / winners.length)
  const remainder = state.pot - share * winners.length

  const players = state.players.map((p, i) => {
    if (!winners.includes(i)) return { ...p }
    const extra = i === winners[0] ? remainder : 0
    return { ...p, chips: p.chips + share + extra }
  })

  return { ...state, players, pot: 0 }
}

export function resolveUncontestedPot(state: GameState): GameState {
  const winnerIndex = state.players.findIndex((p) => !p.folded)
  const players = state.players.map((p, i) => {
    if (i !== winnerIndex) return { ...p }
    return { ...p, chips: p.chips + state.pot }
  })
  return { ...state, players, pot: 0 }
}
