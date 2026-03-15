import { renderHook, act } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { useGameController } from './useGameController'
import { INITIAL_CHIPS, PLAYER_COUNT } from '../domain/constants'

const fixedRandom = () => 0.5

describe('useGameController', () => {
  describe('初期状態', () => {
    test('should have null gameState before game starts', () => {
      // Given: フックを初期化

      // When: フックをレンダリングする
      const { result } = renderHook(() => useGameController(fixedRandom))

      // Then: ゲーム状態がnullである
      expect(result.current.gameState).toBeNull()
    })

    test('should have empty validActions before game starts', () => {
      // Given: フックを初期化

      // When: フックをレンダリングする
      const { result } = renderHook(() => useGameController(fixedRandom))

      // Then: 有効なアクションが空配列である
      expect(result.current.validActions).toEqual([])
    })

    test('should have isHumanTurn as false before game starts', () => {
      // Given: フックを初期化

      // When: フックをレンダリングする
      const { result } = renderHook(() => useGameController(fixedRandom))

      // Then: 人間のターンではない
      expect(result.current.isHumanTurn).toBe(false)
    })
  })

  describe('startGame', () => {
    test('should initialize game state when called', () => {
      // Given: ゲーム未開始状態
      const { result } = renderHook(() => useGameController(fixedRandom))

      // When: ゲームを開始する
      act(() => {
        result.current.startGame()
      })

      // Then: ゲーム状態が初期化されている
      expect(result.current.gameState).not.toBeNull()
    })

    test('should create game with correct number of players', () => {
      // Given: ゲーム未開始状態
      const { result } = renderHook(() => useGameController(fixedRandom))

      // When: ゲームを開始する
      act(() => {
        result.current.startGame()
      })

      // Then: PLAYER_COUNT人のプレイヤーがいる
      expect(result.current.gameState!.players).toHaveLength(PLAYER_COUNT)
    })

    test('should advance to human turn after starting', () => {
      // Given: ゲーム未開始状態
      const { result } = renderHook(() => useGameController(fixedRandom))

      // When: ゲームを開始する
      act(() => {
        result.current.startGame()
      })

      // Then: 人間のターンに到達しているか、ゲームが終了している
      const state = result.current.gameState!
      const humanIndex = state.players.findIndex((p) => p.isHuman)
      const isHumanTurn = state.currentPlayerIndex === humanIndex
      const isGameOver = state.phase === 'idle'
      expect(isHumanTurn || isGameOver).toBe(true)
    })

    test('should preserve total chips after starting', () => {
      // Given: ゲーム未開始状態
      const { result } = renderHook(() => useGameController(fixedRandom))

      // When: ゲームを開始する
      act(() => {
        result.current.startGame()
      })

      // Then: チップ合計が初期値×人数と一致する
      const state = result.current.gameState!
      const totalChips =
        state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot
      expect(totalChips).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })

    test('should set isHumanTurn to true when human turn is reached', () => {
      // Given: ゲーム未開始状態
      const { result } = renderHook(() => useGameController(fixedRandom))

      // When: ゲームを開始する
      act(() => {
        result.current.startGame()
      })

      // Then: ゲームが終了していなければ、人間のターンである
      const state = result.current.gameState!
      if (state.phase !== 'idle') {
        expect(result.current.isHumanTurn).toBe(true)
      }
    })

    test('should populate validActions when human turn is reached', () => {
      // Given: ゲーム未開始状態
      const { result } = renderHook(() => useGameController(fixedRandom))

      // When: ゲームを開始する
      act(() => {
        result.current.startGame()
      })

      // Then: ゲームが終了しておらず人間のターンなら、有効なアクションがある
      const state = result.current.gameState!
      if (state.phase !== 'idle' && result.current.isHumanTurn) {
        expect(result.current.validActions.length).toBeGreaterThan(0)
      }
    })
  })

  describe('handleAction', () => {
    test('should update game state after human action', () => {
      // Given: ゲーム開始済みで人間のターン
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })
      const stateBefore = result.current.gameState!

      // When: 人間がコールする
      act(() => {
        result.current.handleAction({ type: 'call' })
      })

      // Then: ゲーム状態が更新されている
      expect(result.current.gameState).not.toEqual(stateBefore)
    })

    test('should preserve total chips after human action', () => {
      // Given: ゲーム開始済みで人間のターン
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })

      // When: 人間がコールする
      act(() => {
        result.current.handleAction({ type: 'call' })
      })

      // Then: チップ合計が保存されている
      const state = result.current.gameState!
      const totalChips =
        state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot
      expect(totalChips).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })

    test('should advance through CPU turns after human action', () => {
      // Given: ゲーム開始済みで人間のターン
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })

      // When: 人間がコールする
      act(() => {
        result.current.handleAction({ type: 'call' })
      })

      // Then: 人間のターンに戻っているか、ゲームが終了している
      const state = result.current.gameState!
      const humanIndex = state.players.findIndex((p) => p.isHuman)
      const isHumanTurn = state.currentPlayerIndex === humanIndex
      const isGameOver = state.phase === 'idle'
      expect(isHumanTurn || isGameOver).toBe(true)
    })

    test('should apply fold action correctly', () => {
      // Given: ゲーム開始済みで人間のターン
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })

      // When: 人間がフォールドする
      act(() => {
        result.current.handleAction({ type: 'fold' })
      })

      // Then: ゲーム状態が更新されている（次のハンドまたはゲーム終了）
      const state = result.current.gameState!
      expect(state).toBeDefined()
      const humanIndex = state.players.findIndex((p) => p.isHuman)
      const isHumanTurn = state.currentPlayerIndex === humanIndex
      const isGameOver = state.phase === 'idle'
      expect(isHumanTurn || isGameOver).toBe(true)
    })
  })

  describe('validActions', () => {
    test('should return valid actions for human player during their turn', () => {
      // Given: ゲーム開始済みで人間のターン
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })

      // When: 有効なアクションを参照する（ゲームが終了していない場合）
      const state = result.current.gameState!
      if (state.phase !== 'idle') {
        // Then: foldは常に有効なアクションに含まれる
        const actionTypes = result.current.validActions.map((a) => a.type)
        expect(actionTypes).toContain('fold')
      }
    })

    test('should update validActions after state changes', () => {
      // Given: ゲーム開始済みで人間のターン
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })
      const actionsBefore = result.current.validActions

      // When: 人間がアクションを実行して状態が変化する
      act(() => {
        result.current.handleAction({ type: 'call' })
      })

      // Then: validActionsが状態に応じて更新されている（同じか異なるかは状態次第）
      const state = result.current.gameState!
      if (state.phase === 'idle') {
        expect(result.current.validActions).toEqual([])
      } else if (result.current.isHumanTurn) {
        expect(result.current.validActions.length).toBeGreaterThan(0)
      }
    })
  })

  describe('isHumanTurn', () => {
    test('should be true when current player is human after game start', () => {
      // Given: ゲーム開始済み
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })

      // When: 状態を参照する（ゲームが終了していない場合）
      const state = result.current.gameState!
      if (state.phase !== 'idle') {
        // Then: 人間のターンである
        const humanIndex = state.players.findIndex((p) => p.isHuman)
        expect(state.currentPlayerIndex).toBe(humanIndex)
        expect(result.current.isHumanTurn).toBe(true)
      }
    })

    test('should be false when game is over', () => {
      // Given: ゲーム開始済み
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })

      // When: 人間がフォールドを繰り返してゲーム終了に到達する
      let iterations = 0
      const maxIterations = 500
      while (
        result.current.gameState?.phase !== 'idle' &&
        iterations < maxIterations
      ) {
        act(() => {
          result.current.handleAction({ type: 'fold' })
        })
        iterations++
      }

      // Then: ゲーム終了で isHumanTurn が false
      expect(result.current.gameState!.phase).toBe('idle')
      expect(result.current.isHumanTurn).toBe(false)
    })
  })

  describe('ゲーム終了', () => {
    test('should reach game over when human folds repeatedly', () => {
      // Given: ゲーム開始済み
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })

      // When: 人間がフォールドを繰り返す
      let iterations = 0
      const maxIterations = 500
      while (
        result.current.gameState?.phase !== 'idle' &&
        iterations < maxIterations
      ) {
        act(() => {
          result.current.handleAction({ type: 'fold' })
        })
        iterations++
      }

      // Then: ゲーム終了状態になる
      expect(result.current.gameState!.phase).toBe('idle')
      expect(result.current.gameState!.gameOverReason).toBeDefined()
    })

    test('should have empty validActions when game is over', () => {
      // Given: ゲーム終了状態
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })

      let iterations = 0
      const maxIterations = 500
      while (
        result.current.gameState?.phase !== 'idle' &&
        iterations < maxIterations
      ) {
        act(() => {
          result.current.handleAction({ type: 'fold' })
        })
        iterations++
      }

      // When/Then: ゲーム終了時の validActions が空
      expect(result.current.validActions).toEqual([])
    })
  })

  describe('randomFn の注入', () => {
    test('should produce different game states with different randomFn', () => {
      // Given: 異なる randomFn
      const randomFn1 = () => 0.1
      const randomFn2 = () => 0.9

      // When: 異なる randomFn でゲームを開始する
      const { result: result1 } = renderHook(() =>
        useGameController(randomFn1),
      )
      const { result: result2 } = renderHook(() =>
        useGameController(randomFn2),
      )

      act(() => {
        result1.current.startGame()
      })
      act(() => {
        result2.current.startGame()
      })

      // Then: 人間プレイヤーの席が異なる
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
    test('should match direct player access pattern for isHumanTurn', () => {
      // Given: ゲーム開始済み
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })

      // When: 状態を参照する
      const state = result.current.gameState!

      // Then: isHumanTurn が currentPlayerIndex の isHuman と一致する
      if (state.phase !== 'idle') {
        expect(result.current.isHumanTurn).toBe(
          state.players[state.currentPlayerIndex].isHuman,
        )
      }
    })
  })

  describe('連続ハンド', () => {
    test('should start new hand after hand completion', () => {
      // Given: ゲーム開始済み
      const { result } = renderHook(() => useGameController(fixedRandom))
      act(() => {
        result.current.startGame()
      })

      // When: 人間がコールして1ハンドを完了させる
      act(() => {
        result.current.handleAction({ type: 'call' })
      })

      // Then: ゲーム終了でなければ、次のハンドが開始されている
      const state = result.current.gameState!
      if (state.phase !== 'idle') {
        expect(result.current.isHumanTurn).toBe(true)
        expect(result.current.validActions.length).toBeGreaterThan(0)
      }
    })
  })
})
