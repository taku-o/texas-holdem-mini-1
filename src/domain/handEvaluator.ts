import { evaluateStrings, rankBoard } from '@pokertools/evaluator'
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

const LIB_RANK_TO_CATEGORY: Record<number, HandRankCategory> = {
  0: 'straight-flush',
  1: 'four-of-a-kind',
  2: 'full-house',
  3: 'flush',
  4: 'straight',
  5: 'three-of-a-kind',
  6: 'two-pair',
  7: 'one-pair',
  8: 'high-card',
}

const ROYAL_FLUSH_SCORE = 1

function toLibCardString(card: Card): string {
  return RANK_TO_LIB[card.rank] + SUIT_TO_LIB[card.suit]
}

export function evaluate(cards: Card[]): HandRank {
  const libCards = cards.map(toLibCardString)
  const score = evaluateStrings(libCards)
  const boardStr = libCards.join(' ')
  const libRank = rankBoard(boardStr) as number

  const isRoyalFlush = libRank === 0 && score === ROYAL_FLUSH_SCORE
  const category: HandRankCategory = isRoyalFlush
    ? 'royal-flush'
    : LIB_RANK_TO_CATEGORY[libRank]

  return { category, score }
}
