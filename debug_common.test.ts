import { describe, expect, test } from 'vitest'
import {
  executeBettingRound,
  setupCpuChips,
  callCheckSelector,
  cpuFoldHumanCallSelector,
} from './debug_common'
import { setupNewGame } from './src/domain/gameSetup'
import { isBettingRoundComplete } from './src/domain/betting'
import { PLAYER_COUNT } from './src/domain/constants'
import type { GameState, PlayerAction } from './src/domain/types'
import { calcTotalChips } from './src/domain/testHelpers'

const fixedRandom = () => 0.5

describe('debug_common', () => {
  describe('executeBettingRound', () => {
    test('should complete betting round with given selector', () => {
      // Given: プリフロップの初期状態
      const state = setupNewGame(fixedRandom)

      // When: callCheckSelector でベッティングラウンドを実行する
      const result = executeBettingRound(state, callCheckSelector, 20)

      // Then: ベッティングラウンドが完了している
      expect(isBettingRoundComplete(result)).toBe(true)
    })

    test('should preserve chip conservation through betting round', () => {
      // Given: プリフロップの初期状態
      const state = setupNewGame(fixedRandom)
      const initialTotal = calcTotalChips(state)

      // When: callCheckSelector でベッティングラウンドを実行する
      const result = executeBettingRound(state, callCheckSelector, 20)

      // Then: チップ保存則が成り立つ
      const resultTotal = calcTotalChips(result)
      expect(resultTotal).toBe(initialTotal)
    })

    test('should stop when maxActions is reached', () => {
      // Given: プリフロップの初期状態、maxActions=1
      const state = setupNewGame(fixedRandom)

      // When: maxActions=1 で実行する
      const result = executeBettingRound(state, callCheckSelector, 1)

      // Then: 状態が変わっている（少なくとも1アクション実行された）が、
      //       ベッティングラウンドが完了しているとは限らない
      expect(result).toBeDefined()
    })

    test('should stop when selector returns null', () => {
      // Given: 常にnullを返すセレクター
      const state = setupNewGame(fixedRandom)
      const nullSelector = () => null

      // When: nullセレクターで実行する
      const result = executeBettingRound(state, nullSelector, 20)

      // Then: 初期状態のまま返る（アクションが適用されない）
      expect(result.pot).toBe(state.pot)
    })

    test('should not mutate original state', () => {
      // Given: プリフロップの初期状態
      const state = setupNewGame(fixedRandom)
      const originalPot = state.pot
      const originalChips = state.players.map((p) => p.chips)

      // When: ベッティングラウンドを実行する
      executeBettingRound(state, callCheckSelector, 20)

      // Then: 元の状態は変更されていない
      expect(state.pot).toBe(originalPot)
      expect(state.players.map((p) => p.chips)).toEqual(originalChips)
    })

    test('should call logger before each action when provided', () => {
      // Given: プリフロップの初期状態とロガー
      const state = setupNewGame(fixedRandom)
      const logEntries: Array<{ playerIdx: number; actionType: string }> = []
      const logger = (
        _state: GameState,
        playerIdx: number,
        action: PlayerAction,
        _actions: PlayerAction[],
      ) => {
        logEntries.push({ playerIdx, actionType: action.type })
      }

      // When: ロガー付きでベッティングラウンドを実行する
      executeBettingRound(state, callCheckSelector, 20, logger)

      // Then: ロガーがアクションごとに呼ばれている
      expect(logEntries.length).toBeGreaterThan(0)
      for (const entry of logEntries) {
        expect(entry.actionType).toBeDefined()
        expect(entry.playerIdx).toBeGreaterThanOrEqual(0)
      }
    })

    test('should pass valid actions to logger as 4th argument', () => {
      // Given: プリフロップの初期状態とアクションリストを記録するロガー
      const state = setupNewGame(fixedRandom)
      const loggedActions: PlayerAction[][] = []
      const logger = (
        _state: GameState,
        _playerIdx: number,
        _action: PlayerAction,
        actions: PlayerAction[],
      ) => {
        loggedActions.push(actions)
      }

      // When: ロガー付きでベッティングラウンドを実行する
      executeBettingRound(state, callCheckSelector, 20, logger)

      // Then: ロガーに渡されたアクションリストが空でない配列である
      expect(loggedActions.length).toBeGreaterThan(0)
      for (const actions of loggedActions) {
        expect(Array.isArray(actions)).toBe(true)
        expect(actions.length).toBeGreaterThan(0)
      }
    })
  })

  describe('setupCpuChips', () => {
    test('should set all CPU players to specified chip amount', () => {
      // Given: 標準ゲーム状態
      const state = setupNewGame(fixedRandom)
      const cpuChips = 30

      // When: CPUチップを30に設定する
      const result = setupCpuChips(state, cpuChips)

      // Then: 全CPUプレイヤーのチップが30である
      const cpuPlayers = result.players.filter((p) => !p.isHuman)
      for (const cpu of cpuPlayers) {
        expect(cpu.chips).toBe(cpuChips)
      }
    })

    test('should distribute remaining chips to human player', () => {
      // Given: 標準ゲーム状態
      const state = setupNewGame(fixedRandom)
      const cpuChips = 30

      // When: CPUチップを30に設定する
      const result = setupCpuChips(state, cpuChips)

      // Then: 人間プレイヤーのチップが残り全額（合計 - CPU合計）
      const totalPlayerChips = state.players.reduce((sum, p) => sum + p.chips, 0)
      const totalCpuChips = cpuChips * (PLAYER_COUNT - 1)
      const expectedHumanChips = totalPlayerChips - totalCpuChips
      const humanPlayer = result.players.find((p) => p.isHuman)
      expect(humanPlayer!.chips).toBe(expectedHumanChips)
    })

    test('should preserve total chip count', () => {
      // Given: 標準ゲーム状態
      const state = setupNewGame(fixedRandom)
      const originalTotal = calcTotalChips(state)

      // When: CPUチップを50に設定する
      const result = setupCpuChips(state, 50)

      // Then: プレイヤーチップ合計が変わらない
      const resultTotal = calcTotalChips(result)
      expect(resultTotal).toBe(originalTotal)
    })

    test('should not mutate original state', () => {
      // Given: 標準ゲーム状態
      const state = setupNewGame(fixedRandom)
      const originalChips = state.players.map((p) => p.chips)

      // When: CPUチップを設定する
      setupCpuChips(state, 30)

      // Then: 元の状態は変更されていない
      expect(state.players.map((p) => p.chips)).toEqual(originalChips)
    })
  })

  describe('callCheckSelector', () => {
    test('should prefer call over check', () => {
      // Given: call と check の両方が有効なアクション
      const state = setupNewGame(fixedRandom)
      const actions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'check' },
      ]

      // When: セレクターを呼ぶ
      const result = callCheckSelector(state, 0, actions)

      // Then: call が選択される
      expect(result).toEqual({ type: 'call' })
    })

    test('should select check when call is not available', () => {
      // Given: check のみ有効なアクション
      const state = setupNewGame(fixedRandom)
      const actions: PlayerAction[] = [{ type: 'fold' }, { type: 'check' }]

      // When: セレクターを呼ぶ
      const result = callCheckSelector(state, 0, actions)

      // Then: check が選択される
      expect(result).toEqual({ type: 'check' })
    })

    test('should return null when neither call nor check is available', () => {
      // Given: fold と bet のみ有効
      const state = setupNewGame(fixedRandom)
      const actions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'bet', amount: 20 },
      ]

      // When: セレクターを呼ぶ
      const result = callCheckSelector(state, 0, actions)

      // Then: null が返る
      expect(result).toBeNull()
    })
  })

  describe('cpuFoldHumanCallSelector', () => {
    test('should select fold for CPU player when fold is available', () => {
      // Given: CPUプレイヤーの番で fold が有効
      const state = setupNewGame(fixedRandom)
      const cpuIndex = state.players.findIndex((p) => !p.isHuman)
      const actions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'check' },
      ]

      // When: CPUプレイヤーに対してセレクターを呼ぶ
      const result = cpuFoldHumanCallSelector(state, cpuIndex, actions)

      // Then: fold が選択される
      expect(result).toEqual({ type: 'fold' })
    })

    test('should select check for CPU player when fold is not available', () => {
      // Given: CPUプレイヤーの番で fold がなく check がある
      const state = setupNewGame(fixedRandom)
      const cpuIndex = state.players.findIndex((p) => !p.isHuman)
      const actions: PlayerAction[] = [{ type: 'check' }, { type: 'bet', amount: 20 }]

      // When: CPUプレイヤーに対してセレクターを呼ぶ
      const result = cpuFoldHumanCallSelector(state, cpuIndex, actions)

      // Then: check が選択される
      expect(result).toEqual({ type: 'check' })
    })

    test('should return null for CPU when neither fold nor check is available', () => {
      // Given: CPUプレイヤーの番で fold も check もない
      const state = setupNewGame(fixedRandom)
      const cpuIndex = state.players.findIndex((p) => !p.isHuman)
      const actions: PlayerAction[] = [{ type: 'bet', amount: 20 }]

      // When: CPUプレイヤーに対してセレクターを呼ぶ
      const result = cpuFoldHumanCallSelector(state, cpuIndex, actions)

      // Then: null が返る
      expect(result).toBeNull()
    })

    test('should prefer call for human player', () => {
      // Given: 人間プレイヤーの番で call と check の両方が有効
      const state = setupNewGame(fixedRandom)
      const humanIndex = state.players.findIndex((p) => p.isHuman)
      const actions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'check' },
      ]

      // When: 人間プレイヤーに対してセレクターを呼ぶ
      const result = cpuFoldHumanCallSelector(state, humanIndex, actions)

      // Then: call が選択される
      expect(result).toEqual({ type: 'call' })
    })

    test('should select check for human player when call is not available', () => {
      // Given: 人間プレイヤーの番で check のみ有効
      const state = setupNewGame(fixedRandom)
      const humanIndex = state.players.findIndex((p) => p.isHuman)
      const actions: PlayerAction[] = [{ type: 'fold' }, { type: 'check' }]

      // When: 人間プレイヤーに対してセレクターを呼ぶ
      const result = cpuFoldHumanCallSelector(state, humanIndex, actions)

      // Then: check が選択される
      expect(result).toEqual({ type: 'check' })
    })

    test('should return null for human when neither call nor check is available', () => {
      // Given: 人間プレイヤーの番で call も check もない
      const state = setupNewGame(fixedRandom)
      const humanIndex = state.players.findIndex((p) => p.isHuman)
      const actions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'bet', amount: 20 },
      ]

      // When: 人間プレイヤーに対してセレクターを呼ぶ
      const result = cpuFoldHumanCallSelector(state, humanIndex, actions)

      // Then: null が返る
      expect(result).toBeNull()
    })
  })
})
