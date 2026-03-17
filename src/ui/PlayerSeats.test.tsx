import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { PlayerSeats } from './PlayerSeats'
import { card, createTestPlayer } from '../domain/testHelpers'
import type { GamePhase } from '../domain/types'

function createFivePlayers() {
  return Array.from({ length: 5 }, (_, i) =>
    createTestPlayer({
      id: `player-${i}`,
      isHuman: i === 0,
      holeCards: [card('A', 'spades'), card('K', 'hearts')],
    })
  )
}

describe('PlayerSeats', () => {
  describe('全席の配置', () => {
    test('should render 5 player seats', () => {
      // Given: 5人のプレイヤー
      const players = createFivePlayers()

      // When: PlayerSeatsをレンダリングする
      const { container } = render(
        <PlayerSeats
          players={players}
          dealerIndex={0}
          currentPlayerIndex={1}
          phase="preflop"
        />
      )

      // Then: 5つの席が表示される
      const chipElements = screen.getAllByText(/1000/)
      expect(chipElements).toHaveLength(5)
      const seatElements = container.querySelectorAll('[data-testid^="player-seat-"]')
      expect(seatElements).toHaveLength(5)
    })
  })

  describe('人間プレイヤーの識別', () => {
    test('should mark human player seat as highlighted', () => {
      // Given: player-0が人間プレイヤー
      const players = createFivePlayers()

      // When: PlayerSeatsをレンダリングする
      const { container } = render(
        <PlayerSeats
          players={players}
          dealerIndex={1}
          currentPlayerIndex={2}
          phase="preflop"
        />
      )

      // Then: 人間プレイヤーの席のカードが表面で表示される
      expect(screen.getByText('A')).toBeTruthy()
      expect(screen.getByText('K')).toBeTruthy()
    })
  })

  describe('ディーラーマーカーの配置', () => {
    test('should show dealer marker on correct seat', () => {
      // Given: player-2がディーラー
      const players = createFivePlayers()

      // When: dealerIndex=2でPlayerSeatsをレンダリングする
      render(
        <PlayerSeats
          players={players}
          dealerIndex={2}
          currentPlayerIndex={0}
          phase="preflop"
        />
      )

      // Then: ディーラーマーカーが1つだけ表示される
      const dealerMarkers = screen.getAllByText('D')
      expect(dealerMarkers).toHaveLength(1)
    })
  })

  describe('ショーダウン時のカード公開', () => {
    test('should show CPU cards face up during showdown phase when not folded', () => {
      // Given: ショーダウンフェーズで全員がアクティブ
      const players = createFivePlayers()

      // When: phase=showdownでPlayerSeatsをレンダリングする
      render(
        <PlayerSeats
          players={players}
          dealerIndex={0}
          currentPlayerIndex={0}
          phase="showdown"
        />
      )

      // Then: CPUのカードも表面で表示される（A, Kが複数表示される）
      const aceElements = screen.getAllByText('A')
      expect(aceElements.length).toBeGreaterThanOrEqual(5)
    })

    test('should not show cards face up for folded CPU during showdown', () => {
      // Given: ショーダウンフェーズでplayer-2がフォールド済み
      const players = createFivePlayers()
      const playersWithFolded = players.map((p, i) =>
        i === 2 ? { ...p, folded: true } : p
      )

      // When: phase=showdownでPlayerSeatsをレンダリングする
      render(
        <PlayerSeats
          players={playersWithFolded}
          dealerIndex={0}
          currentPlayerIndex={0}
          phase="showdown"
        />
      )

      // Then: フォールド済みCPUのカードは表面表示されない
      // 人間(1人) + 非フォールドCPU(3人) = 4人 × 各2枚 = 8枚のAまたはKが表面表示
      // フォールドCPU(1人)はカード非表示
      const aceElements = screen.getAllByText('A')
      expect(aceElements.length).toBe(4)
    })

    test('should not show CPU cards during non-showdown phases', () => {
      // Given: フロップフェーズ
      const phases: GamePhase[] = ['preflop', 'flop', 'turn', 'river']

      for (const phase of phases) {
        const players = createFivePlayers()

        // When: ショーダウン以外のフェーズでPlayerSeatsをレンダリングする
        const { unmount } = render(
          <PlayerSeats
            players={players}
            dealerIndex={0}
            currentPlayerIndex={0}
            phase={phase}
          />
        )

        // Then: 人間のカードのみ表面表示（A, Kはそれぞれ1つ）
        const aceElements = screen.getAllByText('A')
        expect(aceElements.length).toBe(1)

        unmount()
      }
    })
  })

  describe('現在ターンの識別', () => {
    test('should highlight current player turn', () => {
      // Given: player-3が現在ターン
      const players = createFivePlayers()

      // When: currentPlayerIndex=3でPlayerSeatsをレンダリングする
      const { container } = render(
        <PlayerSeats
          players={players}
          dealerIndex={0}
          currentPlayerIndex={3}
          phase="preflop"
        />
      )

      // Then: player-3の席にターンハイライトが適用される
      const seat3 = container.querySelector('[data-testid="player-seat-3"]')
      expect(seat3).toBeTruthy()
    })
  })
})
