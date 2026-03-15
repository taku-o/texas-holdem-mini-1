import type { Card, Suit } from '../domain/types'

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const RED_SUITS: ReadonlySet<Suit> = new Set(['hearts', 'diamonds'])

export type CardViewProps = {
  card: Card | null
  faceDown: boolean
}

export function CardView({ card, faceDown }: CardViewProps) {
  const showBack = card === null || faceDown

  if (showBack) {
    return (
      <div className="w-12 h-16 rounded-lg shadow-sm bg-blue-800 border border-blue-900" />
    )
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit]
  const isRed = RED_SUITS.has(card.suit)
  const colorClass = isRed ? 'text-red-600' : 'text-gray-900'

  return (
    <div className="w-12 h-16 rounded-lg shadow-sm bg-white border border-gray-200 flex flex-col items-center justify-center">
      <span className={colorClass}>{card.rank}</span>
      <span className={colorClass}>{suitSymbol}</span>
    </div>
  )
}
