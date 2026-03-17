import { describe, expect, test } from 'vitest'
import {
  INITIAL_CHIPS,
  PLAYER_COUNT,
  CPU_COUNT,
  SMALL_BLIND,
  BIG_BLIND,
} from './constants'

describe('constants', () => {
  describe('チップ関連', () => {
    test('should have initial chips of 1000', () => {
      // Given: 初期チップ定数
      // When: 値を参照する
      // Then: 1000である
      expect(INITIAL_CHIPS).toBe(1000)
    })

    test('should have small blind of 5', () => {
      // Given: スモールブラインド定数
      // When: 値を参照する
      // Then: 5である
      expect(SMALL_BLIND).toBe(5)
    })

    test('should have big blind of 10', () => {
      // Given: ビッグブラインド定数
      // When: 値を参照する
      // Then: 10である
      expect(BIG_BLIND).toBe(10)
    })

    test('should have big blind equal to double the small blind', () => {
      // Given: SBとBBの定数
      // When: 関係を確認する
      // Then: BBはSBの2倍
      expect(BIG_BLIND).toBe(SMALL_BLIND * 2)
    })

    test('should have blinds that are reasonable relative to initial chips', () => {
      // Given: 初期チップとブラインドの定数
      // When: 比率を確認する
      // Then: BBは初期チップの5%以下（長いゲームが可能）
      expect(BIG_BLIND).toBeLessThanOrEqual(INITIAL_CHIPS * 0.05)
      expect(SMALL_BLIND).toBeLessThan(BIG_BLIND)
    })
  })

  describe('プレイヤー数関連', () => {
    test('should have player count of 5', () => {
      // Given: プレイヤー数定数
      // When: 値を参照する
      // Then: 5である（人間1 + CPU4）
      expect(PLAYER_COUNT).toBe(5)
    })

    test('should have cpu count of 4', () => {
      // Given: CPU数定数
      // When: 値を参照する
      // Then: 4である
      expect(CPU_COUNT).toBe(4)
    })

    test('should have cpu count equal to player count minus one human', () => {
      // Given: プレイヤー数とCPU数
      // When: 関係を確認する
      // Then: CPU数 = プレイヤー数 - 1（人間1名）
      expect(CPU_COUNT).toBe(PLAYER_COUNT - 1)
    })
  })

  describe('定数の整合性', () => {
    test('should have all constants as positive numbers', () => {
      // Given: 全定数
      // When: 正の数か確認する
      // Then: 全て正の数である
      expect(INITIAL_CHIPS).toBeGreaterThan(0)
      expect(PLAYER_COUNT).toBeGreaterThan(0)
      expect(CPU_COUNT).toBeGreaterThan(0)
      expect(SMALL_BLIND).toBeGreaterThan(0)
      expect(BIG_BLIND).toBeGreaterThan(0)
    })

    test('should have all constants as integers', () => {
      // Given: 全定数
      // When: 整数か確認する
      // Then: 全て整数である
      expect(Number.isInteger(INITIAL_CHIPS)).toBe(true)
      expect(Number.isInteger(PLAYER_COUNT)).toBe(true)
      expect(Number.isInteger(CPU_COUNT)).toBe(true)
      expect(Number.isInteger(SMALL_BLIND)).toBe(true)
      expect(Number.isInteger(BIG_BLIND)).toBe(true)
    })
  })
})
