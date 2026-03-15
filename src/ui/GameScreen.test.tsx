import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { GameScreen } from './GameScreen'
import { createTestState, card } from '../domain/testHelpers'
import type { GameState, PlayerAction } from '../domain/types'

function createDefaultProps() {
  return {
    gameState: null as GameState | null,
    validActions: [] as PlayerAction[],
    isHumanTurn: false,
    onStartGame: vi.fn(),
    onAction: vi.fn(),
  }
}

function renderGameScreen(overrides: Partial<ReturnType<typeof createDefaultProps>> = {}) {
  const props = { ...createDefaultProps(), ...overrides }
  const result = render(<GameScreen {...props} />)
  return { ...result, onStartGame: props.onStartGame, onAction: props.onAction }
}

describe('GameScreen', () => {
  describe('9.1: ゲーム未開始時の表示', () => {
    test('should show start game button when gameState is null', () => {
      // Given: ゲーム未開始（gameState === null）
      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState: null })

      // Then: 「ゲーム開始」ボタンが表示される
      expect(screen.getByRole('button', { name: /ゲーム開始/i })).toBeTruthy()
    })

    test('should call onStartGame when start game button is clicked', () => {
      // Given: ゲーム未開始
      const { onStartGame } = renderGameScreen({ gameState: null })

      // When: ゲーム開始ボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /ゲーム開始/i }))

      // Then: onStartGameが呼ばれる
      expect(onStartGame).toHaveBeenCalledTimes(1)
    })

    test('should display title when game is not started', () => {
      // Given: ゲーム未開始
      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState: null })

      // Then: タイトルが表示される
      expect(screen.getByText(/Texas Hold'em/i)).toBeTruthy()
    })

    test('should not show TableView or PlayerSeats when gameState is null', () => {
      // Given: ゲーム未開始
      // When: GameScreenをレンダリングする
      const { container } = renderGameScreen({ gameState: null })

      // Then: ゲーム中のUIコンポーネントが表示されない
      expect(container.querySelector('[data-testid^="player-seat-"]')).toBeNull()
    })
  })

  describe('9.1: ゲーム中の表示', () => {
    test('should render TableView with community cards and pot', () => {
      // Given: ゲーム中の状態（フロップでコミュニティカード3枚、pot=150）
      const gameState = createTestState({
        phase: 'flop',
        communityCards: [
          card('A', 'spades'),
          card('K', 'hearts'),
          card('Q', 'diamonds'),
        ],
        pot: 150,
      })

      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState })

      // Then: ポット額が表示される
      expect(screen.getByText(/150/)).toBeTruthy()
    })

    test('should render PlayerSeats with player information', () => {
      // Given: ゲーム中の状態
      const gameState = createTestState({
        phase: 'preflop',
        dealerIndex: 2,
        currentPlayerIndex: 0,
      })

      // When: GameScreenをレンダリングする
      const { container } = renderGameScreen({ gameState, isHumanTurn: true })

      // Then: プレイヤー席が表示される
      const seatElements = container.querySelectorAll('[data-testid^="player-seat-"]')
      expect(seatElements).toHaveLength(5)
    })

    test('should render ActionBar when isHumanTurn is true', () => {
      // Given: 人間のターンでfold, check, betが有効
      const gameState = createTestState({
        phase: 'preflop',
        currentPlayerIndex: 0,
      })
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet' },
      ]

      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState, validActions, isHumanTurn: true })

      // Then: アクションボタンが表示される
      expect(screen.getByRole('button', { name: /fold/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /check/i })).toBeTruthy()
    })

    test('should not render ActionBar when isHumanTurn is false', () => {
      // Given: CPUのターン
      const gameState = createTestState({
        phase: 'preflop',
        currentPlayerIndex: 1,
      })

      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState, isHumanTurn: false })

      // Then: fold/check/betボタンが表示されない
      expect(screen.queryByRole('button', { name: /fold/i })).toBeNull()
    })

    test('should pass onAction to ActionBar', () => {
      // Given: 人間のターンでfoldが有効
      const gameState = createTestState({
        phase: 'preflop',
        currentPlayerIndex: 0,
      })
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet' },
      ]
      const { onAction } = renderGameScreen({
        gameState,
        validActions,
        isHumanTurn: true,
      })

      // When: foldボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /fold/i }))

      // Then: onActionがfoldアクションで呼ばれる
      expect(onAction).toHaveBeenCalledWith({ type: 'fold' })
    })

    test('should pass correct playerChips to ActionBar from human player', () => {
      // Given: 人間プレイヤーのチップが500
      const gameState = createTestState({
        phase: 'preflop',
        currentPlayerIndex: 0,
        players: Array.from({ length: 5 }, (_, i) => ({
          id: `player-${i}`,
          isHuman: i === 0,
          chips: i === 0 ? 500 : 1000,
          holeCards: [card('A', 'spades'), card('K', 'hearts')],
          folded: false,
          currentBetInRound: 0,
        })),
        humanPlayerId: 'player-0',
      })
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet' },
      ]

      // When: GameScreenをレンダリングしてbetボタンをクリック
      renderGameScreen({ gameState, validActions, isHumanTurn: true })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: チップ入力のmaxが人間プレイヤーのチップ数（500）になる
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('max')).toBe('500')
    })
  })

  describe('9.1: ゲーム中のデータフロー', () => {
    test('should show dealer marker based on dealerIndex', () => {
      // Given: dealerIndex=3のゲーム状態
      const gameState = createTestState({
        phase: 'preflop',
        dealerIndex: 3,
      })

      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState })

      // Then: ディーラーマーカーが1つ表示される
      const dealerMarkers = screen.getAllByText('D')
      expect(dealerMarkers).toHaveLength(1)
    })

    test('should display community cards during flop', () => {
      // Given: フロップでコミュニティカード3枚
      const gameState = createTestState({
        phase: 'flop',
        communityCards: [
          card('10', 'spades'),
          card('J', 'hearts'),
          card('Q', 'diamonds'),
        ],
        pot: 100,
      })

      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState })

      // Then: コミュニティカードが表示される
      expect(screen.getByText('10')).toBeTruthy()
      expect(screen.getByText('J')).toBeTruthy()
      expect(screen.getByText('Q')).toBeTruthy()
    })
  })

  describe('9.2: ゲーム終了時の表示', () => {
    test('should show game over message when phase is idle and gameOverReason exists', () => {
      // Given: ゲーム終了状態（phase=idle, gameOverReason あり）
      const gameState = createTestState({
        phase: 'idle',
        gameOverReason: 'チップがなくなりました',
      })

      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState })

      // Then: 終了理由が表示される
      expect(screen.getByText(/チップがなくなりました/)).toBeTruthy()
    })

    test('should show restart button when game is over', () => {
      // Given: ゲーム終了状態
      const gameState = createTestState({
        phase: 'idle',
        gameOverReason: 'チップがなくなりました',
      })

      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState })

      // Then: 「新しいゲームを始める」ボタンが表示される
      expect(screen.getByRole('button', { name: /新しいゲームを始める/i })).toBeTruthy()
    })

    test('should call onStartGame when restart button is clicked', () => {
      // Given: ゲーム終了状態
      const gameState = createTestState({
        phase: 'idle',
        gameOverReason: 'チップがなくなりました',
      })
      const { onStartGame } = renderGameScreen({ gameState })

      // When: 再開ボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /新しいゲームを始める/i }))

      // Then: onStartGameが呼ばれる
      expect(onStartGame).toHaveBeenCalledTimes(1)
    })

    test('should not show TableView or ActionBar when game is over', () => {
      // Given: ゲーム終了状態
      const gameState = createTestState({
        phase: 'idle',
        gameOverReason: 'CPUが全員脱落しました',
      })

      // When: GameScreenをレンダリングする
      const { container } = renderGameScreen({ gameState })

      // Then: ゲーム中のUIが表示されない
      expect(container.querySelector('[data-testid^="player-seat-"]')).toBeNull()
      expect(screen.queryByRole('button', { name: /fold/i })).toBeNull()
    })

    test('should display different game over reasons correctly', () => {
      // Given: 異なる終了理由
      const gameState = createTestState({
        phase: 'idle',
        gameOverReason: 'CPUが全員脱落しました',
      })

      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState })

      // Then: 終了理由が正しく表示される
      expect(screen.getByText(/CPUが全員脱落しました/)).toBeTruthy()
    })
  })

  describe('9.1/9.2: 表示モードの切り替え境界', () => {
    test('should show game view for preflop phase', () => {
      // Given: preflopフェーズ
      const gameState = createTestState({ phase: 'preflop' })

      // When: GameScreenをレンダリングする
      const { container } = renderGameScreen({ gameState })

      // Then: プレイヤー席が表示される（ゲーム中ビュー）
      const seatElements = container.querySelectorAll('[data-testid^="player-seat-"]')
      expect(seatElements).toHaveLength(5)
    })

    test('should show game view for showdown phase', () => {
      // Given: showdownフェーズ
      const gameState = createTestState({ phase: 'showdown' })

      // When: GameScreenをレンダリングする
      const { container } = renderGameScreen({ gameState })

      // Then: プレイヤー席が表示される（ゲーム中ビュー）
      const seatElements = container.querySelectorAll('[data-testid^="player-seat-"]')
      expect(seatElements).toHaveLength(5)
    })

    test('should show game over view only when idle with gameOverReason', () => {
      // Given: idle フェーズだが gameOverReason がある
      const gameState = createTestState({
        phase: 'idle',
        gameOverReason: 'ゲーム終了',
      })

      // When: GameScreenをレンダリングする
      renderGameScreen({ gameState })

      // Then: 再開ボタンが表示される
      expect(screen.getByRole('button', { name: /新しいゲームを始める/i })).toBeTruthy()
      // ゲーム開始ボタンは表示されない
      expect(screen.queryByRole('button', { name: /^ゲーム開始$/i })).toBeNull()
    })
  })
})
