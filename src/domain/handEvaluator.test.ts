import { describe, expect, test } from 'vitest'
import type { Card } from './types'
import { evaluate } from './handEvaluator'

const card = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit })

describe('handEvaluator', () => {
  describe('evaluate', () => {
    describe('役カテゴリの判定', () => {
      test('should return royal-flush when given A-K-Q-J-10 of same suit', () => {
        // Given: 同一スートの A-K-Q-J-10（7枚中に含む）
        const cards: Card[] = [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: ロイヤルフラッシュと判定される
        expect(result.category).toBe('royal-flush')
      })

      test('should return straight-flush when given consecutive cards of same suit (not royal)', () => {
        // Given: 同一スートの 9-8-7-6-5
        const cards: Card[] = [
          card('9', 'hearts'),
          card('8', 'hearts'),
          card('7', 'hearts'),
          card('6', 'hearts'),
          card('5', 'hearts'),
          card('2', 'clubs'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: ストレートフラッシュと判定される
        expect(result.category).toBe('straight-flush')
      })

      test('should return four-of-a-kind when given four cards of same rank', () => {
        // Given: 同一ランク4枚（A×4）
        const cards: Card[] = [
          card('A', 'spades'),
          card('A', 'hearts'),
          card('A', 'diamonds'),
          card('A', 'clubs'),
          card('K', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: フォーオブアカインドと判定される
        expect(result.category).toBe('four-of-a-kind')
      })

      test('should return full-house when given three of a kind plus a pair', () => {
        // Given: スリーオブアカインド + ペア
        const cards: Card[] = [
          card('K', 'spades'),
          card('K', 'hearts'),
          card('K', 'diamonds'),
          card('Q', 'clubs'),
          card('Q', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: フルハウスと判定される
        expect(result.category).toBe('full-house')
      })

      test('should return flush when given five cards of same suit (not straight)', () => {
        // Given: 同一スート5枚（連続でない）
        const cards: Card[] = [
          card('A', 'diamonds'),
          card('J', 'diamonds'),
          card('9', 'diamonds'),
          card('6', 'diamonds'),
          card('3', 'diamonds'),
          card('2', 'clubs'),
          card('4', 'spades'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: フラッシュと判定される
        expect(result.category).toBe('flush')
      })

      test('should return straight when given five consecutive cards of different suits', () => {
        // Given: 異なるスートの連続5枚
        const cards: Card[] = [
          card('10', 'spades'),
          card('9', 'hearts'),
          card('8', 'diamonds'),
          card('7', 'clubs'),
          card('6', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: ストレートと判定される
        expect(result.category).toBe('straight')
      })

      test('should return three-of-a-kind when given three cards of same rank', () => {
        // Given: 同一ランク3枚
        const cards: Card[] = [
          card('J', 'spades'),
          card('J', 'hearts'),
          card('J', 'diamonds'),
          card('9', 'clubs'),
          card('5', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: スリーオブアカインドと判定される
        expect(result.category).toBe('three-of-a-kind')
      })

      test('should return two-pair when given two different pairs', () => {
        // Given: 異なるランクのペア2つ
        const cards: Card[] = [
          card('A', 'spades'),
          card('A', 'hearts'),
          card('K', 'diamonds'),
          card('K', 'clubs'),
          card('5', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: ツーペアと判定される
        expect(result.category).toBe('two-pair')
      })

      test('should return one-pair when given exactly one pair', () => {
        // Given: ペア1つ
        const cards: Card[] = [
          card('A', 'spades'),
          card('A', 'hearts'),
          card('K', 'diamonds'),
          card('9', 'clubs'),
          card('5', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: ワンペアと判定される
        expect(result.category).toBe('one-pair')
      })

      test('should return high-card when no other hand is made', () => {
        // Given: 役なし（ハイカード）
        const cards: Card[] = [
          card('A', 'spades'),
          card('J', 'hearts'),
          card('9', 'diamonds'),
          card('7', 'clubs'),
          card('5', 'spades'),
          card('3', 'hearts'),
          card('2', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: ハイカードと判定される
        expect(result.category).toBe('high-card')
      })
    })

    describe('ロイヤルフラッシュとストレートフラッシュの区別', () => {
      test('should distinguish royal flush from straight flush', () => {
        // Given: ロイヤルフラッシュとストレートフラッシュの手札
        const royalFlushCards: Card[] = [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]
        const straightFlushCards: Card[] = [
          card('K', 'hearts'),
          card('Q', 'hearts'),
          card('J', 'hearts'),
          card('10', 'hearts'),
          card('9', 'hearts'),
          card('2', 'clubs'),
          card('3', 'diamonds'),
        ]

        // When: 両方を評価する
        const royalFlush = evaluate(royalFlushCards)
        const straightFlush = evaluate(straightFlushCards)

        // Then: 異なるカテゴリとして判定される
        expect(royalFlush.category).toBe('royal-flush')
        expect(straightFlush.category).toBe('straight-flush')
      })
    })

    describe('スコアによる同一役の比較', () => {
      test('should assign lower score to stronger hand within same category', () => {
        // Given: 同一カテゴリ（ワンペア）で強さの異なる2つのハンド
        const strongerPair: Card[] = [
          card('A', 'spades'),
          card('A', 'hearts'),
          card('K', 'diamonds'),
          card('Q', 'clubs'),
          card('J', 'spades'),
          card('9', 'hearts'),
          card('7', 'diamonds'),
        ]
        const weakerPair: Card[] = [
          card('2', 'spades'),
          card('2', 'hearts'),
          card('5', 'diamonds'),
          card('4', 'clubs'),
          card('3', 'spades'),
          card('9', 'hearts'),
          card('7', 'diamonds'),
        ]

        // When: 両方を評価する
        const strongerResult = evaluate(strongerPair)
        const weakerResult = evaluate(weakerPair)

        // Then: 同じカテゴリだがスコアで強弱が分かる（低いほど強い）
        expect(strongerResult.category).toBe('one-pair')
        expect(weakerResult.category).toBe('one-pair')
        expect(strongerResult.score).toBeLessThan(weakerResult.score)
      })

      test('should assign lower score to royal flush than to straight flush', () => {
        // Given: ロイヤルフラッシュとストレートフラッシュ
        const royalFlushCards: Card[] = [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]
        const straightFlushCards: Card[] = [
          card('9', 'hearts'),
          card('8', 'hearts'),
          card('7', 'hearts'),
          card('6', 'hearts'),
          card('5', 'hearts'),
          card('2', 'clubs'),
          card('3', 'diamonds'),
        ]

        // When: 両方を評価する
        const royalFlush = evaluate(royalFlushCards)
        const straightFlush = evaluate(straightFlushCards)

        // Then: ロイヤルフラッシュの方がスコアが低い（強い）
        expect(royalFlush.score).toBeLessThan(straightFlush.score)
      })

      test('should assign lower score to stronger category', () => {
        // Given: 異なるカテゴリの手札
        const flushCards: Card[] = [
          card('A', 'diamonds'),
          card('J', 'diamonds'),
          card('9', 'diamonds'),
          card('6', 'diamonds'),
          card('3', 'diamonds'),
          card('2', 'clubs'),
          card('4', 'spades'),
        ]
        const straightCards: Card[] = [
          card('10', 'spades'),
          card('9', 'hearts'),
          card('8', 'diamonds'),
          card('7', 'clubs'),
          card('6', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]
        const pairCards: Card[] = [
          card('A', 'spades'),
          card('A', 'hearts'),
          card('K', 'diamonds'),
          card('9', 'clubs'),
          card('5', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: すべてを評価する
        const flush = evaluate(flushCards)
        const straight = evaluate(straightCards)
        const pair = evaluate(pairCards)

        // Then: フラッシュ > ストレート > ワンペア の順で強い（スコアが低い）
        expect(flush.score).toBeLessThan(straight.score)
        expect(straight.score).toBeLessThan(pair.score)
      })
    })

    describe('異なるカード枚数の入力', () => {
      test('should evaluate 5 cards correctly', () => {
        // Given: 5枚のカード（最小入力）
        const cards: Card[] = [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: ロイヤルフラッシュと判定される
        expect(result.category).toBe('royal-flush')
      })

      test('should evaluate 6 cards and pick best 5', () => {
        // Given: 6枚のカード（最良の5枚を選択）
        const cards: Card[] = [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
          card('2', 'hearts'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: 最良の5枚でロイヤルフラッシュと判定される
        expect(result.category).toBe('royal-flush')
      })

      test('should evaluate 7 cards and pick best 5', () => {
        // Given: 7枚のカード（通常のショーダウン）
        const cards: Card[] = [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: 最良の5枚でロイヤルフラッシュと判定される
        expect(result.category).toBe('royal-flush')
      })
    })

    describe('返り値の構造', () => {
      test('should return HandRank with category and score', () => {
        // Given: 任意の7枚カード
        const cards: Card[] = [
          card('A', 'spades'),
          card('K', 'hearts'),
          card('Q', 'diamonds'),
          card('J', 'clubs'),
          card('9', 'spades'),
          card('7', 'hearts'),
          card('5', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: HandRank型の構造（category と score）を持つ
        expect(result).toHaveProperty('category')
        expect(result).toHaveProperty('score')
        expect(typeof result.category).toBe('string')
        expect(typeof result.score).toBe('number')
      })

      test('should return score as positive integer', () => {
        // Given: 任意の7枚カード
        const cards: Card[] = [
          card('A', 'spades'),
          card('A', 'hearts'),
          card('K', 'diamonds'),
          card('Q', 'clubs'),
          card('J', 'spades'),
          card('9', 'hearts'),
          card('7', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: スコアは正の整数である
        expect(result.score).toBeGreaterThan(0)
        expect(Number.isInteger(result.score)).toBe(true)
      })
    })

    describe('ランク10の変換', () => {
      test('should correctly handle rank 10 cards', () => {
        // Given: ランク10を含むストレート
        const cards: Card[] = [
          card('10', 'spades'),
          card('9', 'hearts'),
          card('8', 'diamonds'),
          card('7', 'clubs'),
          card('6', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: ストレートとして正しく判定される（10→T変換が機能）
        expect(result.category).toBe('straight')
      })
    })

    describe('エッジケース', () => {
      test('should select best hand from 7 cards when multiple hands possible', () => {
        // Given: フルハウスとツーペアの両方が見えるが、フルハウスが最良
        const cards: Card[] = [
          card('K', 'spades'),
          card('K', 'hearts'),
          card('K', 'diamonds'),
          card('Q', 'clubs'),
          card('Q', 'spades'),
          card('J', 'hearts'),
          card('J', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: 最良のフルハウスが選択される
        expect(result.category).toBe('full-house')
      })

      test('should handle ace-low straight (A-2-3-4-5)', () => {
        // Given: エースローストレート（ホイール）
        const cards: Card[] = [
          card('A', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
          card('4', 'clubs'),
          card('5', 'spades'),
          card('9', 'hearts'),
          card('J', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: ストレートと判定される
        expect(result.category).toBe('straight')
      })

      test('should handle ace-high straight (10-J-Q-K-A)', () => {
        // Given: エースハイストレート（ブロードウェイ）
        const cards: Card[] = [
          card('10', 'spades'),
          card('J', 'hearts'),
          card('Q', 'diamonds'),
          card('K', 'clubs'),
          card('A', 'spades'),
          card('2', 'hearts'),
          card('3', 'diamonds'),
        ]

        // When: ハンドを評価する
        const result = evaluate(cards)

        // Then: ストレートと判定される
        expect(result.category).toBe('straight')
      })
    })
  })
})
