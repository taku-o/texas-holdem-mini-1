import { render } from '@testing-library/react'
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
})
