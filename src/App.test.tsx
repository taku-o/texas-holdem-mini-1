import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import App from './App'

describe('App', () => {
  test('should render without crashing', () => {
    // Given: App コンポーネント
    // When: レンダリングする
    const { container } = render(<App />)

    // Then: エラーなくレンダリングされる（DOM に要素が存在する）
    expect(container.firstChild).toBeTruthy()
  })

  test('should display visible content on screen', () => {
    // Given: App コンポーネント
    // When: レンダリングする
    const { container } = render(<App />)

    // Then: 画面に何らかのコンテンツが表示される（空ではない）
    expect(container.textContent?.length).toBeGreaterThan(0)
  })

  test('should show start game button on initial render', () => {
    // Given: Appを初回レンダリング
    // When: レンダリングする
    render(<App />)

    // Then: ゲーム開始ボタンが表示される
    expect(screen.getByRole('button', { name: /ゲーム開始/i })).toBeTruthy()
  })

  test('should start game when start button is clicked', async () => {
    // Given: 初期表示でゲーム開始ボタンがある
    const { container } = render(<App />)

    // When: ゲーム開始ボタンをクリックする
    fireEvent.click(screen.getByRole('button', { name: /ゲーム開始/i }))

    // Then: ゲーム中の画面が表示される（プレイヤー席が存在する）
    await waitFor(() => {
      const seatElements = container.querySelectorAll('[data-testid^="player-seat-"]')
      expect(seatElements).toHaveLength(5)
    })
  })

  test('should not show start button during active game', async () => {
    // Given: ゲームを開始済み
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /ゲーム開始/i }))

    // When: ゲーム中の画面を確認する（async処理完了を待つ）
    await waitFor(() => {
      // Then: ゲーム開始ボタンは表示されない
      expect(screen.queryByRole('button', { name: /^ゲーム開始$/i })).toBeNull()
    })
  })
})
