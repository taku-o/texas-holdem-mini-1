import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { CardView } from './CardView'
import { card } from '../domain/testHelpers'

describe('CardView', () => {
  describe('表面表示', () => {
    test('should display rank and suit when card is provided face up', () => {
      // Given: スペードのAを表面で表示
      const aceOfSpades = card('A', 'spades')

      // When: CardViewをレンダリングする
      render(<CardView card={aceOfSpades} faceDown={false} />)

      // Then: ランクとスートが表示される
      expect(screen.getByText('A')).toBeTruthy()
      expect(screen.getByText('♠')).toBeTruthy()
    })

    test('should display rank 10 correctly', () => {
      // Given: 10のカード
      const tenOfHearts = card('10', 'hearts')

      // When: CardViewをレンダリングする
      render(<CardView card={tenOfHearts} faceDown={false} />)

      // Then: ランク10が表示される
      expect(screen.getByText('10')).toBeTruthy()
    })

    test('should apply red color for hearts suit', () => {
      // Given: ハートのカード
      const heartCard = card('K', 'hearts')

      // When: CardViewをレンダリングする
      const { container } = render(<CardView card={heartCard} faceDown={false} />)

      // Then: 赤系のスタイルクラスが適用される
      const suitElement = screen.getByText('♥')
      expect(suitElement.className).toMatch(/red/)
    })

    test('should apply red color for diamonds suit', () => {
      // Given: ダイヤのカード
      const diamondCard = card('Q', 'diamonds')

      // When: CardViewをレンダリングする
      render(<CardView card={diamondCard} faceDown={false} />)

      // Then: 赤系のスタイルクラスが適用される
      const suitElement = screen.getByText('♦')
      expect(suitElement.className).toMatch(/red/)
    })

    test('should apply dark color for spades suit', () => {
      // Given: スペードのカード
      const spadeCard = card('J', 'spades')

      // When: CardViewをレンダリングする
      render(<CardView card={spadeCard} faceDown={false} />)

      // Then: 黒系のスタイルクラスが適用される
      const suitElement = screen.getByText('♠')
      expect(suitElement.className).toMatch(/gray|black|slate/)
    })

    test('should apply dark color for clubs suit', () => {
      // Given: クラブのカード
      const clubCard = card('9', 'clubs')

      // When: CardViewをレンダリングする
      render(<CardView card={clubCard} faceDown={false} />)

      // Then: 黒系のスタイルクラスが適用される
      const suitElement = screen.getByText('♣')
      expect(suitElement.className).toMatch(/gray|black|slate/)
    })

    test('should display correct suit symbol for each suit', () => {
      // Given: 各スートのカード
      const spade = card('2', 'spades')
      const heart = card('3', 'hearts')
      const diamond = card('4', 'diamonds')
      const club = card('5', 'clubs')

      // When/Then: 各スートのシンボルが正しく表示される
      const { unmount: u1 } = render(<CardView card={spade} faceDown={false} />)
      expect(screen.getByText('♠')).toBeTruthy()
      u1()

      const { unmount: u2 } = render(<CardView card={heart} faceDown={false} />)
      expect(screen.getByText('♥')).toBeTruthy()
      u2()

      const { unmount: u3 } = render(<CardView card={diamond} faceDown={false} />)
      expect(screen.getByText('♦')).toBeTruthy()
      u3()

      const { unmount: u4 } = render(<CardView card={club} faceDown={false} />)
      expect(screen.getByText('♣')).toBeTruthy()
      u4()
    })
  })

  describe('11.3: 裏面のアクセシビリティ', () => {
    test('should have role="img" on card back when faceDown is true', () => {
      // Given: カードを裏面で表示
      const aceOfSpades = card('A', 'spades')

      // When: faceDown=trueでCardViewをレンダリングする
      const { container } = render(<CardView card={aceOfSpades} faceDown={true} />)

      // Then: 裏面のdivにrole="img"が設定されている
      expect(container.querySelector('[role="img"]')).toBeTruthy()
    })

    test('should have aria-label on card back when faceDown is true', () => {
      // Given: カードを裏面で表示
      const aceOfSpades = card('A', 'spades')

      // When: faceDown=trueでCardViewをレンダリングする
      render(<CardView card={aceOfSpades} faceDown={true} />)

      // Then: 裏面のdivにaria-labelが設定されている
      const imgElement = screen.getByRole('img')
      expect(imgElement.getAttribute('aria-label')).toBeTruthy()
    })

    test('should have role="img" and aria-label on card back when card is null', () => {
      // Given: カードがnull

      // When: card=nullでCardViewをレンダリングする
      render(<CardView card={null} faceDown={false} />)

      // Then: 裏面のdivにrole="img"とaria-labelが設定されている
      const imgElement = screen.getByRole('img')
      expect(imgElement.getAttribute('aria-label')).toBeTruthy()
    })

    test('should not have role="img" on face-up card', () => {
      // Given: カードを表面で表示
      const aceOfSpades = card('A', 'spades')

      // When: faceDown=falseでCardViewをレンダリングする
      const { container } = render(<CardView card={aceOfSpades} faceDown={false} />)

      // Then: 表面のカードにはrole="img"がない
      expect(container.querySelector('[role="img"]')).toBeNull()
    })
  })

  describe('裏面表示', () => {
    test('should not display rank or suit when faceDown is true', () => {
      // Given: カードを裏面で表示
      const aceOfSpades = card('A', 'spades')

      // When: faceDown=trueでCardViewをレンダリングする
      render(<CardView card={aceOfSpades} faceDown={true} />)

      // Then: ランクとスートのシンボルが表示されない
      expect(screen.queryByText('A')).toBeNull()
      expect(screen.queryByText('♠')).toBeNull()
    })

    test('should show card back when card is null', () => {
      // Given: カードがnull

      // When: card=nullでCardViewをレンダリングする
      const { container } = render(<CardView card={null} faceDown={false} />)

      // Then: カード裏面が表示される（ランク・スートなし）
      expect(screen.queryByText('♠')).toBeNull()
      expect(screen.queryByText('♥')).toBeNull()
      expect(screen.queryByText('♦')).toBeNull()
      expect(screen.queryByText('♣')).toBeNull()
      expect(container.firstChild).toBeTruthy()
    })
  })
})
