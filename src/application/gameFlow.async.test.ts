import { describe, expect, test, vi } from 'vitest'
import { handlePlayerAction, advanceUntilHumanTurn } from './gameFlow'
import { setupNewGame } from '../domain/gameEngine'
import { BIG_BLIND } from '../domain/constants'
import type { GameState } from '../domain/types'
import {
  calcTotalChips,
  card,
  createTestPlayer,
} from '../domain/testHelpers'
import {
  fixedRandom,
  createGameState,
  createHumanTurnState,
} from './gameFlow.testHelpers'

describe('gameFlow async', () => {
  describe('handlePlayerAction', () => {
    test('should return a Promise', () => {
      // Given: 人間の番の状態
      const state = createHumanTurnState()

      // When: handlePlayerAction を呼ぶ
      const result = handlePlayerAction(
        state,
        { type: 'fold' },
        fixedRandom,
      )

      // Then: Promise が返される
      expect(result).toBeInstanceOf(Promise)
    })

    test('should resolve to a valid GameState', async () => {
      // Given: 人間の番の状態
      const state = createHumanTurnState()

      // When: handlePlayerAction を await する
      const result = await handlePlayerAction(
        state,
        { type: 'fold' },
        fixedRandom,
      )

      // Then: 有効な GameState が返される
      expect(result).toBeDefined()
      expect(result.players).toBeDefined()
      expect(result.phase).toBeDefined()
    })

    test('should preserve total chips through async processing', async () => {
      // Given: setupNewGame で初期化した状態
      const state = setupNewGame(fixedRandom)
      const readyState = await advanceUntilHumanTurn(state, fixedRandom)
      const initialTotal = calcTotalChips(readyState)

      // When: 人間がコールする
      const result = await handlePlayerAction(
        readyState,
        { type: 'call' },
        fixedRandom,
      )

      // Then: チップ合計が保存されている
      expect(calcTotalChips(result)).toBe(initialTotal)
    })

    describe('onProgress コールバック', () => {
      test('should call onProgress with intermediate states during CPU turns', async () => {
        // Given: CPUターンが発生する状態と onProgress コールバック
        const state = setupNewGame(fixedRandom)
        const readyState = await advanceUntilHumanTurn(state, fixedRandom)
        const progressStates: GameState[] = []
        const onProgress = (intermediateState: GameState) => {
          progressStates.push(intermediateState)
        }

        // When: 人間がコールし、CPUターンが処理される
        await handlePlayerAction(
          readyState,
          { type: 'call' },
          fixedRandom,
          onProgress,
        )

        // Then: onProgress が少なくとも1回呼ばれている（CPUアクションがあるため）
        expect(progressStates.length).toBeGreaterThan(0)
      })

      test('should call onProgress with valid GameState objects', async () => {
        // Given: CPUターンが発生する状態
        const state = setupNewGame(fixedRandom)
        const readyState = await advanceUntilHumanTurn(state, fixedRandom)
        const progressStates: GameState[] = []
        const onProgress = (intermediateState: GameState) => {
          progressStates.push(intermediateState)
        }

        // When: 人間がコールする
        await handlePlayerAction(
          readyState,
          { type: 'call' },
          fixedRandom,
          onProgress,
        )

        // Then: 各中間状態が有効な GameState である
        for (const intermediateState of progressStates) {
          expect(intermediateState.players).toBeDefined()
          expect(intermediateState.phase).toBeDefined()
          expect(intermediateState.pot).toBeGreaterThanOrEqual(0)
        }
      })

      test('should not call onProgress when no CPU turns occur', async () => {
        // Given: 人間がチップ0でフォールド → 非争ポット解決 → ゲーム終了（CPUターンなし）
        const players = [
          createTestPlayer({
            id: 'player-0',
            isHuman: true,
            chips: 0,
            currentBetInRound: BIG_BLIND,
            holeCards: [card('A', 'spades'), card('K', 'hearts')],
          }),
          createTestPlayer({
            id: 'player-1',
            isHuman: false,
            chips: 1000,
            currentBetInRound: BIG_BLIND,
            folded: false,
            holeCards: [card('Q', 'hearts'), card('Q', 'diamonds')],
          }),
          createTestPlayer({
            id: 'player-2',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-3',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-4',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
        ]
        const state = createGameState({
          players,
          currentBet: BIG_BLIND,
          currentPlayerIndex: 0,
          pot: BIG_BLIND * 2,
          lastAggressorIndex: 1,
        })
        const onProgress = vi.fn()

        // When: 人間がフォールド（チップ0なのでゲーム終了、CPUターンなし）
        const result = await handlePlayerAction(
          state,
          { type: 'fold' },
          fixedRandom,
          onProgress,
        )

        // Then: ゲーム終了し、CPUターンがないため onProgress は呼ばれない
        expect(result.phase).toBe('idle')
        expect(onProgress).not.toHaveBeenCalled()
      })
    })
  })

  describe('advanceUntilHumanTurn', () => {
    test('should return a Promise', () => {
      // Given: 人間の番の状態
      const state = createHumanTurnState({ currentPlayerIndex: 0 })

      // When: advanceUntilHumanTurn を呼ぶ
      const result = advanceUntilHumanTurn(state, fixedRandom)

      // Then: Promise が返される
      expect(result).toBeInstanceOf(Promise)
    })

    test('should resolve immediately when current player is human', async () => {
      // Given: 人間の番
      const state = createHumanTurnState({ currentPlayerIndex: 0 })

      // When: advanceUntilHumanTurn を await する
      const result = await advanceUntilHumanTurn(state, fixedRandom)

      // Then: 状態が大きく変わらない（人間の番のまま）
      expect(result.currentPlayerIndex).toBe(0)
      expect(result.players[0].isHuman).toBe(true)
    })

    test('should process CPU turns and resolve to human turn or game over', async () => {
      // Given: setupNewGame で初期化（CPUの番から始まる可能性あり）
      const state = setupNewGame(fixedRandom)

      // When: CPUターンを消化する
      const result = await advanceUntilHumanTurn(state, fixedRandom)

      // Then: 人間の番に到達しているか、ゲーム終了している
      const humanIndex = result.players.findIndex((p) => p.isHuman)
      const isHumanTurn = result.currentPlayerIndex === humanIndex
      const isGameOver = result.phase === 'idle'
      expect(isHumanTurn || isGameOver).toBe(true)
    })

    describe('onProgress コールバック', () => {
      test('should call onProgress during CPU turn processing', async () => {
        // Given: CPUの番から始まる状態
        const players = Array.from({ length: 5 }, (_, i) =>
          createTestPlayer({
            id: `player-${i}`,
            isHuman: i === 0,
            chips: 1000,
            holeCards: [card('Q', 'spades'), card('J', 'hearts')],
            currentBetInRound: 0,
          }),
        )
        const state = createGameState({
          players,
          currentBet: 0,
          currentPlayerIndex: 1,
          phase: 'flop',
          communityCards: [
            card('2', 'clubs'),
            card('7', 'diamonds'),
            card('J', 'clubs'),
          ],
          lastAggressorIndex: null,
          deck: setupNewGame(fixedRandom).deck,
        })
        const progressStates: GameState[] = []
        const onProgress = (intermediateState: GameState) => {
          progressStates.push(intermediateState)
        }

        // When: CPUターンを消化する
        await advanceUntilHumanTurn(state, fixedRandom, onProgress)

        // Then: onProgress が呼ばれている（CPU player-1 のアクションがあるため）
        expect(progressStates.length).toBeGreaterThan(0)
      })

      test('should not call onProgress when already at human turn', async () => {
        // Given: 既に人間の番
        const state = createHumanTurnState({ currentPlayerIndex: 0 })
        const onProgress = vi.fn()

        // When: advanceUntilHumanTurn を呼ぶ
        await advanceUntilHumanTurn(state, fixedRandom, onProgress)

        // Then: CPUターンがないので onProgress は呼ばれない
        expect(onProgress).not.toHaveBeenCalled()
      })
    })
  })

  describe('yield to main thread', () => {
    test('should yield to main thread during CPU processing', async () => {
      // Given: CPUの番から始まる状態
      const state = setupNewGame(fixedRandom)
      let yieldOccurred = false
      const originalSetTimeout = globalThis.setTimeout
      vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
        fn: TimerHandler,
        delay?: number,
      ) => {
        if (delay === 0 && typeof fn === 'function') {
          yieldOccurred = true
        }
        return originalSetTimeout(fn, delay)
      }) as typeof setTimeout)

      // When: CPUターンを処理する
      await advanceUntilHumanTurn(state, fixedRandom)

      // Then: setTimeout(fn, 0) が呼ばれている（メインスレッドへの yield）
      expect(yieldOccurred).toBe(true)

      vi.restoreAllMocks()
    })
  })

  describe('統合テスト: async 完全ゲームフロー', () => {
    test('should handle a complete game with async processing', async () => {
      // Given: ゲーム開始
      const state = setupNewGame(fixedRandom)
      let current = await advanceUntilHumanTurn(state, fixedRandom)
      let iterations = 0
      const maxIterations = 500

      // When: 人間がフォールドを繰り返してゲーム終了まで進行する
      while (current.phase !== 'idle' && iterations < maxIterations) {
        const humanIndex = current.players.findIndex((p) => p.isHuman)
        if (
          current.currentPlayerIndex === humanIndex &&
          !current.players[humanIndex].folded
        ) {
          current = await handlePlayerAction(
            current,
            { type: 'fold' },
            fixedRandom,
          )
        } else {
          break
        }
        iterations++
      }

      // Then: ゲーム終了状態に到達する
      expect(current.phase).toBe('idle')
      expect(current.gameOverReason).toBeDefined()
    })

    test('should call onProgress throughout a multi-hand game', async () => {
      // Given: ゲーム開始
      const state = setupNewGame(fixedRandom)
      const allProgressCalls: GameState[] = []
      const onProgress = (s: GameState) => allProgressCalls.push(s)

      let current = await advanceUntilHumanTurn(state, fixedRandom, onProgress)

      // When: 数ハンド分のアクションを行う
      const actions: Array<{ type: 'call' | 'fold' }> = [
        { type: 'call' },
        { type: 'fold' },
        { type: 'call' },
      ]
      for (const action of actions) {
        if (current.phase === 'idle') break
        const humanIndex = current.players.findIndex((p) => p.isHuman)
        if (current.currentPlayerIndex !== humanIndex) break
        current = await handlePlayerAction(
          current,
          action,
          fixedRandom,
          onProgress,
        )
      }

      // Then: onProgress が複数回呼ばれている
      expect(allProgressCalls.length).toBeGreaterThan(0)
    })
  })
})
