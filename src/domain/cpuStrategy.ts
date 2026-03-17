import type { Card, GameState, PlayerAction, Rank } from './types'
import { getValidActions } from './betting'
import { evaluate } from './handEvaluator'
import { BIG_BLIND } from './constants'

type HandStrength = 'strong' | 'medium' | 'weak'

const RANK_VALUE: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
}

const HIGH_RANK_THRESHOLD = 10

function evaluatePreflopStrength(holeCards: Card[]): HandStrength {
  const [a, b] = holeCards
  const rankA = RANK_VALUE[a.rank]
  const rankB = RANK_VALUE[b.rank]
  const isPair = a.rank === b.rank
  const isSuited = a.suit === b.suit
  const highRank = Math.max(rankA, rankB)
  const lowRank = Math.min(rankA, rankB)

  if (isPair && highRank >= HIGH_RANK_THRESHOLD) return 'strong'
  if (isPair) return 'medium'
  if (isSuited && highRank >= 13 && lowRank >= HIGH_RANK_THRESHOLD) return 'strong'
  if (highRank >= 13 && lowRank >= HIGH_RANK_THRESHOLD) return 'medium'
  if (isSuited && highRank >= HIGH_RANK_THRESHOLD) return 'medium'
  return 'weak'
}

function evaluatePostflopStrength(
  holeCards: Card[],
  communityCards: Card[],
): HandStrength {
  const allCards = [...holeCards, ...communityCards]
  const handRank = evaluate(allCards)

  switch (handRank.category) {
    case 'royal-flush':
    case 'straight-flush':
    case 'four-of-a-kind':
    case 'full-house':
    case 'flush':
    case 'straight':
    case 'three-of-a-kind':
      return 'strong'
    case 'two-pair':
    case 'one-pair':
      return 'medium'
    case 'high-card':
      return 'weak'
  }
}

function calculateBetAmount(
  strength: HandStrength,
  playerChips: number,
  currentBet: number,
): number {
  const multiplier = strength === 'strong' ? 3 : 2
  const rawAmount = Math.max(BIG_BLIND * multiplier, currentBet * 2)
  const aligned = Math.floor(rawAmount / BIG_BLIND) * BIG_BLIND
  return Math.min(Math.max(aligned, BIG_BLIND), playerChips)
}

function clampToValidRange(amount: number, range: { min: number; max: number }): number {
  return Math.min(Math.max(amount, range.min), range.max)
}

export function decideAction(
  state: GameState,
  playerIndex: number,
  randomFn: () => number,
): PlayerAction {
  const player = state.players[playerIndex]
  const validActions = getValidActions(state, playerIndex)
  const validTypes = validActions.map((a) => a.type)

  const strength =
    state.phase === 'preflop'
      ? evaluatePreflopStrength(player.holeCards)
      : evaluatePostflopStrength(player.holeCards, state.communityCards)

  const canCheck = validTypes.includes('check')
  const canCall = validTypes.includes('call')
  const betAction = validActions.find(
    (a): a is Extract<typeof a, { type: 'bet' }> => a.type === 'bet',
  )
  const raiseAction = validActions.find(
    (a): a is Extract<typeof a, { type: 'raise' }> => a.type === 'raise',
  )

  const roll = randomFn()

  if (strength === 'strong') {
    const rawAmount = calculateBetAmount(strength, player.chips, state.currentBet)
    if (betAction) {
      return { type: 'bet', amount: clampToValidRange(rawAmount, betAction) }
    }
    if (raiseAction) {
      return { type: 'raise', amount: clampToValidRange(rawAmount, raiseAction) }
    }
    if (canCall) return { type: 'call' }
    if (canCheck) return { type: 'check' }
    return { type: 'fold' }
  }

  if (strength === 'medium') {
    if (roll < 0.3) {
      const rawAmount = calculateBetAmount(strength, player.chips, state.currentBet)
      if (raiseAction) {
        return { type: 'raise', amount: clampToValidRange(rawAmount, raiseAction) }
      }
      if (betAction) {
        return { type: 'bet', amount: clampToValidRange(rawAmount, betAction) }
      }
    }
    if (canCall) return { type: 'call' }
    if (canCheck) return { type: 'check' }
    return { type: 'fold' }
  }

  if (canCheck) {
    if (betAction && roll < 0.2) {
      const rawAmount = calculateBetAmount(strength, player.chips, state.currentBet)
      return { type: 'bet', amount: clampToValidRange(rawAmount, betAction) }
    }
    return { type: 'check' }
  }

  if (roll < 0.3) {
    if (canCall) return { type: 'call' }
  }

  return { type: 'fold' }
}
