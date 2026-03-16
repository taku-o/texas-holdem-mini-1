import { useState, useCallback, useMemo, useRef } from 'react'
import type { GameState, PlayerAction, ValidAction } from '../domain/types'
import { setupNewGame } from '../domain/gameSetup'
import { getValidActions } from '../domain/betting'
import { handlePlayerAction, advanceUntilHumanTurn } from './gameFlow'

type GameController = {
  gameState: GameState | null
  validActions: ValidAction[]
  isHumanTurn: boolean
  startGame: () => void
  handleAction: (action: PlayerAction) => void
}

export function useGameController(randomFn: () => number): GameController {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const gameStateRef = useRef<GameState | null>(null)
  const processingRef = useRef(false)

  const startGame = useCallback(() => {
    if (processingRef.current) return
    processingRef.current = true
    ;(async () => {
      try {
        const initialState = setupNewGame(randomFn)
        const advanced = await advanceUntilHumanTurn(
          initialState,
          randomFn,
          setGameState,
        )
        gameStateRef.current = advanced
        setGameState(advanced)
      } catch (e) {
        console.error(e)
        try {
          setGameState(null)
        } catch {
          // React environment may already be torn down
        }
        gameStateRef.current = null
      } finally {
        processingRef.current = false
      }
    })()
  }, [randomFn])

  const handleAction = useCallback(
    (action: PlayerAction) => {
      if (processingRef.current) return
      const state = gameStateRef.current
      if (!state) return

      processingRef.current = true
      ;(async () => {
        try {
          const result = await handlePlayerAction(
            state,
            action,
            randomFn,
            setGameState,
          )
          gameStateRef.current = result
          setGameState(result)
        } catch (e) {
          console.error(e)
        } finally {
          processingRef.current = false
        }
      })()
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

  gameStateRef.current = gameState

  return { gameState, validActions, isHumanTurn, startGame, handleAction }
}
