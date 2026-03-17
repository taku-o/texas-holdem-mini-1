import { describe, expect, test } from 'vitest'
import {
  getValidActions,
  applyAction,
  isBettingRoundComplete,
} from './betting'
import { BIG_BLIND } from './constants'
import type { GameState } from './types'
import { createTestPlayer, createTestState as createBaseTestState } from './testHelpers'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return createBaseTestState({
    pot: 15,
    currentBet: BIG_BLIND,
    currentPlayerIndex: 3,
    deck: [],
    ...overrides,
  })
}

describe('betting validation (task 1)', () => {
  describe('getValidActions - chip-based filtering (1.2)', () => {
    test('should not include bet when player chips are less than BIG_BLIND', () => {
      // Given: チップがBIG_BLIND未満のプレイヤー（currentBet=0）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 0 ? BIG_BLIND - 1 : 1000,
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 0,
        currentPlayerIndex: 0,
      })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 0)

      // Then: betが含まれない
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).not.toContain('bet')
    })

    test('should include bet when player chips equal BIG_BLIND', () => {
      // Given: チップがBIG_BLINDちょうどのプレイヤー（currentBet=0）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 0 ? BIG_BLIND : 1000,
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 0,
        currentPlayerIndex: 0,
      })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 0)

      // Then: betが含まれる
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).toContain('bet')
    })

    test('should not include raise when player chips equal callAmount exactly', () => {
      // Given: コール額ちょうどしかチップがないプレイヤー
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? 10 : 1000,
          currentBetInRound: i === 3 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 3,
      })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: raiseが含まれない（コールのみ）
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).toContain('call')
      expect(actionTypes).not.toContain('raise')
    })

    test('should include raise when player has more chips than callAmount', () => {
      // Given: コール額を超えるチップがあるプレイヤー
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? 100 : 1000,
          currentBetInRound: i === 3 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 3,
      })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: raiseが含まれる
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).toContain('raise')
    })

    test('should not include raise when player cannot afford minimum raise', () => {
      // Given: コール額+最低レイズ額に足りないチップのプレイヤー
      // currentBet=10, minRaise=currentBet+BIG_BLIND=20
      // callAmount=10, 必要チップ=minRaise-currentBetInRound=20
      // chips=15 → コール後の残り=5 < BIG_BLIND
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? 15 : 1000,
          currentBetInRound: i === 3 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 3,
      })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: raiseが含まれない
      const actionTypes = actions.map((a) => a.type)
      expect(actionTypes).not.toContain('raise')
    })
  })

  describe('getValidActions - min/max range (1.4)', () => {
    test('should return min and max for bet action', () => {
      // Given: currentBet=0でベット可能な状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: 500,
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 0,
        currentPlayerIndex: 0,
      })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 0)

      // Then: betアクションにmin=BIG_BLIND, max=player.chipsが付与される
      const betAction = actions.find((a) => a.type === 'bet')
      expect(betAction).toBeDefined()
      expect(betAction!.min).toBe(BIG_BLIND)
      expect(betAction!.max).toBe(500)
    })

    test('should return min and max for raise action', () => {
      // Given: currentBet=10でレイズ可能な状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? 500 : 1000,
          currentBetInRound: i === 3 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 3,
      })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: raiseアクションにmin=currentBet+BIG_BLIND, max=currentBetInRound+chipsが付与される
      const raiseAction = actions.find((a) => a.type === 'raise')
      expect(raiseAction).toBeDefined()
      expect(raiseAction!.min).toBe(10 + BIG_BLIND)
      expect(raiseAction!.max).toBe(0 + 500)
    })

    test('should not have min/max for fold action', () => {
      // Given: 任意の状態
      const state = createTestState()

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: foldにmin/maxが無い
      const foldAction = actions.find((a) => a.type === 'fold')
      expect(foldAction).toBeDefined()
      expect(foldAction!.min).toBeUndefined()
      expect(foldAction!.max).toBeUndefined()
    })

    test('should not have min/max for call action', () => {
      // Given: コールが必要な状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: i === 3 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 3,
      })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: callにmin/maxが無い
      const callAction = actions.find((a) => a.type === 'call')
      expect(callAction).toBeDefined()
      expect(callAction!.min).toBeUndefined()
      expect(callAction!.max).toBeUndefined()
    })

    test('should not have min/max for check action', () => {
      // Given: チェック可能な状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          currentBetInRound: 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 0,
      })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 0)

      // Then: checkにmin/maxが無い
      const checkAction = actions.find((a) => a.type === 'check')
      expect(checkAction).toBeDefined()
      expect(checkAction!.min).toBeUndefined()
      expect(checkAction!.max).toBeUndefined()
    })
  })

  describe('getValidActions - cross-field invariant (discriminated union)', () => {
    test('should return bet/raise with min/max and fold/check/call without', () => {
      // Given: ベットもレイズも可能な状態を用意する
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: 500,
          currentBetInRound: i === 3 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 3,
      })

      // When: 有効なアクションを取得する
      const actions = getValidActions(state, 3)

      // Then: fold/call にはmin/maxプロパティが存在しない
      for (const action of actions) {
        if (action.type === 'fold' || action.type === 'check' || action.type === 'call') {
          expect('min' in action).toBe(false)
          expect('max' in action).toBe(false)
        }
      }

      // Then: raise にはmin/maxが数値で存在する
      const raiseAction = actions.find((a) => a.type === 'raise')
      expect(raiseAction).toBeDefined()
      if (raiseAction && raiseAction.type === 'raise') {
        expect(typeof raiseAction.min).toBe('number')
        expect(typeof raiseAction.max).toBe('number')
        expect(raiseAction.min).toBeLessThanOrEqual(raiseAction.max)
      }
    })
  })

  describe('applyAction - amount validation (1.1)', () => {
    test('should throw when bet amount exceeds player chips', () => {
      // Given: チップが100のプレイヤーでcurrentBet=0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 0 ? 100 : 1000,
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 0,
        currentPlayerIndex: 0,
      })

      // When/Then: チップを超えるベット額でエラー
      expect(() =>
        applyAction(state, 0, { type: 'bet', amount: 150 }),
      ).toThrow()
    })

    test('should throw when bet amount is below BIG_BLIND and not all-in', () => {
      // Given: チップが十分あるプレイヤー
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: 1000,
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 0,
        currentPlayerIndex: 0,
      })

      // When/Then: BIG_BLIND未満のベットでエラー
      expect(() =>
        applyAction(state, 0, { type: 'bet', amount: BIG_BLIND - 1 }),
      ).toThrow()
    })

    test('should allow bet amount equal to BIG_BLIND', () => {
      // Given: チップが十分あるプレイヤー
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: 1000,
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 0,
        currentPlayerIndex: 0,
      })

      // When: BIG_BLINDちょうどのベット
      const result = applyAction(state, 0, { type: 'bet', amount: BIG_BLIND })

      // Then: 正常に適用される
      expect(result.currentBet).toBe(BIG_BLIND)
      expect(result.players[0].chips).toBe(1000 - BIG_BLIND)
    })

    test('should throw when raise amount exceeds player chips', () => {
      // Given: チップが50のプレイヤー、currentBet=10
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? 50 : 1000,
          currentBetInRound: i === 3 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 3,
      })

      // When/Then: チップを超えるレイズ額でエラー
      // raiseAmount = 60 - 0 = 60 > 50 chips
      expect(() =>
        applyAction(state, 3, { type: 'raise', amount: 60 }),
      ).toThrow()
    })

    test('should throw when raise is below minimum raise and not all-in', () => {
      // Given: チップが十分あるプレイヤー、currentBet=10
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? 1000 : 1000,
          currentBetInRound: i === 3 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 3,
      })

      // When/Then: 最小レイズ(currentBet+BIG_BLIND=20)未満のレイズでエラー
      expect(() =>
        applyAction(state, 3, { type: 'raise', amount: 15 }),
      ).toThrow()
    })

    test('should allow raise at minimum raise amount', () => {
      // Given: チップが十分あるプレイヤー、currentBet=10
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? 1000 : 1000,
          currentBetInRound: i === 3 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 3,
      })

      // When: 最小レイズ額(currentBet+BIG_BLIND=20)でレイズ
      const minRaise = 10 + BIG_BLIND
      const result = applyAction(state, 3, { type: 'raise', amount: minRaise })

      // Then: 正常に適用される
      expect(result.currentBet).toBe(minRaise)
    })

  })

  describe('isBettingRoundComplete - all-in aggressor (1.3)', () => {
    test('should return true when lastAggressor is all-in and all active players match currentBet', () => {
      // Given: lastAggressorがオールイン（chips=0）で、残りの全プレイヤーがcurrentBetに揃っている
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 2 ? 0 : 990,
          currentBetInRound: 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        lastAggressorIndex: 2,
        currentPlayerIndex: 3,
      })

      // When: ラウンド完了を判定する
      const result = isBettingRoundComplete(state)

      // Then: 完了している（lastAggressorがオールインでも、全員がcurrentBetに揃っていれば終了）
      expect(result).toBe(true)
    })

    test('should return false when lastAggressor is all-in but some active players have not matched currentBet', () => {
      // Given: lastAggressorがオールイン、一部のアクティブプレイヤーがcurrentBet未達
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 2 ? 0 : 990,
          currentBetInRound: i === 4 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        lastAggressorIndex: 2,
        currentPlayerIndex: 4,
      })

      // When: ラウンド完了を判定する
      const result = isBettingRoundComplete(state)

      // Then: 未完了（player-4がまだcurrentBetに揃っていない）
      expect(result).toBe(false)
    })

    test('should return true when lastAggressor is active and currentPlayer reaches aggressor', () => {
      // Given: lastAggressorがアクティブ（chips > 0）で、順番がaggressorに戻った
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: 990,
          currentBetInRound: 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        lastAggressorIndex: 2,
        currentPlayerIndex: 2,
      })

      // When: ラウンド完了を判定する
      const result = isBettingRoundComplete(state)

      // Then: 完了している（既存動作と同じ）
      expect(result).toBe(true)
    })

    test('should treat all-in players as having matched currentBet for round completion', () => {
      // Given: lastAggressorがオールイン、別のプレイヤーもオールイン（currentBet未達だがchips=0）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 2 || i === 4 ? 0 : 990,
          currentBetInRound: i === 4 ? 5 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        lastAggressorIndex: 2,
        currentPlayerIndex: 3,
      })

      // When: ラウンド完了を判定する
      const result = isBettingRoundComplete(state)

      // Then: 完了（player-4はcurrentBet未達だがオールインなのでOK、他は全員currentBet以上）
      expect(result).toBe(true)
    })

    test('should handle scenario where aggressor goes all-in with a raise', () => {
      // Given: 3人プレイ。player-1がレイズ&オールイン（chips=0）、player-2がコール済み、player-0がコール済み
      const players = [
        createTestPlayer({ id: 'player-0', chips: 970, currentBetInRound: 30 }),
        createTestPlayer({ id: 'player-1', chips: 0, currentBetInRound: 30 }),
        createTestPlayer({ id: 'player-2', chips: 970, currentBetInRound: 30 }),
        createTestPlayer({ id: 'player-3', folded: true, currentBetInRound: 0 }),
        createTestPlayer({ id: 'player-4', folded: true, currentBetInRound: 0 }),
      ]
      const state = createTestState({
        players,
        currentBet: 30,
        lastAggressorIndex: 1,
        currentPlayerIndex: 0,
      })

      // When: ラウンド完了を判定する
      const result = isBettingRoundComplete(state)

      // Then: 完了（全アクティブプレイヤーがcurrentBetに揃い、aggressorはオールイン）
      expect(result).toBe(true)
    })
  })

  describe('applyAction - rejects actions not in getValidActions (regression: dead-code)', () => {
    test('should throw when bet is attempted with chips below BIG_BLIND', () => {
      // Given: チップがBIG_BLIND未満のプレイヤー（betはgetValidActionsに含まれない）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 0 ? BIG_BLIND - 1 : 1000,
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 0,
        currentPlayerIndex: 0,
      })

      // When/Then: getValidActionsにbetが含まれないため、applyActionはthrowする
      const actions = getValidActions(state, 0)
      expect(actions.map((a) => a.type)).not.toContain('bet')
      expect(() =>
        applyAction(state, 0, { type: 'bet', amount: BIG_BLIND - 1 }),
      ).toThrow('Invalid action')
    })

    test('should throw when raise is attempted with insufficient chips for minimum raise', () => {
      // Given: 最小レイズに足りないチップのプレイヤー（raiseはgetValidActionsに含まれない）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 3 ? 15 : 1000,
          currentBetInRound: i === 3 ? 0 : 10,
        }),
      )
      const state = createTestState({
        players,
        currentBet: 10,
        currentPlayerIndex: 3,
      })

      // When/Then: getValidActionsにraiseが含まれないため、applyActionはthrowする
      const actions = getValidActions(state, 3)
      expect(actions.map((a) => a.type)).not.toContain('raise')
      expect(() =>
        applyAction(state, 3, { type: 'raise', amount: 15 }),
      ).toThrow('Invalid action')
    })
  })
})
