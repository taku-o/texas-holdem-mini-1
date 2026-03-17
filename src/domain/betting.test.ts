import { describe, expect, test } from 'vitest'
import {
  getValidActions,
  applyAction,
  isBettingRoundComplete,
  getNextActivePlayerIndex,
} from './betting'
import { BIG_BLIND } from './constants'
import type { GameState } from './types'
import { card, createTestPlayer, createTestState as createBaseTestState } from './testHelpers'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return createBaseTestState({
    pot: 15,
    currentBet: BIG_BLIND,
    currentPlayerIndex: 3,
    deck: [],
    ...overrides,
  })
}

describe('betting', () => {
  describe('getValidActions', () => {
    test('should always include fold', () => {
      // Given: 任意の状態
      const state = createTestState()

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: フォールドが含まれる
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).toContain('fold')
    })

    test('should include check when player bet matches currentBet', () => {
      // Given: プレイヤーのベットがcurrentBetと同額の状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: 10,
        })
      )
      const state = createTestState({ players, currentBet: 10 })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 0)

      // Then: チェックが含まれる
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).toContain('check')
    })

    test('should include call when currentBet exceeds player bet', () => {
      // Given: currentBetがプレイヤーのベットより大きい状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: i === 3 ? 0 : 10,
        })
      )
      const state = createTestState({ players, currentBet: 10 })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: コールが含まれる
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).toContain('call')
    })

    test('should include raise when currentBet exceeds player bet', () => {
      // Given: currentBetがプレイヤーのベットより大きい状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: i === 3 ? 0 : 10,
        })
      )
      const state = createTestState({ players, currentBet: 10 })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: レイズが含まれる
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).toContain('raise')
    })

    test('should include bet when currentBet is 0', () => {
      // Given: currentBetが0の状態（ポストフロップ開始時）
      const state = createTestState({ currentBet: 0 })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 0)

      // Then: ベットが含まれる
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).toContain('bet')
    })

    test('should not include bet when currentBet is greater than 0', () => {
      // Given: currentBetが0より大きい状態
      const state = createTestState({ currentBet: 10 })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: ベットが含まれない
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).not.toContain('bet')
    })

    test('should not include check when currentBet exceeds player bet', () => {
      // Given: currentBetがプレイヤーのベットより大きい
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: 0,
        })
      )
      const state = createTestState({ players, currentBet: 10 })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 0)

      // Then: チェックが含まれない
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).not.toContain('check')
    })
  })

  describe('applyAction', () => {
    test('should set folded to true on fold action', () => {
      // Given: フォールドしていないプレイヤー
      const state = createTestState({ currentPlayerIndex: 3 })

      // When: フォールドアクションを適用する
      const result = applyAction(state, 3, { type: 'fold' })

      // Then: プレイヤーがフォールドされる
      expect(result.players[3].folded).toBe(true)
    })

    test('should not change pot on check action', () => {
      // Given: currentBetが0でチェック可能な状態
      const state = createTestState({ currentBet: 0, currentPlayerIndex: 0 })

      // When: チェックアクションを適用する
      const result = applyAction(state, 0, { type: 'check' })

      // Then: ポットが変わらない
      expect(result.pot).toBe(state.pot)
    })

    test('should move difference to pot on call action', () => {
      // Given: currentBetが10でプレイヤーのベットが0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: i === 3 ? 0 : 10,
        })
      )
      const state = createTestState({
        players,
        currentBet: 10,
        pot: 15,
        currentPlayerIndex: 3,
      })

      // When: コールアクションを適用する
      const result = applyAction(state, 3, { type: 'call' })

      // Then: 差額がポットに追加され、チップが減る
      expect(result.pot).toBe(25)
      expect(result.players[3].chips).toBe(990)
      expect(result.players[3].currentBetInRound).toBe(10)
    })

    test('should update currentBet and lastAggressorIndex on bet', () => {
      // Given: currentBetが0の状態
      const state = createTestState({
        currentBet: 0,
        pot: 0,
        currentPlayerIndex: 0,
      })

      // When: ベットアクションを適用する
      const result = applyAction(state, 0, { type: 'bet', amount: 20 })

      // Then: currentBetとlastAggressorIndexが更新される
      expect(result.currentBet).toBe(20)
      expect(result.lastAggressorIndex).toBe(0)
      expect(result.pot).toBe(20)
      expect(result.players[0].chips).toBe(980)
    })

    test('should update currentBet and lastAggressorIndex on raise', () => {
      // Given: currentBetが10の状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: i === 3 ? 0 : 10,
        })
      )
      const state = createTestState({
        players,
        currentBet: 10,
        pot: 15,
        currentPlayerIndex: 3,
      })

      // When: レイズアクションを適用する
      const result = applyAction(state, 3, { type: 'raise', amount: 30 })

      // Then: currentBetが30に更新される
      expect(result.currentBet).toBe(30)
      expect(result.lastAggressorIndex).toBe(3)
      expect(result.players[3].chips).toBe(970)
      expect(result.players[3].currentBetInRound).toBe(30)
    })

    test('should handle all-in when chips insufficient for call', () => {
      // Given: コールに必要なチップが足りないプレイヤー
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? 5 : 1000,
          currentBetInRound: i === 3 ? 0 : 10,
        })
      )
      const state = createTestState({
        players,
        currentBet: 10,
        pot: 15,
        currentPlayerIndex: 3,
      })

      // When: コールアクションを適用する（5チップしかないがcurrentBet=10）
      const result = applyAction(state, 3, { type: 'call' })

      // Then: 持っている全チップをベットしてオールイン
      expect(result.players[3].chips).toBe(0)
      expect(result.players[3].currentBetInRound).toBe(5)
    })

    test('should throw on invalid action', () => {
      // Given: checkできない状態（currentBetがプレイヤーのベットより大きい）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: 0,
        })
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 0,
      })

      // When/Then: 無効なcheckアクションでエラーが発生する
      expect(() => applyAction(state, 0, { type: 'check' })).toThrow()
    })

    test('should not mutate original state', () => {
      // Given: 初期状態
      const state = createTestState({ currentPlayerIndex: 3 })
      const originalPot = state.pot
      const originalChips = state.players[3].chips

      // When: アクションを適用する
      applyAction(state, 3, { type: 'fold' })

      // Then: 元の状態は変更されていない
      expect(state.pot).toBe(originalPot)
      expect(state.players[3].chips).toBe(originalChips)
      expect(state.players[3].folded).toBe(false)
    })
  })

  describe('isBettingRoundComplete', () => {
    test('should return true when all non-folded players have equal bets and aggressor is reached', () => {
      // Given: 全員がベットを揃え、aggressorに戻った状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: 10,
        })
      )
      const state = createTestState({
        players,
        currentBet: 10,
        lastAggressorIndex: 2,
        currentPlayerIndex: 2,
      })

      // When: ラウンド完了を判定する
      const result = isBettingRoundComplete(state)

      // Then: 完了している
      expect(result).toBe(true)
    })

    test('should return false when not all players have acted', () => {
      // Given: まだベット額が揃っていない
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: i < 3 ? 10 : 0,
        })
      )
      const state = createTestState({
        players,
        currentBet: 10,
        lastAggressorIndex: 0,
        currentPlayerIndex: 3,
      })

      // When: ラウンド完了を判定する
      const result = isBettingRoundComplete(state)

      // Then: 未完了
      expect(result).toBe(false)
    })

    test('should return true when no aggressor and all have checked or folded', () => {
      // Given: 全員チェック（aggressorなし）の状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: 0,
        })
      )
      const state = createTestState({
        players,
        currentBet: 0,
        lastAggressorIndex: null,
        currentPlayerIndex: 0,
      })

      // When: ラウンド完了を判定する
      const result = isBettingRoundComplete(state)

      // Then: 完了している
      expect(result).toBe(true)
    })

    test('should handle folded players correctly', () => {
      // Given: 一部のプレイヤーがフォールドし、残りはベット一致
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: i === 2 ? 0 : 10,
          folded: i === 2,
        })
      )
      const state = createTestState({
        players,
        currentBet: 10,
        lastAggressorIndex: 0,
        currentPlayerIndex: 0,
      })

      // When: ラウンド完了を判定する
      const result = isBettingRoundComplete(state)

      // Then: フォールドしたプレイヤーを除外して判定→完了
      expect(result).toBe(true)
    })

    test('should return true when only one player remains (all others folded)', () => {
      // Given: 1人以外全員フォールド
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          folded: i !== 0,
        })
      )
      const state = createTestState({
        players,
        currentBet: 0,
        lastAggressorIndex: null,
        currentPlayerIndex: 0,
      })

      // When: ラウンド完了を判定する
      const result = isBettingRoundComplete(state)

      // Then: 完了している
      expect(result).toBe(true)
    })
  })

  describe('getNextActivePlayerIndex', () => {
    test('should return next non-folded player', () => {
      // Given: index 1がフォールドしている
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          folded: i === 1,
        })
      )
      const state = createTestState({ players })

      // When: index 0の次のアクティブプレイヤーを探す
      const next = getNextActivePlayerIndex(state, 0)

      // Then: index 2が返る（index 1はスキップ）
      expect(next).toBe(2)
    })

    test('should wrap around to beginning', () => {
      // Given: 5人のプレイヤー
      const state = createTestState()

      // When: index 4の次のアクティブプレイヤーを探す
      const next = getNextActivePlayerIndex(state, 4)

      // Then: index 0が返る
      expect(next).toBe(0)
    })

    test('should skip all-in players (chips = 0)', () => {
      // Given: index 1がオールインしている
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 1 ? 0 : 1000,
        })
      )
      const state = createTestState({ players })

      // When: index 0の次のアクティブプレイヤーを探す
      const next = getNextActivePlayerIndex(state, 0)

      // Then: index 2が返る（index 1はスキップ）
      expect(next).toBe(2)
    })

    test('should skip multiple folded and all-in players', () => {
      // Given: index 1, 2がフォールド、index 3がオールイン
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          folded: i === 1 || i === 2,
          chips: i === 3 ? 0 : 1000,
        })
      )
      const state = createTestState({ players })

      // When: index 0の次のアクティブプレイヤーを探す
      const next = getNextActivePlayerIndex(state, 0)

      // Then: index 4が返る
      expect(next).toBe(4)
    })
  })
})
