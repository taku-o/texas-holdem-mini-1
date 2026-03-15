import { GameScreen } from './ui/GameScreen'
import { useGameController } from './application/useGameController'

function App() {
  const { gameState, validActions, isHumanTurn, startGame, handleAction } =
    useGameController(Math.random)

  return (
    <GameScreen
      gameState={gameState}
      validActions={validActions}
      isHumanTurn={isHumanTurn}
      onStartGame={startGame}
      onAction={handleAction}
    />
  )
}

export default App
