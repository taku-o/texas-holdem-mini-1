import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { TableView } from './TableView'
import { card } from '../domain/testHelpers'

describe('TableView', () => {
  describe('ポット額表示', () => {
    test('should display pot amount', () => {
      // Given: ポットが150のテーブル
      const pot = 150

      // When: TableViewをレンダリングする
      render(<TableView communityCards={[]} pot={pot} />)

      // Then: ポット額が表示される
      expect(screen.getByText(/150/)).toBeTruthy()
    })

    test('should display pot amount of 0', () => {
      // Given: ポットが0のテーブル
      const pot = 0

      // When: TableViewをレンダリングする
      render(<TableView communityCards={[]} pot={pot} />)

      // Then: ポット額0が表示される
      expect(screen.getByText(/0/)).toBeTruthy()
    })

    test('should display large pot amount', () => {
      // Given: 大きなポット額
      const pot = 5000

      // When: TableViewをレンダリングする
      render(<TableView communityCards={[]} pot={pot} />)

      // Then: 大きなポット額が表示される
      expect(screen.getByText(/5000/)).toBeTruthy()
    })
  })

  describe('コミュニティカード表示', () => {
    test('should render 0 community cards at preflop', () => {
      // Given: プリフロップ（コミュニティカードなし）
      const communityCards = [] as const

      // When: TableViewをレンダリングする
      const { container } = render(<TableView communityCards={[...communityCards]} pot={100} />)

      // Then: カードが表示されない
      expect(screen.queryByText('♠')).toBeNull()
      expect(screen.queryByText('♥')).toBeNull()
      expect(screen.queryByText('♦')).toBeNull()
      expect(screen.queryByText('♣')).toBeNull()
    })

    test('should render 3 community cards at flop', () => {
      // Given: フロップ（3枚のコミュニティカード）
      const communityCards = [
        card('A', 'spades'),
        card('K', 'hearts'),
        card('Q', 'diamonds'),
      ]

      // When: TableViewをレンダリングする
      render(<TableView communityCards={communityCards} pot={100} />)

      // Then: 3枚のカードが表面で表示される
      expect(screen.getByText('A')).toBeTruthy()
      expect(screen.getByText('K')).toBeTruthy()
      expect(screen.getByText('Q')).toBeTruthy()
    })

    test('should render 4 community cards at turn', () => {
      // Given: ターン（4枚のコミュニティカード）
      const communityCards = [
        card('A', 'spades'),
        card('K', 'hearts'),
        card('Q', 'diamonds'),
        card('J', 'clubs'),
      ]

      // When: TableViewをレンダリングする
      render(<TableView communityCards={communityCards} pot={100} />)

      // Then: 4枚のカードが表面で表示される
      expect(screen.getByText('A')).toBeTruthy()
      expect(screen.getByText('K')).toBeTruthy()
      expect(screen.getByText('Q')).toBeTruthy()
      expect(screen.getByText('J')).toBeTruthy()
    })

    test('should render 5 community cards at river', () => {
      // Given: リバー（5枚のコミュニティカード）
      const communityCards = [
        card('A', 'spades'),
        card('K', 'hearts'),
        card('Q', 'diamonds'),
        card('J', 'clubs'),
        card('10', 'spades'),
      ]

      // When: TableViewをレンダリングする
      render(<TableView communityCards={communityCards} pot={100} />)

      // Then: 5枚のカードが表面で表示される
      expect(screen.getByText('A')).toBeTruthy()
      expect(screen.getByText('K')).toBeTruthy()
      expect(screen.getByText('Q')).toBeTruthy()
      expect(screen.getByText('J')).toBeTruthy()
      expect(screen.getByText('10')).toBeTruthy()
    })
  })
})
