import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { createTestState } from '../domain/testHelpers'

/**
 * setGameState が関数形式 setState(() => value) で呼ばれることを検証する。
 *
 * React の useState setter は値と関数の両方を受け付けるが、
 * startGame では前回状態に依存しない確実な状態設定のため関数形式を使う。
 * ここでは react モジュールの useState をラップし、setter への引数が
 * 関数かどうかを記録して検証する。
 */

// --- setState 呼び出し記録 ---
type SetterCall = { isFunction: boolean; result: unknown }
let gameStateSetterCalls: SetterCall[] = []
let capturedSetter: ((arg: unknown) => void) | null = null

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  const origUseState = actual.useState

  return {
    ...actual,
    useState: <T>(initial: T) => {
      const [state, setter] = origUseState(initial)

      // gameState は useState<GameState | null>(null) で初期化される
      // 既にキャプチャ済みの setter は再ラップしない（同一 setter を返す）
      if (initial === null) {
        if (capturedSetter === null) {
          const trackedSetter = (arg: unknown) => {
            if (typeof arg === 'function') {
              const result = (arg as () => unknown)()
              gameStateSetterCalls.push({ isFunction: true, result })
            } else {
              gameStateSetterCalls.push({ isFunction: false, result: arg })
            }
            return (setter as (v: unknown) => void)(arg)
          }
          capturedSetter = trackedSetter
        }
        return [state, capturedSetter] as const
      }
      return [state, setter] as const
    },
  }
})

// --- 依存モジュールのモック ---
const mockAdvancedState = createTestState({
  phase: 'preflop',
  currentPlayerIndex: 0,
  players: [
    {
      id: 'player-0',
      isHuman: true,
      chips: 990,
      holeCards: [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
      ],
      folded: false,
      currentBetInRound: 10,
    },
    {
      id: 'player-1',
      isHuman: false,
      chips: 980,
      holeCards: [
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'clubs' },
      ],
      folded: false,
      currentBetInRound: 20,
    },
  ],
  pot: 30,
  currentBet: 20,
  humanPlayerId: 'player-0',
})

vi.mock('../domain/gameSetup', () => ({
  setupNewGame: vi.fn(() => createTestState()),
}))

vi.mock('./gameFlow', () => ({
  advanceUntilHumanTurn: vi.fn(),
  handlePlayerAction: vi.fn(),
}))

import { advanceUntilHumanTurn, handlePlayerAction } from './gameFlow'
import { useGameController } from './useGameController'

const mockAdvanceUntilHumanTurn = vi.mocked(advanceUntilHumanTurn)
const mockHandlePlayerAction = vi.mocked(handlePlayerAction)

beforeEach(() => {
  gameStateSetterCalls = []
  capturedSetter = null
  vi.clearAllMocks()
})

