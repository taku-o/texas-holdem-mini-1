import { describe, expect, test } from 'vitest'
import { createDeck, shuffleDeck } from './deck'
import type { Card, Suit, Rank } from './types'

const ALL_SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const ALL_RANKS: Rank[] = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
]

describe('deck', () => {
  describe('createDeck', () => {
    test('should return 52 cards', () => {
      // Given: なし
      // When: デッキを生成する
      const deck = createDeck()

      // Then: 52枚のカードが返る
      expect(deck).toHaveLength(52)
    })

    test('should return all unique cards', () => {
      // Given: なし
      // When: デッキを生成する
      const deck = createDeck()

      // Then: 全カードがユニークである
      const serialized = deck.map((c) => `${c.suit}-${c.rank}`)
      const unique = new Set(serialized)
      expect(unique.size).toBe(52)
    })

    test('should contain all 4 suits', () => {
      // Given: なし
      // When: デッキを生成する
      const deck = createDeck()

      // Then: 4つのスートがそれぞれ13枚ある
      for (const suit of ALL_SUITS) {
        const suitCards = deck.filter((c) => c.suit === suit)
        expect(suitCards).toHaveLength(13)
      }
    })

    test('should contain all 13 ranks', () => {
      // Given: なし
      // When: デッキを生成する
      const deck = createDeck()

      // Then: 13のランクがそれぞれ4枚ある
      for (const rank of ALL_RANKS) {
        const rankCards = deck.filter((c) => c.rank === rank)
        expect(rankCards).toHaveLength(4)
      }
    })
  })

  describe('shuffleDeck', () => {
    test('should return same number of cards', () => {
      // Given: 52枚のデッキ
      const deck = createDeck()

      // When: シャッフルする
      const shuffled = shuffleDeck(deck, Math.random)

      // Then: 52枚のまま
      expect(shuffled).toHaveLength(52)
    })

    test('should contain all original cards after shuffle', () => {
      // Given: 52枚のデッキ
      const deck = createDeck()

      // When: シャッフルする
      const shuffled = shuffleDeck(deck, Math.random)

      // Then: 同じカードが含まれている
      const serialize = (cards: Card[]) =>
        cards.map((c) => `${c.suit}-${c.rank}`).sort()
      expect(serialize(shuffled)).toEqual(serialize(deck))
    })

    test('should produce reproducible result with fixed randomFn', () => {
      // Given: 同じ固定randomFnを2回使う
      const deck = createDeck()
      let seed1 = 0.5
      const fixedRandom1 = () => {
        seed1 = (seed1 * 9301 + 49297) % 233280
        return seed1 / 233280
      }
      let seed2 = 0.5
      const fixedRandom2 = () => {
        seed2 = (seed2 * 9301 + 49297) % 233280
        return seed2 / 233280
      }

      // When: 同じrandomFnでシャッフルする
      const shuffled1 = shuffleDeck(deck, fixedRandom1)
      const shuffled2 = shuffleDeck(deck, fixedRandom2)

      // Then: 同じ結果になる
      expect(shuffled1).toEqual(shuffled2)
    })

    test('should not mutate original deck', () => {
      // Given: 52枚のデッキ
      const deck = createDeck()
      const originalDeck = [...deck]

      // When: シャッフルする
      shuffleDeck(deck, Math.random)

      // Then: 元のデッキは変更されていない
      expect(deck).toEqual(originalDeck)
    })
  })
})
