import {
  evaluateStrings,
  rankBoard,
  rankDescription,
} from '@pokertools/evaluator'
import type { Card, HandRank, HandRankCategory } from './types'

const RANK_TO_LIB: Record<Card['rank'], string> = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': 'T',
  J: 'J',
  Q: 'Q',
  K: 'K',
  A: 'A',
}

const SUIT_TO_LIB: Record<Card['suit'], string> = {
  spades: 's',
  hearts: 'h',
  diamonds: 'd',
  clubs: 'c',
}

const DESCRIPTION_TO_CATEGORY: Record<string, HandRankCategory> = {
  'Straight Flush': 'straight-flush',
  'Four of a Kind': 'four-of-a-kind',
  'Full House': 'full-house',
  Flush: 'flush',
  Straight: 'straight',
  'Three of a Kind': 'three-of-a-kind',
  'Two Pair': 'two-pair',
  'One Pair': 'one-pair',
  'High Card': 'high-card',
}

const ROYAL_FLUSH_SCORE = 1

function toLibCardString(card: Card): string {
  return RANK_TO_LIB[card.rank] + SUIT_TO_LIB[card.suit]
}

export function evaluate(cards: Card[]): HandRank {
  const libCards = cards.map(toLibCardString)
  const score = evaluateStrings(libCards)
  const boardStr = libCards.join(' ')
  const libRank = rankBoard(boardStr)
  const description = rankDescription(libRank)
  const baseCategory = DESCRIPTION_TO_CATEGORY[description]
  if (!baseCategory) {
    throw new Error(`Unknown hand rank description: ${description}`)
  }

  const isRoyalFlush =
    baseCategory === 'straight-flush' && score === ROYAL_FLUSH_SCORE
  const category: HandRankCategory = isRoyalFlush
    ? 'royal-flush'
    : baseCategory

  return { category, score }
}