describe('startGame の setState 関数形式', () => {
  test('正常系: setGameState が関数形式で呼ばれる', async () => {
    // Given: advanceUntilHumanTurn が正常に状態を返す
    mockAdvanceUntilHumanTurn.mockResolvedValue(mockAdvancedState)

    const { result } = renderHook(() => useGameController(() => 0.5))

    // When: startGame を実行する
    await act(async () => {
      result.current.startGame()
    })
    await waitFor(() => {
      expect(result.current.gameState).not.toBeNull()
    })

    // Then: 最終の setGameState 呼び出しが関数形式である
    const lastCall = gameStateSetterCalls[gameStateSetterCalls.length - 1]
    expect(lastCall).toBeDefined()
    expect(lastCall.isFunction).toBe(true)
  })

  test('正常系: 関数形式の返り値が advanceUntilHumanTurn の結果と一致する', async () => {
    // Given: advanceUntilHumanTurn が特定の状態を返す
    mockAdvanceUntilHumanTurn.mockResolvedValue(mockAdvancedState)

    const { result } = renderHook(() => useGameController(() => 0.5))

    // When: startGame を実行する
    await act(async () => {
      result.current.startGame()
    })
    await waitFor(() => {
      expect(result.current.gameState).not.toBeNull()
    })

    // Then: 最終呼び出しの関数が返す値が advanced state と一致する
    const lastCall = gameStateSetterCalls[gameStateSetterCalls.length - 1]
    expect(lastCall).toBeDefined()
    expect(lastCall.isFunction).toBe(true)
    expect(lastCall.result).toBe(mockAdvancedState)
  })

  test('異常系: エラー時の setGameState(null) も関数形式で呼ばれる', async () => {
    // Given: advanceUntilHumanTurn がエラーを投げる
    mockAdvanceUntilHumanTurn.mockRejectedValue(new Error('test error'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useGameController(() => 0.5))

    // When: startGame を実行する（エラーが発生する）
    await act(async () => {
      result.current.startGame()
    })

    // Then: エラーパスの setGameState が関数形式で呼ばれ、null を返す
    await waitFor(() => {
      const errorCall = gameStateSetterCalls.find(
        (call) => call.result === null,
      )
      expect(errorCall).toBeDefined()
      expect(errorCall!.isFunction).toBe(true)
    })

    vi.mocked(console.error).mockRestore()
  })

  test('正常系: startGame 後の gameState が正しく設定される', async () => {
    // Given: advanceUntilHumanTurn が特定の状態を返す
    mockAdvanceUntilHumanTurn.mockResolvedValue(mockAdvancedState)

    const { result } = renderHook(() => useGameController(() => 0.5))

    // When: startGame を実行する
    await act(async () => {
      result.current.startGame()
    })
    await waitFor(() => {
      expect(result.current.gameState).not.toBeNull()
    })

    // Then: gameState が advanceUntilHumanTurn の返り値と一致する
    expect(result.current.gameState).toBe(mockAdvancedState)
  })

  test('正常系: handleAction の setGameState も関数形式で呼ばれる', async () => {
    // Given: ゲームが開始済みで、ヒューマンプレイヤーのターン
    mockAdvanceUntilHumanTurn.mockResolvedValue(mockAdvancedState)
    const actionResult = createTestState({
      phase: 'preflop',
      currentPlayerIndex: 1,
      players: mockAdvancedState.players,
      pot: 50,
      currentBet: 20,
      humanPlayerId: 'player-0',
    })
    mockHandlePlayerAction.mockResolvedValue(actionResult)

    const { result } = renderHook(() => useGameController(() => 0.5))

    await act(async () => {
      result.current.startGame()
    })
    await waitFor(() => {
      expect(result.current.gameState).not.toBeNull()
    })

    // When: handleAction を実行する
    gameStateSetterCalls = []
    await act(async () => {
      result.current.handleAction({ type: 'call' })
    })
    await waitFor(() => {
      expect(gameStateSetterCalls.length).toBeGreaterThan(0)
    })

    // Then: handleAction の setGameState も関数形式で呼ばれる
    const lastCall = gameStateSetterCalls[gameStateSetterCalls.length - 1]
    expect(lastCall).toBeDefined()
    expect(lastCall.isFunction).toBe(true)
    expect(lastCall.result).toBe(actionResult)
  })

  test('異常系: エラー時に gameState が null にリセットされる', async () => {
    // Given: まず正常にゲームを開始
    mockAdvanceUntilHumanTurn.mockResolvedValue(mockAdvancedState)

    const { result } = renderHook(() => useGameController(() => 0.5))

    await act(async () => {
      result.current.startGame()
    })
    await waitFor(() => {
      expect(result.current.gameState).not.toBeNull()
    })

    // Given: 次の startGame でエラーが発生するよう設定
    gameStateSetterCalls = []
    mockAdvanceUntilHumanTurn.mockRejectedValue(new Error('test error'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // When: startGame を再実行する（エラーが発生する）
    await act(async () => {
      result.current.startGame()
    })
    await waitFor(() => {
      expect(result.current.gameState).toBeNull()
    })

    // Then: gameState が null にリセットされている
    expect(result.current.gameState).toBeNull()

    vi.mocked(console.error).mockRestore()
  })
})
