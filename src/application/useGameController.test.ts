import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { useGameController } from './useGameController'
import { INITIAL_CHIPS, PLAYER_COUNT } from '../domain/constants'
import { calcTotalChips } from '../domain/testHelpers'

const fixedRandom = () => 0.5

/**
 * Wait until the game state settles at human turn or game over.
 * This accounts for the async CPU processing with onProgress intermediate states.
 */
async function waitForSettled(
  result: { current: ReturnType<typeof useGameController> },
): Promise<void> {
  await waitFor(() => {
    const state = result.current.gameState
    expect(state).not.toBeNull()
    const humanIndex = state!.players.findIndex((p) => p.isHuman)
    const isHumanTurn = state!.currentPlayerIndex === humanIndex
    const isGameOver = state!.phase === 'idle'
    expect(isHumanTurn || isGameOver).toBe(true)
  })
}

async function waitForGameEnd(
  result: { current: ReturnType<typeof useGameController> },
  action: { type: 'fold' } | { type: 'call' },
  maxIterations = 500,
): Promise<void> {
  let iterations = 0
  while (result.current.gameState?.phase !== 'idle' && iterations < maxIterations) {
    await act(async () => {
      result.current.handleAction(action)
    })
    await waitForSettled(result)
    iterations++
  }
  if (iterations >= maxIterations) {
    throw new Error(
      `waitForGameEnd did not reach idle phase within ${maxIterations} iterations`,
    )
  }
}

async function startAndWait(
  result: { current: ReturnType<typeof useGameController> },
): Promise<void> {
  await act(async () => {
    result.current.startGame()
  })
  await waitForSettled(result)
}

