import type { Player } from '../domain/types'
import { CardView } from './CardView'

export type PlayerSeatProps = {
  player: Player
  isDealer: boolean
  isCurrentTurn: boolean
  showCards: boolean
  'data-testid'?: string
}

export function PlayerSeat({
  player,
  isDealer,
  isCurrentTurn,
  showCards,
  'data-testid': dataTestId,
}: PlayerSeatProps) {
  const shouldShowFaceUp = player.isHuman || showCards

  const seatClasses = buildSeatClasses({ isHuman: player.isHuman, isCurrentTurn, folded: player.folded })

  return (
    <div className={seatClasses} data-testid={dataTestId}>
      {isDealer && (
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          D
        </span>
      )}
      <div className="flex gap-1 mb-1">
        {player.holeCards.map((card) => (
          <CardView key={`${card.suit}-${card.rank}`} card={card} faceDown={!shouldShowFaceUp} />
        ))}
      </div>
      <div className="text-sm text-center">{player.chips}</div>
    </div>
  )
}

function buildSeatClasses({
  isHuman,
  isCurrentTurn,
  folded,
}: {
  isHuman: boolean
  isCurrentTurn: boolean
  folded: boolean
}): string {
  const base = 'relative p-3 rounded-lg'

  const parts = [base]

  if (folded) {
    parts.push('opacity-50')
  }

  if (isHuman) {
    parts.push('ring-2 ring-blue-500')
  }

  if (isCurrentTurn) {
    parts.push('border-2 border-yellow-400')
  }

  return parts.join(' ')
}
