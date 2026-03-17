import type { Card } from '../domain/types'
import { CardView } from './CardView'

export type TableViewProps = {
  communityCards: Card[]
  pot: number
}

export function TableView({ communityCards, pot }: TableViewProps) {
  return (
    <div className="bg-emerald-700 rounded-xl p-6 flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {communityCards.map((card) => (
          <CardView key={`${card.suit}-${card.rank}`} card={card} faceDown={false} />
        ))}
      </div>
      <div className="text-white text-lg font-semibold">
        Pot: {pot}
      </div>
    </div>
  )
}