describe('useGameController', () => {
  describe('初期状態', () => {
    test('should have null gameState before game starts', () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      expect(result.current.gameState).toBeNull()
    })

    test('should have empty validActions before game starts', () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      expect(result.current.validActions).toEqual([])
    })

    test('should have isHumanTurn as false before game starts', () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      expect(result.current.isHumanTurn).toBe(false)
    })
  })

  describe('startGame', () => {
    test('should initialize game state when called', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)
      expect(result.current.gameState).not.toBeNull()
    })

    test('should create game with correct number of players', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)
      expect(result.current.gameState!.players).toHaveLength(PLAYER_COUNT)
    })

    test('should advance to human turn after starting', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      const state = result.current.gameState!
      const humanIndex = state.players.findIndex((p) => p.isHuman)
      const isHumanTurn = state.currentPlayerIndex === humanIndex
      const isGameOver = state.phase === 'idle'
      expect(isHumanTurn || isGameOver).toBe(true)
    })

    test('should preserve total chips after starting', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)
      expect(calcTotalChips(result.current.gameState!)).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })

    test('should set isHumanTurn to true when human turn is reached', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      const state = result.current.gameState!
      if (state.phase !== 'idle') {
        expect(result.current.isHumanTurn).toBe(true)
      }
    })

    test('should populate validActions when human turn is reached', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      const state = result.current.gameState!
      if (state.phase !== 'idle' && result.current.isHumanTurn) {
        expect(result.current.validActions.length).toBeGreaterThan(0)
      }
    })
  })

  describe('handleAction', () => {
    test('should update game state after human action', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)
      const stateBefore = result.current.gameState!

      await act(async () => {
        result.current.handleAction({ type: 'call' })
      })
      await waitForSettled(result)

      expect(result.current.gameState).not.toEqual(stateBefore)
    })

    test('should preserve total chips after human action', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await act(async () => {
        result.current.handleAction({ type: 'call' })
      })
      await waitForSettled(result)

      expect(calcTotalChips(result.current.gameState!)).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })

    test('should advance through CPU turns after human action', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await act(async () => {
        result.current.handleAction({ type: 'call' })
      })
      await waitForSettled(result)

      const state = result.current.gameState!
      const humanIndex = state.players.findIndex((p) => p.isHuman)
      const isHumanTurn = state.currentPlayerIndex === humanIndex
      const isGameOver = state.phase === 'idle'
      expect(isHumanTurn || isGameOver).toBe(true)
    })

    test('should apply fold action correctly', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await act(async () => {
        result.current.handleAction({ type: 'fold' })
      })
      await waitForSettled(result)

      const state = result.current.gameState!
      const humanIndex = state.players.findIndex((p) => p.isHuman)
      const isHumanTurn = state.currentPlayerIndex === humanIndex
      const isGameOver = state.phase === 'idle'
      expect(isHumanTurn || isGameOver).toBe(true)
    })
  })

  describe('validActions', () => {
    test('should return valid actions for human player during their turn', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      const state = result.current.gameState!
      if (state.phase !== 'idle') {
        const actionTypes = result.current.validActions.map((a) => a.type)
        expect(actionTypes).toContain('fold')
      }
    })

    test('should update validActions after state changes', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await act(async () => {
        result.current.handleAction({ type: 'call' })
      })
      await waitForSettled(result)

      const state = result.current.gameState!
      if (state.phase === 'idle') {
        expect(result.current.validActions).toEqual([])
      } else if (result.current.isHumanTurn) {
        expect(result.current.validActions.length).toBeGreaterThan(0)
      }
    })
  })

  describe('isHumanTurn', () => {
    test('should be true when current player is human after game start', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      const state = result.current.gameState!
      if (state.phase !== 'idle') {
        const humanIndex = state.players.findIndex((p) => p.isHuman)
        expect(state.currentPlayerIndex).toBe(humanIndex)
        expect(result.current.isHumanTurn).toBe(true)
      }
    })

    test('should be false when game is over', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await waitForGameEnd(result, { type: 'fold' })

      expect(result.current.gameState!.phase).toBe('idle')
      expect(result.current.isHumanTurn).toBe(false)
    }, 30000)
  })

  describe('ゲーム終了', () => {
    test('should reach game over when human folds repeatedly', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await waitForGameEnd(result, { type: 'fold' })

      expect(result.current.gameState!.phase).toBe('idle')
      expect(result.current.gameState!.gameOverReason).toBeDefined()
    }, 30000)

    test('should have empty validActions when game is over', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await waitForGameEnd(result, { type: 'fold' })

      expect(result.current.validActions).toEqual([])
    }, 30000)
  })

  describe('randomFn の注入', () => {
    test('should produce different game states with different randomFn', async () => {
      const randomFn1 = () => 0.1
      const randomFn2 = () => 0.9

      const { result: result1 } = renderHook(() =>
        useGameController(randomFn1),
      )
      const { result: result2 } = renderHook(() =>
        useGameController(randomFn2),
      )

      await act(async () => {
        result1.current.startGame()
      })
      await waitFor(() => {
        expect(result1.current.gameState).not.toBeNull()
        const state = result1.current.gameState!
        const humanIndex = state.players.findIndex((p) => p.isHuman)
        const isHumanTurn = state.currentPlayerIndex === humanIndex
        const isGameOver = state.phase === 'idle'
        expect(isHumanTurn || isGameOver).toBe(true)
      })
      await act(async () => {
        result2.current.startGame()
      })
      await waitFor(() => {
        expect(result2.current.gameState).not.toBeNull()
        const state = result2.current.gameState!
        const humanIndex = state.players.findIndex((p) => p.isHuman)
        const isHumanTurn = state.currentPlayerIndex === humanIndex
        const isGameOver = state.phase === 'idle'
        expect(isHumanTurn || isGameOver).toBe(true)
      })

      const humanIndex1 = result1.current.gameState!.players.findIndex(
        (p) => p.isHuman,
      )
      const humanIndex2 = result2.current.gameState!.players.findIndex(
        (p) => p.isHuman,
      )
      expect(humanIndex1).not.toBe(humanIndex2)
    })
  })

  describe('isHumanTurn の一貫性', () => {
    test('should match direct player access pattern for isHumanTurn', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      const state = result.current.gameState!
      if (state.phase !== 'idle') {
        expect(result.current.isHumanTurn).toBe(
          state.players[state.currentPlayerIndex].isHuman,
        )
      }
    })
  })

  describe('ゲーム再開', () => {
    test('should start a fresh game after game over by calling startGame again', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await waitForGameEnd(result, { type: 'fold' })
      expect(result.current.gameState!.phase).toBe('idle')

      await startAndWait(result)

      const state = result.current.gameState!
      expect(state.phase).not.toBe('idle')
      expect(state.players).toHaveLength(PLAYER_COUNT)
      expect(calcTotalChips(state)).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    }, 30000)

    test('should reset gameOverReason after restarting', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await waitForGameEnd(result, { type: 'fold' })
      expect(result.current.gameState!.gameOverReason).toBeDefined()

      await startAndWait(result)

      expect(result.current.gameState!.gameOverReason).toBeUndefined()
    }, 30000)
  })

  describe('連続ハンド', () => {
    test('should start new hand after hand completion', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await act(async () => {
        result.current.handleAction({ type: 'call' })
      })
      await waitForSettled(result)

      const state = result.current.gameState!
      if (state.phase !== 'idle') {
        expect(result.current.isHumanTurn).toBe(true)
        expect(result.current.validActions.length).toBeGreaterThan(0)
      }
    })

    test('should complete multiple hands with mixed actions preserving chip conservation', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      const actions: Array<{ type: 'call' | 'fold' }> = [
        { type: 'call' },
        { type: 'call' },
        { type: 'fold' },
      ]

      for (const action of actions) {
        if (result.current.gameState?.phase === 'idle') break
        await act(async () => {
          result.current.handleAction(action)
        })
        await waitForSettled(result)

        const stateAfter = result.current.gameState!
        expect(calcTotalChips(stateAfter)).toBe(INITIAL_CHIPS * PLAYER_COUNT)

        if (stateAfter.phase !== 'idle') {
          expect(result.current.isHumanTurn).toBe(true)
          expect(result.current.validActions.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('startGame の二重実行防止', () => {
    test('should ignore second startGame call while processing', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))

      // When: startGame を連続で呼ぶ
      await act(async () => {
        result.current.startGame()
        result.current.startGame()
      })
      await waitForSettled(result)

      // Then: 正常に1回だけ処理されている
      expect(result.current.gameState).not.toBeNull()
      expect(calcTotalChips(result.current.gameState!)).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })
  })

  describe('CPU全員脱落によるゲーム終了', () => {
    test('should end game when all CPU players are eliminated', async () => {
      const { result } = renderHook(() => useGameController(fixedRandom))
      await startAndWait(result)

      await waitForGameEnd(result, { type: 'call' })

      expect(result.current.gameState!.phase).toBe('idle')
      expect(result.current.gameState!.gameOverReason).toBeDefined()
      expect(result.current.isHumanTurn).toBe(false)
      expect(result.current.validActions).toEqual([])
    }, 30000)
  })
})
