import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { PlayerSeat } from './PlayerSeat'
import { card, createTestPlayer } from '../domain/testHelpers'

describe('PlayerSeat', () => {
  describe('チップ表示', () => {
    test('should display player chip count', () => {
      // Given: チップ1000のプレイヤー
      const player = createTestPlayer({ id: 'player-0', chips: 1000 })

      // When: PlayerSeatをレンダリングする
      render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={false}
        />
      )

      // Then: チップ数が表示される
      expect(screen.getByText(/1000/)).toBeTruthy()
    })

    test('should display 0 chips for all-in player', () => {
      // Given: チップ0（オールイン）のプレイヤー
      const player = createTestPlayer({ id: 'player-0', chips: 0 })

      // When: PlayerSeatをレンダリングする
      render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={false}
        />
      )

      // Then: チップ0が表示される
      expect(screen.getByText(/0/)).toBeTruthy()
    })
  })

  describe('人間プレイヤーの表示', () => {
    test('should show hole cards face up for human player', () => {
      // Given: 手札を持つ人間プレイヤー
      const player = createTestPlayer({
        id: 'human',
        isHuman: true,
        holeCards: [card('A', 'spades'), card('K', 'hearts')],
      })

      // When: isHuman=trueでPlayerSeatをレンダリングする
      render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={false}
        />
      )

      // Then: カードのランクが表面で表示される
      expect(screen.getByText('A')).toBeTruthy()
      expect(screen.getByText('K')).toBeTruthy()
    })

    test('should visually highlight human player seat', () => {
      // Given: 人間プレイヤー
      const player = createTestPlayer({ id: 'human', isHuman: true })

      // When: isHuman=trueでPlayerSeatをレンダリングする
      const { container } = render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={false}
        />
      )

      // Then: 人間の席が強調表示される（ボーダー色やリングなど）
      const seatElement = container.firstChild as HTMLElement
      expect(seatElement.className).toMatch(/blue|ring|border/)
    })
  })

  describe('CPUプレイヤーの表示', () => {
    test('should not show hole cards face up for CPU when showCards is false', () => {
      // Given: CPUプレイヤー（ショーダウンでない）
      const player = createTestPlayer({
        id: 'cpu-1',
        isHuman: false,
        holeCards: [card('Q', 'diamonds'), card('J', 'clubs')],
      })

      // When: showCards=falseでPlayerSeatをレンダリングする
      render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={false}
        />
      )

      // Then: ランクが表示されない（裏面表示）
      expect(screen.queryByText('Q')).toBeNull()
      expect(screen.queryByText('J')).toBeNull()
    })

    test('should show hole cards face up for CPU when showCards is true', () => {
      // Given: CPUプレイヤー（ショーダウン時）
      const player = createTestPlayer({
        id: 'cpu-1',
        isHuman: false,
        holeCards: [card('Q', 'diamonds'), card('J', 'clubs')],
      })

      // When: showCards=trueでPlayerSeatをレンダリングする
      render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={true}
        />
      )

      // Then: カードのランクが表面で表示される
      expect(screen.getByText('Q')).toBeTruthy()
      expect(screen.getByText('J')).toBeTruthy()
    })
  })

  describe('フォールド状態', () => {
    test('should visually indicate folded state', () => {
      // Given: フォールド済みプレイヤー
      const player = createTestPlayer({
        id: 'player-1',
        folded: true,
      })

      // When: PlayerSeatをレンダリングする
      const { container } = render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={false}
        />
      )

      // Then: フォールド状態が視覚的に区別される（不透明度低下など）
      const seatElement = container.firstChild as HTMLElement
      expect(seatElement.className).toMatch(/opacity/)
    })
  })

  describe('ディーラーマーカー', () => {
    test('should display dealer marker when isDealer is true', () => {
      // Given: ディーラーのプレイヤー
      const player = createTestPlayer({ id: 'player-0' })

      // When: isDealer=trueでPlayerSeatをレンダリングする
      render(
        <PlayerSeat
          player={player}
          isDealer={true}
          isCurrentTurn={false}
          showCards={false}
        />
      )

      // Then: ディーラーマーカー(D)が表示される
      expect(screen.getByText('D')).toBeTruthy()
    })

    test('should not display dealer marker when isDealer is false', () => {
      // Given: ディーラーでないプレイヤー
      const player = createTestPlayer({ id: 'player-1' })

      // When: isDealer=falseでPlayerSeatをレンダリングする
      render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={false}
        />
      )

      // Then: ディーラーマーカーが表示されない
      expect(screen.queryByText('D')).toBeNull()
    })
  })

  describe('現在ターン表示', () => {
    test('should highlight seat when isCurrentTurn is true', () => {
      // Given: 現在ターンのプレイヤー
      const player = createTestPlayer({ id: 'player-0' })

      // When: isCurrentTurn=trueでPlayerSeatをレンダリングする
      const { container } = render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={true}
          showCards={false}
        />
      )

      // Then: ターンのハイライトが適用される
      const seatElement = container.firstChild as HTMLElement
      expect(seatElement.className).toMatch(/yellow|amber|ring|border/)
    })
  })

  describe('手札の再レンダリング', () => {
    test('should correctly display cards after showCards changes from false to true', () => {
      // Given: CPUプレイヤーの手札が裏面で表示されている
      const player = createTestPlayer({
        id: 'cpu-1',
        isHuman: false,
        holeCards: [card('Q', 'diamonds'), card('J', 'clubs')],
      })

      // When: showCards=falseからtrueに変更して再レンダリングする
      const { rerender } = render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={false}
        />
      )

      // 裏面表示中はランクが見えない
      expect(screen.queryByText('Q')).toBeNull()
      expect(screen.queryByText('J')).toBeNull()

      rerender(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={true}
        />
      )

      // Then: カードが正しく表面で表示される
      expect(screen.getByText('Q')).toBeTruthy()
      expect(screen.getByText('J')).toBeTruthy()
    })
  })

  describe('手札なし', () => {
    test('should handle player with empty hole cards', () => {
      // Given: 手札が空のプレイヤー（ゲーム開始前など）
      const player = createTestPlayer({
        id: 'player-0',
        holeCards: [],
      })

      // When: PlayerSeatをレンダリングする
      const { container } = render(
        <PlayerSeat
          player={player}
          isDealer={false}
          isCurrentTurn={false}
          showCards={false}
        />
      )

      // Then: エラーなくレンダリングされる
      expect(container.firstChild).toBeTruthy()
    })
  })
})
