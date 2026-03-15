import { useState, useCallback, useMemo } from 'react'
import type { GameState, PlayerAction } from '../domain/types'
import { setupNewGame } from '../domain/gameSetup'
import { getValidActions } from '../domain/betting'
import { handlePlayerAction, advanceUntilHumanTurn } from './gameFlow'

type GameController = {
  gameState: GameState | null
  validActions: PlayerAction[]
  isHumanTurn: boolean
  startGame: () => void
  handleAction: (action: PlayerAction) => void
}

export function useGameController(randomFn: () => number): GameController {
  const [gameState, setGameState] = useState<GameState | null>(null)

  const startGame = useCallback(() => {
    const initialState = setupNewGame(randomFn)
    const advanced = advanceUntilHumanTurn(initialState, randomFn)
    setGameState(advanced)
  }, [randomFn])

  const handleAction = useCallback(
    (action: PlayerAction) => {
      setGameState((prev) => {
        if (!prev) return prev
        return handlePlayerAction(prev, action, randomFn)
      })
    },
    [randomFn],
  )

  const isHumanTurn = useMemo(() => {
    if (!gameState || gameState.phase === 'idle') return false
    return gameState.players[gameState.currentPlayerIndex].isHuman
  }, [gameState])

  const validActions = useMemo(() => {
    if (!gameState || !isHumanTurn) return []
    return getValidActions(gameState, gameState.currentPlayerIndex)
  }, [gameState, isHumanTurn])

  return { gameState, validActions, isHumanTurn, startGame, handleAction }
}
