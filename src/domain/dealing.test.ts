import { describe, expect, test } from 'vitest'
import { findNextEligibleIndex, postBlinds, dealHoleCards, dealCommunityCards } from './dealing'
import { SMALL_BLIND, BIG_BLIND } from './constants'
import type { GameState, Player } from './types'
import { card, createTestPlayer as createBaseTestPlayer, createTestState as createBaseTestState } from './testHelpers'

function createTestPlayer(overrides: Partial<Player> = {}) {
  return createBaseTestPlayer({ holeCards: [], ...overrides })
}

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return createBaseTestState({
    players: Array.from({ length: 5 }, (_, i) =>
      createTestPlayer({ id: `player-${i}` })
    ),
    ...overrides,
  })
}

describe('dealing', () => {
  describe('postBlinds', () => {
    test('should deduct SB from player left of dealer', () => {
      // Given: ディーラーがindex 0の状態
      const state = createTestState({ dealerIndex: 0 })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: index 1のプレイヤーからSBが引かれる
      expect(result.players[1].chips).toBe(1000 - SMALL_BLIND)
      expect(result.players[1].currentBetInRound).toBe(SMALL_BLIND)
    })

    test('should deduct BB from player two left of dealer', () => {
      // Given: ディーラーがindex 0の状態
      const state = createTestState({ dealerIndex: 0 })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: index 2のプレイヤーからBBが引かれる
      expect(result.players[2].chips).toBe(1000 - BIG_BLIND)
      expect(result.players[2].currentBetInRound).toBe(BIG_BLIND)
    })

    test('should add SB + BB to pot', () => {
      // Given: ポットが0の状態
      const state = createTestState({ pot: 0 })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: ポットにSB + BBが追加される
      expect(result.pot).toBe(SMALL_BLIND + BIG_BLIND)
    })

    test('should set currentBet to actual BB amount when BB has enough chips', () => {
      // Given: 全プレイヤーが十分なチップを持つ状態
      const state = createTestState({ currentBet: 0 })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: currentBetがBIG_BLIND（実際のBB額）に設定される
      expect(result.currentBet).toBe(BIG_BLIND)
    })

    test('should wrap around when dealer is near end of player array', () => {
      // Given: ディーラーがindex 4（最後）の状態
      const state = createTestState({ dealerIndex: 4 })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: SBがindex 0、BBがindex 1に適用される
      expect(result.players[0].chips).toBe(1000 - SMALL_BLIND)
      expect(result.players[1].chips).toBe(1000 - BIG_BLIND)
    })

    test('should handle all-in when player has fewer chips than SB', () => {
      // Given: SB位置のプレイヤーがSB未満のチップを持つ
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 1 ? 3 : 1000,
        })
      )
      const state = createTestState({ dealerIndex: 0, players })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: プレイヤーは持っているチップ全額をオールインする
      expect(result.players[1].chips).toBe(0)
      expect(result.players[1].currentBetInRound).toBe(3)
    })

    test('should handle all-in when player has fewer chips than BB', () => {
      // Given: BB位置のプレイヤーがBB未満のチップを持つ
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 2 ? 7 : 1000,
        })
      )
      const state = createTestState({ dealerIndex: 0, players })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: プレイヤーは持っているチップ全額をオールインする
      expect(result.players[2].chips).toBe(0)
      expect(result.players[2].currentBetInRound).toBe(7)
      // currentBetは実際にポストしたBB額になる
      expect(result.currentBet).toBe(7)
    })

    test('should set currentBet to actual BB amount when BB is short-stacked', () => {
      // Given: BB位置のプレイヤーがBBの半額しかチップを持たない
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 2 ? 4 : 1000,
        })
      )
      const state = createTestState({ dealerIndex: 0, players })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: currentBetが実際のBB額（4）になる
      expect(result.currentBet).toBe(4)
    })

    test('should not affect currentBet when only SB is short-stacked', () => {
      // Given: SB位置のプレイヤーがSB未満のチップを持ち、BBは十分なチップがある
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 1 ? 2 : 1000,
        })
      )
      const state = createTestState({ dealerIndex: 0, players })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: currentBetはBIG_BLIND（BB額）で決まる（SBのショートスタックは影響しない）
      expect(result.currentBet).toBe(BIG_BLIND)
    })

    test('should skip chips-0 player at SB position', () => {
      // Given: dealer=0, index 1（通常SB位置）のチップが0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 1 ? 0 : 1000,
        })
      )
      const state = createTestState({ dealerIndex: 0, players })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: index 1はスキップされ、チップが変わらない
      expect(result.players[1].chips).toBe(0)
      expect(result.players[1].currentBetInRound).toBe(0)
      // index 2がSBになる
      expect(result.players[2].chips).toBe(1000 - SMALL_BLIND)
      expect(result.players[2].currentBetInRound).toBe(SMALL_BLIND)
      // index 3がBBになる
      expect(result.players[3].chips).toBe(1000 - BIG_BLIND)
      expect(result.players[3].currentBetInRound).toBe(BIG_BLIND)
    })

    test('should skip chips-0 player at BB position', () => {
      // Given: dealer=0, index 2（通常BB位置）のチップが0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 2 ? 0 : 1000,
        })
      )
      const state = createTestState({ dealerIndex: 0, players })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: index 1がSBになる
      expect(result.players[1].chips).toBe(1000 - SMALL_BLIND)
      expect(result.players[1].currentBetInRound).toBe(SMALL_BLIND)
      // index 2はスキップされる
      expect(result.players[2].chips).toBe(0)
      expect(result.players[2].currentBetInRound).toBe(0)
      // index 3がBBになる
      expect(result.players[3].chips).toBe(1000 - BIG_BLIND)
      expect(result.players[3].currentBetInRound).toBe(BIG_BLIND)
    })

    test('should skip multiple consecutive chips-0 players', () => {
      // Given: dealer=0, index 1と2のチップが0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: (i === 1 || i === 2) ? 0 : 1000,
        })
      )
      const state = createTestState({ dealerIndex: 0, players })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: index 1, 2はスキップされる
      expect(result.players[1].chips).toBe(0)
      expect(result.players[2].chips).toBe(0)
      // index 3がSB、index 4がBBになる
      expect(result.players[3].chips).toBe(1000 - SMALL_BLIND)
      expect(result.players[3].currentBetInRound).toBe(SMALL_BLIND)
      expect(result.players[4].chips).toBe(1000 - BIG_BLIND)
      expect(result.players[4].currentBetInRound).toBe(BIG_BLIND)
    })

    test('should set lastAggressorIndex to actual BB index after skipping', () => {
      // Given: dealer=0, index 2（通常BB位置）のチップが0
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 2 ? 0 : 1000,
        })
      )
      const state = createTestState({ dealerIndex: 0, players })

      // When: ブラインドをポストする
      const result = postBlinds(state)

      // Then: lastAggressorIndexが実際のBBプレイヤー（index 3）を指す
      expect(result.lastAggressorIndex).toBe(3)
    })

    test('should not mutate original state', () => {
      // Given: 初期状態
      const state = createTestState()
      const originalPot = state.pot
      const originalChips = state.players.map((p) => p.chips)

      // When: ブラインドをポストする
      postBlinds(state)

      // Then: 元の状態は変更されていない
      expect(state.pot).toBe(originalPot)
      expect(state.players.map((p) => p.chips)).toEqual(originalChips)
    })
  })

  describe('dealHoleCards', () => {
    test('should give each player 2 cards', () => {
      // Given: ホールカードがない状態
      const state = createTestState()

      // When: ホールカードを配る
      const result = dealHoleCards(state)

      // Then: 各プレイヤーが2枚のカードを持つ
      for (const player of result.players) {
        expect(player.holeCards).toHaveLength(2)
      }
    })

    test('should remove dealt cards from deck', () => {
      // Given: 52枚のデッキ
      const state = createTestState()
      const initialDeckSize = state.deck.length

      // When: ホールカードを配る
      const result = dealHoleCards(state)

      // Then: デッキから配った枚数分減る
      const dealtCount = state.players.length * 2
      expect(result.deck).toHaveLength(initialDeckSize - dealtCount)
    })

    test('should deal unique cards to each player', () => {
      // Given: 52枚のデッキ
      const state = createTestState()

      // When: ホールカードを配る
      const result = dealHoleCards(state)

      // Then: 全ホールカードがユニークである
      const allCards = result.players.flatMap((p) => p.holeCards)
      const serialized = allCards.map((c) => `${c.suit}-${c.rank}`)
      const unique = new Set(serialized)
      expect(unique.size).toBe(allCards.length)
    })

    test('should not deal cards to folded players', () => {
      // Given: index 2のプレイヤーがfolded（チップ0を想定）
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          folded: i === 2,
        })
      )
      const state = createTestState({ players })

      // When: ホールカードを配る
      const result = dealHoleCards(state)

      // Then: foldedプレイヤーにはカードが配られない
      expect(result.players[2].holeCards).toHaveLength(0)
      // 他のプレイヤーには配られる
      for (const [i, player] of result.players.entries()) {
        if (i !== 2) {
          expect(player.holeCards).toHaveLength(2)
        }
      }
    })

    test('should consume deck cards only for non-folded players', () => {
      // Given: 1人のプレイヤーがfolded
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          folded: i === 3,
        })
      )
      const state = createTestState({ players })
      const initialDeckSize = state.deck.length

      // When: ホールカードを配る
      const result = dealHoleCards(state)

      // Then: デッキからアクティブプレイヤー分（4人×2枚=8枚）のみ消費
      const activeCount = 4
      expect(result.deck).toHaveLength(initialDeckSize - activeCount * 2)
    })

    test('should deal unique cards to non-folded players when some are folded', () => {
      // Given: 2人のプレイヤーがfolded
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          folded: i === 1 || i === 4,
        })
      )
      const state = createTestState({ players })

      // When: ホールカードを配る
      const result = dealHoleCards(state)

      // Then: 配られたカードがすべてユニーク
      const allCards = result.players.flatMap((p) => p.holeCards)
      const serialized = allCards.map((c) => `${c.suit}-${c.rank}`)
      const unique = new Set(serialized)
      expect(unique.size).toBe(allCards.length)
      // 3人 × 2枚 = 6枚
      expect(allCards).toHaveLength(6)
    })

    test('should not mutate original state', () => {
      // Given: 初期状態
      const state = createTestState()
      const originalDeckLength = state.deck.length

      // When: ホールカードを配る
      dealHoleCards(state)

      // Then: 元の状態は変更されていない
      expect(state.deck).toHaveLength(originalDeckLength)
      for (const player of state.players) {
        expect(player.holeCards).toHaveLength(0)
      }
    })
  })

  describe('dealCommunityCards', () => {
    test('should deal 3 cards for flop', () => {
      // Given: コミュニティカードがない状態
      const state = createTestState()

      // When: フロップ用に3枚配る
      const result = dealCommunityCards(state, 3)

      // Then: コミュニティカードが3枚になる
      expect(result.communityCards).toHaveLength(3)
    })

    test('should deal 1 card for turn', () => {
      // Given: 3枚のコミュニティカードがある状態
      const state = createTestState({
        communityCards: [
          card('A', 'spades'),
          card('K', 'hearts'),
          card('Q', 'diamonds'),
        ],
      })

      // When: ターン用に1枚配る
      const result = dealCommunityCards(state, 1)

      // Then: コミュニティカードが4枚になる
      expect(result.communityCards).toHaveLength(4)
    })

    test('should deal 1 card for river', () => {
      // Given: 4枚のコミュニティカードがある状態
      const state = createTestState({
        communityCards: [
          card('A', 'spades'),
          card('K', 'hearts'),
          card('Q', 'diamonds'),
          card('J', 'clubs'),
        ],
      })

      // When: リバー用に1枚配る
      const result = dealCommunityCards(state, 1)

      // Then: コミュニティカードが5枚になる
      expect(result.communityCards).toHaveLength(5)
    })

    test('should remove dealt cards from deck', () => {
      // Given: 52枚のデッキ
      const state = createTestState()
      const initialDeckSize = state.deck.length

      // When: 3枚配る
      const result = dealCommunityCards(state, 3)

      // Then: デッキから3枚減る
      expect(result.deck).toHaveLength(initialDeckSize - 3)
    })

    test('should not mutate original state', () => {
      // Given: 初期状態
      const state = createTestState()
      const originalDeckLength = state.deck.length

      // When: 3枚配る
      dealCommunityCards(state, 3)

      // Then: 元の状態は変更されていない
      expect(state.deck).toHaveLength(originalDeckLength)
      expect(state.communityCards).toHaveLength(0)
    })
  })

  describe('findNextEligibleIndex', () => {
    test('should find next player with chips > 0', () => {
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({ id: `player-${i}` })
      )

      expect(findNextEligibleIndex(players, 0)).toBe(1)
      expect(findNextEligibleIndex(players, 3)).toBe(4)
    })

    test('should skip players with chips === 0', () => {
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: i === 1 ? 0 : 1000,
        })
      )

      expect(findNextEligibleIndex(players, 0)).toBe(2)
    })

    test('should wrap around the array', () => {
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({ id: `player-${i}` })
      )

      expect(findNextEligibleIndex(players, 4)).toBe(0)
    })

    test('should return -1 when no eligible player exists', () => {
      const players = Array.from({ length: 3 }, (_, i) =>
        createTestPlayer({ id: `player-${i}`, chips: 0 })
      )

      expect(findNextEligibleIndex(players, 0)).toBe(-1)
    })
  })
})
