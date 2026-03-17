import { describe, expect, test } from 'vitest'
import { calcTotalChips, createTestPlayer, createTestState } from './testHelpers'

describe('calcTotalChips', () => {
  test('should return sum of all player chips plus pot', () => {
    // Given: 3人のプレイヤー（各100チップ）とポット50
    const state = createTestState({
      players: [
        createTestPlayer({ id: 'p0', chips: 100 }),
        createTestPlayer({ id: 'p1', chips: 100 }),
        createTestPlayer({ id: 'p2', chips: 100 }),
      ],
      pot: 50,
    })

    // When: calcTotalChips を呼ぶ
    const total = calcTotalChips(state)

    // Then: プレイヤーチップ合計300 + ポット50 = 350
    expect(total).toBe(350)
  })

  test('should return only player chips when pot is 0', () => {
    // Given: ポット0の状態
    const state = createTestState({
      players: [
        createTestPlayer({ id: 'p0', chips: 500 }),
        createTestPlayer({ id: 'p1', chips: 300 }),
      ],
      pot: 0,
    })

    // When: calcTotalChips を呼ぶ
    const total = calcTotalChips(state)

    // Then: プレイヤーチップ合計のみ
    expect(total).toBe(800)
  })

  test('should return pot when all player chips are 0', () => {
    // Given: 全プレイヤーのチップが0
    const state = createTestState({
      players: [
        createTestPlayer({ id: 'p0', chips: 0 }),
        createTestPlayer({ id: 'p1', chips: 0 }),
      ],
      pot: 1000,
    })

    // When: calcTotalChips を呼ぶ
    const total = calcTotalChips(state)

    // Then: ポットのみ
    expect(total).toBe(1000)
  })

  test('should include folded players chips', () => {
    // Given: フォールドしたプレイヤーもチップを持っている
    const state = createTestState({
      players: [
        createTestPlayer({ id: 'p0', chips: 200, folded: false }),
        createTestPlayer({ id: 'p1', chips: 300, folded: true }),
      ],
      pot: 100,
    })

    // When: calcTotalChips を呼ぶ
    const total = calcTotalChips(state)

    // Then: フォールドしたプレイヤーのチップも含む
    expect(total).toBe(600)
  })

  test('should handle standard 5-player game initial state', () => {
    // Given: 5人プレイヤーの標準ゲーム状態（各1000チップ、ポット0）
    const state = createTestState({
      pot: 0,
    })

    // When: calcTotalChips を呼ぶ
    const total = calcTotalChips(state)

    // Then: 5 × 1000 + 0 = 5000
    expect(total).toBe(5000)
  })
})
