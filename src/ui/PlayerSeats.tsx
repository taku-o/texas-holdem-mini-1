import type { Player, GamePhase } from '../domain/types'
import { PlayerSeat } from './PlayerSeat'

export type PlayerSeatsProps = {
  players: Player[]
  dealerIndex: number
  currentPlayerIndex: number
  phase: GamePhase
}

export function PlayerSeats({
  players,
  dealerIndex,
  currentPlayerIndex,
  phase,
}: PlayerSeatsProps) {
  const isShowdown = phase === 'showdown'

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {players.map((player, index) => {
        const showCards = isShowdown && !player.folded

        return (
          <PlayerSeat
            key={player.id}
            data-testid={`player-seat-${index}`}
            player={player}
            isDealer={index === dealerIndex}
            isCurrentTurn={index === currentPlayerIndex}
            showCards={showCards}
          />
        )
      })}
    </div>
  )
}
