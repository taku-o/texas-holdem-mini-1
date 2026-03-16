import type { GameState, PlayerAction, ValidAction } from '../domain/types'
import { TableView } from './TableView'
import { PlayerSeats } from './PlayerSeats'
import { ActionBar } from './ActionBar'

export type GameScreenProps = {
  gameState: GameState | null
  validActions: ValidAction[]
  isHumanTurn: boolean
  onStartGame: () => void
  onAction: (action: PlayerAction) => void
}

export function GameScreen({
  gameState,
  validActions,
  isHumanTurn,
  onStartGame,
  onAction,
}: GameScreenProps) {
  if (gameState === null) {
    return <NotStartedView onStartGame={onStartGame} />
  }

  if (gameState.phase === 'idle' && gameState.gameOverReason) {
    return (
      <GameOverView
        reason={gameState.gameOverReason}
        onStartGame={onStartGame}
      />
    )
  }

  const humanPlayer = gameState.players.find((p) => p.id === gameState.humanPlayerId)

  return (
    <div>
      <TableView
        communityCards={gameState.communityCards}
        pot={gameState.pot}
      />
      <PlayerSeats
        players={gameState.players}
        dealerIndex={gameState.dealerIndex}
        currentPlayerIndex={gameState.currentPlayerIndex}
        phase={gameState.phase}
      />
      {isHumanTurn && humanPlayer && (
        <ActionBar
          validActions={validActions}
          onAction={onAction}
        />
      )}
    </div>
  )
}

function NotStartedView({ onStartGame }: { onStartGame: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
        Texas Hold'em
      </h1>
      <button
        className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
        onClick={onStartGame}
      >
        ゲーム開始
      </button>
    </div>
  )
}

function GameOverView({
  reason,
  onStartGame,
}: {
  reason: string
  onStartGame: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <p className="text-xl text-gray-800">{reason}</p>
      <button
        className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
        onClick={onStartGame}
      >
        新しいゲームを始める
      </button>
    </div>
  )
}
