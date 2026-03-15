import { describe, expect, test, vi } from 'vitest'
import { card, createTestPlayer, createTestState } from './testHelpers'
import { createDeck } from './deck'
import type { Card, Player, GameState } from './types'

vi.mock('./deck', async (importOriginal) => {
  const original = await importOriginal<typeof import('./deck')>()
  return {
    ...original,
    createDeck: vi.fn(original.createDeck),
  }
})

describe('testHelpers', () => {
  describe('card', () => {
    test('should create a Card with given rank and suit', () => {
      // Given: ランクとスートを指定する
      const rank: Card['rank'] = 'A'
      const suit: Card['suit'] = 'spades'

      // When: card関数でカードを作成する
      const result = card(rank, suit)

      // Then: 指定されたランクとスートのCardが返る
      expect(result).toEqual({ rank: 'A', suit: 'spades' })
    })

    test('should create different cards for different inputs', () => {
      // Given: 異なるランクとスートの組み合わせ
      const card1 = card('2', 'hearts')
      const card2 = card('K', 'diamonds')

      // When/Then: 異なるカードが作成される
      expect(card1).toEqual({ rank: '2', suit: 'hearts' })
      expect(card2).toEqual({ rank: 'K', suit: 'diamonds' })
      expect(card1).not.toEqual(card2)
    })

    test('should handle rank 10 correctly', () => {
      // Given: ランク10を指定する
      const result = card('10', 'clubs')

      // Then: ランク10のCardが返る
      expect(result).toEqual({ rank: '10', suit: 'clubs' })
    })

    test('should return values assignable to Card[] array', () => {
      // Given/When: card関数で複数カードを作成しCard[]型に代入する
      const cards: Card[] = [card('A', 'spades'), card('K', 'hearts')]

      // Then: Card型の配列として正しく動作する
      expect(cards).toHaveLength(2)
      expect(cards[0].rank).toBe('A')
    })
  })

  describe('createTestPlayer', () => {
    test('should create a player with default values', () => {
      // Given/When: デフォルトでプレイヤーを作成する
      const player = createTestPlayer()

      // Then: デフォルト値が設定されている
      expect(player.id).toBe('test-player')
      expect(player.isHuman).toBe(false)
      expect(player.chips).toBe(1000)
      expect(player.holeCards).toEqual([card('A', 'spades'), card('K', 'hearts')])
      expect(player.folded).toBe(false)
      expect(player.currentBetInRound).toBe(0)
    })

    test('should override id', () => {
      // Given: idを指定する
      const player = createTestPlayer({ id: 'custom-id' })

      // Then: idが上書きされ、他のデフォルト値は維持される
      expect(player.id).toBe('custom-id')
      expect(player.chips).toBe(1000)
    })

    test('should override chips', () => {
      // Given: chipsを指定する
      const player = createTestPlayer({ chips: 500 })

      // Then: chipsが上書きされる
      expect(player.chips).toBe(500)
    })

    test('should override holeCards', () => {
      // Given: 空のholeCardsを指定する
      const player = createTestPlayer({ holeCards: [] })

      // Then: holeCardsが空になる
      expect(player.holeCards).toEqual([])
    })

    test('should override folded', () => {
      // Given: foldedをtrueに指定する
      const player = createTestPlayer({ folded: true })

      // Then: foldedがtrueになる
      expect(player.folded).toBe(true)
    })

    test('should override multiple fields at once', () => {
      // Given: 複数フィールドを同時に指定する
      const player = createTestPlayer({
        id: 'player-1',
        chips: 0,
        folded: true,
        currentBetInRound: 50,
      })

      // Then: 全指定フィールドが上書きされる
      expect(player.id).toBe('player-1')
      expect(player.chips).toBe(0)
      expect(player.folded).toBe(true)
      expect(player.currentBetInRound).toBe(50)
    })

    test('should satisfy Player type', () => {
      // Given/When: プレイヤーを作成する
      const player = createTestPlayer()

      // Then: Player型の全フィールドが存在する
      const keys: (keyof Player)[] = ['id', 'isHuman', 'chips', 'holeCards', 'folded', 'currentBetInRound']
      for (const key of keys) {
        expect(player).toHaveProperty(key)
      }
    })
  })

  describe('createTestState', () => {
    test('should create a state with default values', () => {
      // Given/When: デフォルトでゲーム状態を作成する
      const state = createTestState()

      // Then: デフォルト値が設定されている
      expect(state.phase).toBe('preflop')
      expect(state.dealerIndex).toBe(0)
      expect(state.communityCards).toEqual([])
      expect(state.pot).toBe(0)
      expect(state.currentBet).toBe(0)
      expect(state.currentPlayerIndex).toBe(0)
      expect(state.humanPlayerId).toBe('player-0')
      expect(state.lastAggressorIndex).toBeNull()
    })

    test('should create 5 players by default', () => {
      // Given/When: デフォルトでゲーム状態を作成する
      const state = createTestState()

      // Then: 5人のプレイヤーが作成される
      expect(state.players).toHaveLength(5)
    })

    test('should assign sequential ids to default players', () => {
      // Given/When: デフォルトでゲーム状態を作成する
      const state = createTestState()

      // Then: プレイヤーIDがplayer-0〜player-4である
      for (let i = 0; i < 5; i++) {
        expect(state.players[i].id).toBe(`player-${i}`)
      }
    })

    test('should create a full 52-card deck by default', () => {
      // Given/When: デフォルトでゲーム状態を作成する
      const state = createTestState()

      // Then: 52枚のデッキが設定される
      expect(state.deck).toHaveLength(52)
    })

    test('should use same deck as createDeck from deck module', () => {
      // Given/When: デフォルトでゲーム状態を作成する
      const state = createTestState()
      const referenceDeck = createDeck()

      // Then: deck.tsのcreateDeckと同一のデッキが返る
      expect(state.deck).toEqual(referenceDeck)
    })

    test('should override phase', () => {
      // Given: phaseをshowdownに指定する
      const state = createTestState({ phase: 'showdown' })

      // Then: phaseが上書きされる
      expect(state.phase).toBe('showdown')
    })

    test('should override pot and currentBet', () => {
      // Given: potとcurrentBetを指定する
      const state = createTestState({ pot: 100, currentBet: 20 })

      // Then: potとcurrentBetが上書きされる
      expect(state.pot).toBe(100)
      expect(state.currentBet).toBe(20)
    })

    test('should override players', () => {
      // Given: カスタムプレイヤー配列を指定する
      const customPlayers = [
        createTestPlayer({ id: 'alice', chips: 500 }),
        createTestPlayer({ id: 'bob', chips: 1500 }),
      ]
      const state = createTestState({ players: customPlayers })

      // Then: プレイヤーが上書きされる
      expect(state.players).toHaveLength(2)
      expect(state.players[0].id).toBe('alice')
      expect(state.players[1].id).toBe('bob')
    })

    test('should override communityCards', () => {
      // Given: コミュニティカードを指定する
      const communityCards = [
        card('A', 'spades'),
        card('K', 'hearts'),
        card('Q', 'diamonds'),
      ]
      const state = createTestState({ communityCards })

      // Then: コミュニティカードが上書きされる
      expect(state.communityCards).toHaveLength(3)
      expect(state.communityCards).toEqual(communityCards)
    })

    test('should override deck to empty array', () => {
      // Given: 空のデッキを指定する
      const state = createTestState({ deck: [] })

      // Then: デッキが空になる
      expect(state.deck).toHaveLength(0)
    })

    test('should override lastAggressorIndex', () => {
      // Given: lastAggressorIndexを指定する
      const state = createTestState({ lastAggressorIndex: 3 })

      // Then: lastAggressorIndexが上書きされる
      expect(state.lastAggressorIndex).toBe(3)
    })

    test('should satisfy GameState type', () => {
      // Given/When: ゲーム状態を作成する
      const state = createTestState()

      // Then: GameState型の全フィールドが存在する
      const keys: (keyof GameState)[] = [
        'phase', 'dealerIndex', 'players', 'communityCards',
        'pot', 'currentBet', 'currentPlayerIndex', 'humanPlayerId',
        'deck', 'lastAggressorIndex',
      ]
      for (const key of keys) {
        expect(state).toHaveProperty(key)
      }
    })

    test('should not call createDeck when deck is provided in overrides', () => {
      // Given: overridesにdeckを含める
      const mockedCreateDeck = vi.mocked(createDeck)
      mockedCreateDeck.mockClear()

      // When: deck: [] を指定してcreateTestStateを呼ぶ
      const state = createTestState({ deck: [] })

      // Then: createDeckが呼ばれず、指定したdeckが使われる
      expect(mockedCreateDeck).not.toHaveBeenCalled()
      expect(state.deck).toEqual([])
    })

    test('should call createDeck when deck is not provided in overrides', () => {
      // Given: overridesにdeckを含めない
      const mockedCreateDeck = vi.mocked(createDeck)
      mockedCreateDeck.mockClear()

      // When: deckを指定せずにcreateTestStateを呼ぶ
      const state = createTestState({ phase: 'flop' })

      // Then: createDeckが1回呼ばれ、52枚のデッキが設定される
      expect(mockedCreateDeck).toHaveBeenCalledOnce()
      expect(state.deck).toHaveLength(52)
    })

    test('should call createDeck when no overrides are provided', () => {
      // Given: overridesなし
      const mockedCreateDeck = vi.mocked(createDeck)
      mockedCreateDeck.mockClear()

      // When: 引数なしでcreateTestStateを呼ぶ
      const state = createTestState()

      // Then: createDeckが1回呼ばれ、52枚のデッキが設定される
      expect(mockedCreateDeck).toHaveBeenCalledOnce()
      expect(state.deck).toHaveLength(52)
    })

    test('should not call createDeck when deck is provided as custom cards', () => {
      // Given: カスタムデッキをoverridesに含める
      const mockedCreateDeck = vi.mocked(createDeck)
      mockedCreateDeck.mockClear()
      const customDeck = [card('A', 'spades'), card('K', 'hearts')]

      // When: カスタムデッキを指定してcreateTestStateを呼ぶ
      const state = createTestState({ deck: customDeck })

      // Then: createDeckが呼ばれず、指定したデッキが使われる
      expect(mockedCreateDeck).not.toHaveBeenCalled()
      expect(state.deck).toEqual(customDeck)
    })
  })
})
