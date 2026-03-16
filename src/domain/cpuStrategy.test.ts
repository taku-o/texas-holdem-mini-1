import { describe, expect, test } from 'vitest'
import { decideAction } from './cpuStrategy'
import { getValidActions } from './betting'
import { BIG_BLIND } from './constants'
import type { GameState, PlayerAction } from './types'
import { card, createTestPlayer, createTestState as createBaseTestState } from './testHelpers'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return createBaseTestState({
    pot: 15,
    currentBet: BIG_BLIND,
    currentPlayerIndex: 1,
    deck: [],
    ...overrides,
  })
}

// randomFn that always returns a fixed value
const alwaysLow = () => 0.1
const alwaysMid = () => 0.5
const alwaysHigh = () => 0.9

describe('decideAction', () => {
  describe('返すアクションは常にgetValidActionsに含まれる', () => {
    test('should return an action included in getValidActions for preflop', () => {
      // Given: プリフロップの状態
      const state = createTestState({ phase: 'preflop' })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: 返されたアクションはgetValidActionsに含まれる
      const validActions = getValidActions(state, 1)
      const validTypes = validActions.map((a) => a.type)
      expect(validTypes).toContain(action.type)
    })

    test('should return an action included in getValidActions for flop', () => {
      // Given: フロップの状態
      const state = createTestState({
        phase: 'flop',
        communityCards: [
          card('2', 'clubs'),
          card('7', 'diamonds'),
          card('J', 'hearts'),
        ],
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: 返されたアクションはgetValidActionsに含まれる
      const validActions = getValidActions(state, 1)
      const validTypes = validActions.map((a) => a.type)
      expect(validTypes).toContain(action.type)
    })
  })

  describe('プリフロップのハンド強度評価', () => {
    test('should play aggressively with a pocket pair of high cards', () => {
      // Given: ポケットペア（AA）を持つCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: 積極的なアクション（call/raise）を選択する
      expect(['call', 'raise']).toContain(action.type)
    })

    test('should play aggressively with high suited cards', () => {
      // Given: 高ランクのスーテッド（AKs）を持つCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('K', 'spades')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: 積極的なアクション（call/raise）を選択する
      expect(['call', 'raise']).toContain(action.type)
    })

    test('should tend to fold or check with weak hole cards', () => {
      // Given: 弱いホールカード（2♣ 7♦ オフスーテッド）を持つCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('2', 'clubs'), card('7', 'diamonds')]
              : [card('A', 'spades'), card('K', 'hearts')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（高い乱数＝消極的寄り）
      const action = decideAction(state, 1, alwaysHigh)

      // Then: パッシブなアクション（fold/call）を選択する
      expect(['fold', 'call']).toContain(action.type)
    })
  })

  describe('ポストフロップのハンド強度評価', () => {
    test('should play aggressively with three-of-a-kind or better', () => {
      // Given: スリーカード（AAA）を持つCPU（フロップ）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('A', 'diamonds'),
          card('5', 'clubs'),
          card('9', 'hearts'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: 積極的なアクション（bet/raise）を選択する
      expect(['bet', 'raise']).toContain(action.type)
    })

    test('should tend to call or check with one-pair', () => {
      // Given: ワンペアを持つCPU（フロップ）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('J', 'spades'), card('9', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('J', 'diamonds'),
          card('5', 'clubs'),
          card('2', 'hearts'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（中程度の乱数）
      const action = decideAction(state, 1, alwaysMid)

      // Then: call/check/betのいずれかを選択する（mediumなので攻撃的すぎない）
      expect(['check', 'call', 'bet']).toContain(action.type)
    })

    test('should tend to fold or check with high-card only', () => {
      // Given: ハイカードのみのCPU（フロップ）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('3', 'clubs'), card('7', 'diamonds')]
              : [card('A', 'spades'), card('K', 'hearts')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('J', 'hearts'),
          card('9', 'spades'),
          card('2', 'diamonds'),
        ],
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（高い乱数＝消極的寄り）
      const action = decideAction(state, 1, alwaysHigh)

      // Then: パッシブなアクション（fold/call）を選択する
      expect(['fold', 'call']).toContain(action.type)
    })
  })

  describe('ベット・レイズ額', () => {
    test('should set amount on bet action based on BIG_BLIND multiples', () => {
      // Given: ベット可能な状態（currentBet=0）でstrong handを持つCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('A', 'diamonds'),
          card('5', 'clubs'),
          card('9', 'hearts'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: betを選択し、BIG_BLINDの倍数でamountが設定される
      if (action.type === 'bet') {
        expect(action.amount).toBeDefined()
        expect(action.amount! % BIG_BLIND).toBe(0)
        expect(action.amount!).toBeGreaterThanOrEqual(BIG_BLIND)
      }
    })

    test('should set amount on raise action', () => {
      // Given: レイズ可能な状態でstrong handを持つCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（low乱数＝積極的寄り）
      const action = decideAction(state, 1, alwaysLow)

      // Then: raise時はamountが設定されている
      if (action.type === 'raise') {
        expect(action.amount).toBeDefined()
        expect(action.amount!).toBeGreaterThan(state.currentBet)
      }
    })

    test('should not exceed player chips for bet amount', () => {
      // Given: チップが少ないCPUでstrong hand
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 1 ? 15 : 1000,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('A', 'diamonds'),
          card('5', 'clubs'),
          card('9', 'hearts'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: bet/raise額がプレイヤーのチップを超えない
      if (action.type === 'bet' || action.type === 'raise') {
        expect(action.amount).toBeDefined()
        expect(action.amount!).toBeLessThanOrEqual(15)
      }
    })
  })

  describe('checkが可能な場合', () => {
    test('should prefer check over fold with weak hand when no bet required', () => {
      // Given: currentBet=0で弱いハンドのCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('2', 'clubs'), card('7', 'diamonds')]
              : [card('A', 'spades'), card('K', 'hearts')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('J', 'hearts'),
          card('9', 'spades'),
          card('4', 'diamonds'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（高い乱数＝消極的）
      const action = decideAction(state, 1, alwaysHigh)

      // Then: フォールドではなくチェックを選択する（タダで見られるのにフォールドしない）
      expect(action.type).not.toBe('fold')
      expect(['check', 'bet']).toContain(action.type)
    })
  })

  describe('fold/call判定', () => {
    test('should fold with weak hand when facing a high bet', () => {
      // Given: 大きなベットに直面している弱いハンドのCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('2', 'clubs'), card('7', 'diamonds')]
              : [card('A', 'spades'), card('K', 'hearts')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('J', 'hearts'),
          card('9', 'spades'),
          card('4', 'diamonds'),
        ],
        currentBet: BIG_BLIND * 5,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（高い乱数＝消極的）
      const action = decideAction(state, 1, alwaysHigh)

      // Then: フォールドを選択する
      expect(action.type).toBe('fold')
    })
  })

  describe('randomFnによる挙動の違い', () => {
    test('should produce deterministic results with same randomFn', () => {
      // Given: 同じ状態と同じrandomFn
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('Q', 'spades'), card('J', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: 同じrandomFnで2回呼び出す
      const action1 = decideAction(state, 1, alwaysMid)
      const action2 = decideAction(state, 1, alwaysMid)

      // Then: 同じ結果が返る
      expect(action1.type).toBe(action2.type)
      expect(action1.amount).toBe(action2.amount)
    })

    test('should potentially produce different actions with different randomFn values', () => {
      // Given: medium strengthのハンド（ランダム性が反映される状況）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('Q', 'spades'), card('J', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: 異なるrandomFnで呼び出す
      const actionLow = decideAction(state, 1, alwaysLow)
      const actionHigh = decideAction(state, 1, alwaysHigh)

      // Then: 両方とも有効なアクション（型の違いがあり得る）
      const validTypes = getValidActions(state, 1).map((a) => a.type)
      expect(validTypes).toContain(actionLow.type)
      expect(validTypes).toContain(actionHigh.type)
    })
  })

  describe('amountフィールドの存在', () => {
    test('should not include amount for fold action', () => {
      // Given: フォールドを選択する状況（弱いハンド+大きなベット）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('2', 'clubs'), card('7', 'diamonds')]
              : [card('A', 'spades'), card('K', 'hearts')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('J', 'hearts'),
          card('9', 'spades'),
          card('4', 'diamonds'),
        ],
        currentBet: BIG_BLIND * 5,
        currentPlayerIndex: 1,
      })

      // When: CPUがフォールドを決定する
      const action = decideAction(state, 1, alwaysHigh)

      // Then: foldの場合amountは不要
      if (action.type === 'fold') {
        expect(action.amount).toBeUndefined()
      }
    })

    test('should not include amount for check action', () => {
      // Given: チェックを選択する状況
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('2', 'clubs'), card('7', 'diamonds')]
              : [card('A', 'spades'), card('K', 'hearts')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('J', 'hearts'),
          card('9', 'spades'),
          card('4', 'diamonds'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（高い乱数＝消極的）
      const action = decideAction(state, 1, alwaysHigh)

      // Then: checkの場合amountは不要
      if (action.type === 'check') {
        expect(action.amount).toBeUndefined()
      }
    })

    test('should not include amount for call action', () => {
      // Given: コールを選択する状況（medium hand）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('Q', 'spades'), card('J', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（中程度の乱数）
      const action = decideAction(state, 1, alwaysMid)

      // Then: callの場合amountは不要
      if (action.type === 'call') {
        expect(action.amount).toBeUndefined()
      }
    })

    test('should include amount for bet action', () => {
      // Given: ベット可能な状態でstrong hand
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('A', 'diamonds'),
          card('5', 'clubs'),
          card('9', 'hearts'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: bet時はamountが必ず設定されている
      if (action.type === 'bet') {
        expect(action.amount).toBeDefined()
        expect(action.amount!).toBeGreaterThan(0)
      }
    })

    test('should include amount for raise action', () => {
      // Given: レイズ可能な状態でstrong hand
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（low乱数＝積極的）
      const action = decideAction(state, 1, alwaysLow)

      // Then: raise時はamountが必ず設定され、currentBetより大きい
      if (action.type === 'raise') {
        expect(action.amount).toBeDefined()
        expect(action.amount!).toBeGreaterThan(state.currentBet)
      }
    })
  })

  describe('ターン・リバーでの評価', () => {
    test('should evaluate hand with 4 community cards on turn', () => {
      // Given: ターンの状態（コミュニティカード4枚）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'turn',
        players,
        communityCards: [
          card('A', 'diamonds'),
          card('5', 'clubs'),
          card('9', 'hearts'),
          card('K', 'spades'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: 有効なアクションが返される
      const validTypes = getValidActions(state, 1).map((a) => a.type)
      expect(validTypes).toContain(action.type)
    })

    test('should evaluate hand with 5 community cards on river', () => {
      // Given: リバーの状態（コミュニティカード5枚）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'river',
        players,
        communityCards: [
          card('A', 'diamonds'),
          card('5', 'clubs'),
          card('9', 'hearts'),
          card('K', 'spades'),
          card('Q', 'diamonds'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: strongなhand（スリーカード）で積極的なアクション
      expect(['bet', 'raise']).toContain(action.type)
    })
  })

  describe('bet/raiseアクションのamount有効範囲', () => {
    test('should return bet amount within valid range from getValidActions', () => {
      // Given: ベット可能な状態でstrong handを持つCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('A', 'diamonds'),
          card('5', 'clubs'),
          card('9', 'hearts'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: bet時はamountがBIG_BLIND以上かつプレイヤーチップ以下
      if (action.type === 'bet') {
        expect(action.amount).toBeGreaterThanOrEqual(BIG_BLIND)
        expect(action.amount!).toBeLessThanOrEqual(state.players[1].chips)
      }
    })

    test('should return raise amount greater than current bet and within player chips', () => {
      // Given: レイズ可能な状態でstrong handを持つCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する（low乱数＝積極的）
      const action = decideAction(state, 1, alwaysLow)

      // Then: raise時はamountがcurrentBetより大きくプレイヤーチップ以下
      if (action.type === 'raise') {
        expect(action.amount!).toBeGreaterThan(state.currentBet)
        expect(action.amount!).toBeLessThanOrEqual(
          state.players[1].chips + state.players[1].currentBetInRound,
        )
      }
    })

    test('should clamp bet amount to player chips when chips are limited', () => {
      // Given: 少ないチップのCPU（BIG_BLIND * 3 = 30）でstrong hand
      const limitedChips = BIG_BLIND * 3
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 1 ? limitedChips : 1000,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'flop',
        players,
        communityCards: [
          card('A', 'diamonds'),
          card('5', 'clubs'),
          card('9', 'hearts'),
        ],
        currentBet: 0,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: bet/raise額がプレイヤーのチップを超えない
      if (action.type === 'bet' || action.type === 'raise') {
        expect(action.amount!).toBeLessThanOrEqual(limitedChips)
        expect(action.amount!).toBeGreaterThanOrEqual(BIG_BLIND)
      }
    })
  })

  describe('境界値・エッジケース', () => {
    test('should handle player with exactly BIG_BLIND chips', () => {
      // Given: ちょうどBIG_BLIND分のチップしかないCPU
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 1 ? BIG_BLIND : 1000,
          holeCards:
            i === 1
              ? [card('A', 'spades'), card('A', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: bet/raise額がチップを超えない
      if (action.type === 'bet' || action.type === 'raise') {
        expect(action.amount!).toBeLessThanOrEqual(BIG_BLIND)
      }
      // アクションが有効であること
      const validTypes = getValidActions(state, 1).map((a) => a.type)
      expect(validTypes).toContain(action.type)
    })

    test('should handle medium hand pocket pair', () => {
      // Given: 中程度のポケットペア（77）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards:
            i === 1
              ? [card('7', 'spades'), card('7', 'hearts')]
              : [card('2', 'clubs'), card('3', 'diamonds')],
          currentBetInRound: 0,
        }),
      )
      const state = createTestState({
        phase: 'preflop',
        players,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 1,
      })

      // When: CPUが行動を決定する
      const action = decideAction(state, 1, alwaysMid)

      // Then: フォールドしない（ペアはそれなりに価値がある）
      expect(action.type).not.toBe('fold')
    })
  })
})
