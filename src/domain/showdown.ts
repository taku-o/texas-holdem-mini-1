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

// Why: 本バージョンではサイドポットを実装せず、単一ポットで均等配分する。
// 端数（remainder）は最初の勝者に加算する。
// 不変条件: 配分後、全プレイヤーの chips >= 0 かつ配分合計 = pot。
export function evaluateShowdown(state: GameState): GameState {
  const winners = determineWinners(state.players, state.communityCards)
  const share = Math.floor(state.pot / winners.length)
  const remainder = state.pot - share * winners.length

  const players = state.players.map((p, i) => {
    if (!winners.includes(i)) return { ...p }
    const extra = i === winners[0] ? remainder : 0
    const newChips = p.chips + share + extra
    return { ...p, chips: newChips }
  })

  return { ...state, players, pot: 0 }
}

// Why: 全員フォールドで1人残った場合の単一ポット配分。
// 不変条件: 配分後、全プレイヤーの chips >= 0。
export function resolveUncontestedPot(state: GameState): GameState {
  const winnerIndex = state.players.findIndex((p) => !p.folded)
  const players = state.players.map((p, i) => {
    if (i !== winnerIndex) return { ...p }
    const newChips = p.chips + state.pot
    return { ...p, chips: newChips }
  })
  return { ...state, players, pot: 0 }
}
