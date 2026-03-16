import { describe, expect, test } from 'vitest'
import {
  preparePreflopRound,
  advancePhase,
  startNextHand,
  isGameOver,
  getActivePlayerCount,
} from './handProgression'
import { INITIAL_CHIPS, BIG_BLIND, SMALL_BLIND } from './constants'
import type { GameState } from './types'
import { card, createTestPlayer, createTestState as createBaseTestState } from './testHelpers'

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return createBaseTestState({
    pot: 15,
    currentBet: BIG_BLIND,
    currentPlayerIndex: 3,
    ...overrides,
  })
}

describe('handProgression', () => {
  describe('preparePreflopRound', () => {
    test('should post blinds, deal hole cards, and set UTG as current player', () => {
      // Given: ディーラーがindex 0、ブラインド未投入の状態
      const state = createTestState({
        dealerIndex: 0,
        pot: 0,
        currentBet: 0,
        lastAggressorIndex: null,
      })

      // When: プリフロップ準備を実行する
      const result = preparePreflopRound(state)

      // Then: ブラインドが投入され、ホールカードが配られ、UTGが手番
      expect(result.pot).toBe(SMALL_BLIND + BIG_BLIND)
      expect(result.currentBet).toBe(BIG_BLIND)
      const bbIndex = (result.dealerIndex + 2) % result.players.length
      expect(result.lastAggressorIndex).toBe(bbIndex)
      expect(result.currentPlayerIndex).not.toBe(bbIndex)
      for (const player of result.players) {
        expect(player.holeCards).toHaveLength(2)
      }
    })

    test('should not mutate original state', () => {
      // Given: 初期状態
      const state = createTestState({ pot: 0, currentBet: 0 })
      const originalPot = state.pot

      // When: プリフロップ準備を実行する
      preparePreflopRound(state)

      // Then: 元の状態は変更されていない
      expect(state.pot).toBe(originalPot)
    })
  })

  describe('advancePhase', () => {
    test('should transition from preflop to flop with 3 community cards', () => {
      // Given: プリフロップ状態
      const state = createTestState({ phase: 'preflop' })

      // When: フェーズを進める
      const result = advancePhase(state)

      // Then: フロップになり3枚のコミュニティカードがある
      expect(result.phase).toBe('flop')
      expect(result.communityCards).toHaveLength(3)
    })

    test('should transition from flop to turn with 4 community cards', () => {
      // Given: フロップ状態（3枚のコミュニティカード）
      const state = createTestState({
        phase: 'flop',
        communityCards: [
          card('A', 'spades'),
          card('K', 'hearts'),
          card('Q', 'diamonds'),
        ],
      })

      // When: フェーズを進める
      const result = advancePhase(state)

      // Then: ターンになり4枚のコミュニティカードがある
      expect(result.phase).toBe('turn')
      expect(result.communityCards).toHaveLength(4)
    })

    test('should transition from turn to river with 5 community cards', () => {
      // Given: ターン状態（4枚のコミュニティカード）
      const state = createTestState({
        phase: 'turn',
        communityCards: [
          card('A', 'spades'),
          card('K', 'hearts'),
          card('Q', 'diamonds'),
          card('J', 'clubs'),
        ],
      })

      // When: フェーズを進める
      const result = advancePhase(state)

      // Then: リバーになり5枚のコミュニティカードがある
      expect(result.phase).toBe('river')
      expect(result.communityCards).toHaveLength(5)
    })

    test('should transition from river to showdown', () => {
      // Given: リバー状態（5枚のコミュニティカード）
      const state = createTestState({
        phase: 'river',
        communityCards: [
          card('A', 'spades'),
          card('K', 'hearts'),
          card('Q', 'diamonds'),
          card('J', 'clubs'),
          card('10', 'spades'),
        ],
      })

      // When: フェーズを進める
      const result = advancePhase(state)

      // Then: ショーダウンになる
      expect(result.phase).toBe('showdown')
    })

    test('should reset currentBet to 0 on phase advance', () => {
      // Given: currentBetが10のプリフロップ状態
      const state = createTestState({
        phase: 'preflop',
        currentBet: BIG_BLIND,
      })

      // When: フェーズを進める
      const result = advancePhase(state)

      // Then: currentBetが0にリセットされる
      expect(result.currentBet).toBe(0)
    })

    test('should reset player currentBetInRound to 0 on phase advance', () => {
      // Given: プレイヤーがベットしている状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          currentBetInRound: 10,
        })
      )
      const state = createTestState({ phase: 'preflop', players })

      // When: フェーズを進める
      const result = advancePhase(state)

      // Then: 各プレイヤーのcurrentBetInRoundが0にリセットされる
      for (const player of result.players) {
        expect(player.currentBetInRound).toBe(0)
      }
    })

    test('should reset lastAggressorIndex to null on phase advance', () => {
      // Given: lastAggressorIndexが設定されている状態
      const state = createTestState({
        phase: 'preflop',
        lastAggressorIndex: 2,
      })

      // When: フェーズを進める
      const result = advancePhase(state)

      // Then: lastAggressorIndexがnullにリセットされる
      expect(result.lastAggressorIndex).toBeNull()
    })

    test('should not mutate original state', () => {
      // Given: 初期状態
      const state = createTestState({ phase: 'preflop' })
      const originalPhase = state.phase
      const originalCommunityCards = [...state.communityCards]

      // When: フェーズを進める
      advancePhase(state)

      // Then: 元の状態は変更されていない
      expect(state.phase).toBe(originalPhase)
      expect(state.communityCards).toEqual(originalCommunityCards)
    })
  })

  describe('startNextHand', () => {
    test('should move dealer button to next active player', () => {
      // Given: ディーラーがindex 0
      const state = createTestState({ dealerIndex: 0 })

      // When: 次のハンドを開始する
      const result = startNextHand(state, () => 0.5)

      // Then: ディーラーが次のアクティブプレイヤーに移動する
      expect(result.dealerIndex).not.toBe(0)
    })

    test('should skip eliminated players when moving dealer', () => {
      // Given: index 1のチップが0（除外済み）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 1 ? 0 : 1000,
        })
      )
      const state = createTestState({ players, dealerIndex: 0 })

      // When: 次のハンドを開始する
      const result = startNextHand(state, () => 0.5)

      // Then: index 1をスキップしてindex 2がディーラーになる
      expect(result.dealerIndex).toBe(2)
    })

    test('should reset player hole cards and folded state', () => {
      // Given: プレイヤーがカードを持ちフォールドしている状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          holeCards: [card('A', 'spades'), card('K', 'hearts')],
          folded: i === 2,
          currentBetInRound: 10,
        })
      )
      const state = createTestState({ players })

      // When: 次のハンドを開始する
      const result = startNextHand(state, () => 0.5)

      // Then: ホールカードが新しく配られ、フォールド状態がリセットされる
      for (const player of result.players) {
        if (player.chips > 0) {
          expect(player.holeCards).toHaveLength(2)
          expect(player.folded).toBe(false)
          expect(player.currentBetInRound).toBeGreaterThanOrEqual(0)
        }
      }
    })

    test('should reset community cards', () => {
      // Given: コミュニティカードがある状態
      const state = createTestState({
        communityCards: [
          card('A', 'spades'),
          card('K', 'hearts'),
          card('Q', 'diamonds'),
        ],
      })

      // When: 次のハンドを開始する
      const result = startNextHand(state, () => 0.5)

      // Then: コミュニティカードが空になる
      expect(result.communityCards).toHaveLength(0)
    })

    test('should set phase to preflop', () => {
      // Given: ショーダウン後の状態
      const state = createTestState({ phase: 'showdown' })

      // When: 次のハンドを開始する
      const result = startNextHand(state, () => 0.5)

      // Then: フェーズがpreflopになる
      expect(result.phase).toBe('preflop')
    })

    test('should post blinds for new hand', () => {
      // Given: ショーダウン後の状態
      const state = createTestState({ phase: 'showdown', pot: 0 })

      // When: 次のハンドを開始する
      const result = startNextHand(state, () => 0.5)

      // Then: ブラインドが投入されている
      expect(result.pot).toBeGreaterThanOrEqual(SMALL_BLIND + BIG_BLIND)
      expect(result.currentBet).toBe(BIG_BLIND)
    })

    test('should not mutate original state', () => {
      // Given: 初期状態
      const state = createTestState()
      const originalDealerIndex = state.dealerIndex

      // When: 次のハンドを開始する
      startNextHand(state, () => 0.5)

      // Then: 元の状態は変更されていない
      expect(state.dealerIndex).toBe(originalDealerIndex)
    })

    test('should skip chip-0 player in blind positions', () => {
      // Given: ディーラーがindex 2で、SB位置（index 4）のプレイヤーのチップが0
      // getNextDealerIndex: 2→3(chips=1000)→dealer=3, SB=(3+1)%5=4, BB=(3+2)%5=0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 4 ? 0 : 1000,
        })
      )
      const state = createTestState({ players, dealerIndex: 2 })

      // When: 次のハンドを開始する
      const result = startNextHand(state, () => 0.5)

      // Then: ディーラーがindex 3に移動し、SB(index 4)のチップ0プレイヤーにブラインドが課されない
      expect(result.dealerIndex).toBe(3)
      expect(result.players[4].chips).toBe(0)
      expect(result.players[4].currentBetInRound).toBe(0)
      // BB(index 0)には正常にブラインドが課される
      expect(result.players[0].chips).toBe(1000 - BIG_BLIND)
      expect(result.players[0].currentBetInRound).toBe(BIG_BLIND)
    })

    test('should correctly assign dealer when consecutive players have 0 chips', () => {
      // Given: index 1, 2, 3 のチップが0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: (i >= 1 && i <= 3) ? 0 : 1000,
        })
      )
      const state = createTestState({ players, dealerIndex: 0 })

      // When: 次のハンドを開始する
      const result = startNextHand(state, () => 0.5)

      // Then: ディーラーがindex 4（次のチップ>0のプレイヤー）に移動する
      expect(result.dealerIndex).toBe(4)
    })
  })

  describe('isGameOver', () => {
    test('should return over when human player has 0 chips', () => {
      // Given: 人間プレイヤーのチップが0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 0 ? 0 : 1000,
        })
      )
      const state = createTestState({ players })

      // When: ゲーム終了を判定する
      const result = isGameOver(state)

      // Then: ゲームオーバー
      expect(result.over).toBe(true)
    })

    test('should return over when all CPUs have 0 chips', () => {
      // Given: 全CPUプレイヤーのチップが0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 0 ? 5000 : 0,
        })
      )
      const state = createTestState({ players })

      // When: ゲーム終了を判定する
      const result = isGameOver(state)

      // Then: ゲームオーバー
      expect(result.over).toBe(true)
    })

    test('should return not over during normal play', () => {
      // Given: 全員がチップを持っている通常の状態
      const state = createTestState()

      // When: ゲーム終了を判定する
      const result = isGameOver(state)

      // Then: ゲーム続行
      expect(result.over).toBe(false)
    })

    test('should return not over when human and at least one CPU have chips', () => {
      // Given: 人間と一部のCPUにチップがある
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i <= 1 ? 1000 : 0,
        })
      )
      const state = createTestState({ players })

      // When: ゲーム終了を判定する
      const result = isGameOver(state)

      // Then: ゲーム続行
      expect(result.over).toBe(false)
    })

    test('should include reason when game is over', () => {
      // Given: 人間プレイヤーのチップが0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 0 ? 0 : 1000,
        })
      )
      const state = createTestState({ players })

      // When: ゲーム終了を判定する
      const result = isGameOver(state)

      // Then: 理由が含まれる
      expect(result.reason).toBeDefined()
      expect(typeof result.reason).toBe('string')
    })
  })

  describe('advancePhase エラーケース', () => {
    test('should throw error when advancing from idle phase', () => {
      // Given: idle状態のゲーム
      const state = createTestState({ phase: 'idle' })

      // When/Then: advancePhaseを呼ぶとエラーがスローされる
      expect(() => advancePhase(state)).toThrow('Cannot advance from phase: idle')
    })

    test('should throw error when advancing from showdown phase', () => {
      // Given: showdown状態のゲーム
      const state = createTestState({ phase: 'showdown' })

      // When/Then: advancePhaseを呼ぶとエラーがスローされる
      expect(() => advancePhase(state)).toThrow('Cannot advance from phase: showdown')
    })
  })

  describe('getActivePlayerCount', () => {
    test('should return count of players with chips greater than 0', () => {
      // Given: 2人のチップが0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i < 3 ? 1000 : 0,
        })
      )
      const state = createTestState({ players })

      // When: アクティブプレイヤー数を取得する
      const count = getActivePlayerCount(state)

      // Then: 3人が返る
      expect(count).toBe(3)
    })

    test('should return total player count when all have chips', () => {
      // Given: 全員がチップを持っている
      const state = createTestState()

      // When: アクティブプレイヤー数を取得する
      const count = getActivePlayerCount(state)

      // Then: 5人が返る
      expect(count).toBe(5)
    })

    test('should return 1 when only one player has chips', () => {
      // Given: 1人だけがチップを持っている
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 0 ? 5000 : 0,
        })
      )
      const state = createTestState({ players })

      // When: アクティブプレイヤー数を取得する
      const count = getActivePlayerCount(state)

      // Then: 1人が返る
      expect(count).toBe(1)
    })
  })
})
