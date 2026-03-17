import { describe, expect, test } from 'vitest'
import {
  evaluateShowdown,
  determineWinners,
  resolveUncontestedPot,
} from './showdown'
import type { Card, GameState, Player } from './types'
import { calcTotalChips, card, createTestPlayer as createBaseTestPlayer, createTestState as createBaseTestState } from './testHelpers'

function createTestPlayer(overrides: Partial<Player> = {}) {
  return createBaseTestPlayer({
    holeCards: [card('2', 'spades'), card('3', 'hearts')],
    ...overrides,
  })
}

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return createBaseTestState({
    phase: 'showdown',
    players: Array.from({ length: 5 }, (_, i) =>
      createTestPlayer({ id: `player-${i}` })
    ),
    communityCards: [
      card('7', 'diamonds'),
      card('8', 'clubs'),
      card('9', 'spades'),
      card('J', 'hearts'),
      card('Q', 'diamonds'),
    ],
    pot: 100,
    deck: [],
    ...overrides,
  })
}

describe('showdown', () => {
  describe('determineWinners', () => {
    test('should return single winner with best hand', () => {
      // Given: 1人がフラッシュ、他はワンペア以下
      const communityCards: Card[] = [
        card('7', 'diamonds'),
        card('8', 'clubs'),
        card('9', 'spades'),
        card('2', 'hearts'),
        card('4', 'diamonds'),
      ]
      const players: Player[] = [
        createTestPlayer({
          id: 'player-0',
          holeCards: [card('A', 'diamonds'), card('K', 'diamonds')],
        }),
        createTestPlayer({
          id: 'player-1',
          holeCards: [card('10', 'spades'), card('J', 'clubs')],
        }),
        createTestPlayer({
          id: 'player-2',
          holeCards: [card('3', 'clubs'), card('5', 'hearts')],
        }),
      ]

      // When: 勝者を判定する
      const winners = determineWinners(players, communityCards)

      // Then: ストレートを持つplayer-1が勝つ
      expect(winners).toHaveLength(1)
      expect(winners[0]).toBe(1)
    })

    test('should return multiple winners on tie', () => {
      // Given: 2人が同じハンド強度を持つ
      const communityCards: Card[] = [
        card('A', 'spades'),
        card('K', 'spades'),
        card('Q', 'spades'),
        card('J', 'spades'),
        card('10', 'spades'),
      ]
      const players: Player[] = [
        createTestPlayer({
          id: 'player-0',
          holeCards: [card('2', 'hearts'), card('3', 'hearts')],
        }),
        createTestPlayer({
          id: 'player-1',
          holeCards: [card('4', 'hearts'), card('5', 'hearts')],
        }),
      ]

      // When: 勝者を判定する（コミュニティカードだけでロイヤルフラッシュ）
      const winners = determineWinners(players, communityCards)

      // Then: 両者が勝者
      expect(winners).toHaveLength(2)
      expect(winners).toContain(0)
      expect(winners).toContain(1)
    })

    test('should exclude folded players from winner determination', () => {
      // Given: 最強ハンドのプレイヤーがフォールド済み
      const communityCards: Card[] = [
        card('7', 'diamonds'),
        card('8', 'clubs'),
        card('9', 'spades'),
        card('2', 'hearts'),
        card('4', 'diamonds'),
      ]
      const players: Player[] = [
        createTestPlayer({
          id: 'player-0',
          holeCards: [card('10', 'spades'), card('J', 'clubs')],
          folded: true,
        }),
        createTestPlayer({
          id: 'player-1',
          holeCards: [card('3', 'clubs'), card('5', 'hearts')],
        }),
      ]

      // When: 勝者を判定する
      const winners = determineWinners(players, communityCards)

      // Then: フォールドしていないplayer-1が勝つ
      expect(winners).toHaveLength(1)
      expect(winners[0]).toBe(1)
    })
  })

  describe('evaluateShowdown', () => {
    test('should award pot to single winner', () => {
      // Given: 1人が明確に強いハンドを持つ
      const players: Player[] = [
        createTestPlayer({
          id: 'player-0',
          chips: 900,
          holeCards: [card('10', 'diamonds'), card('J', 'diamonds')],
        }),
        createTestPlayer({
          id: 'player-1',
          chips: 900,
          holeCards: [card('2', 'clubs'), card('3', 'clubs')],
        }),
        createTestPlayer({
          id: 'player-2',
          chips: 900,
          holeCards: [card('4', 'hearts'), card('5', 'hearts')],
          folded: true,
        }),
      ]
      const state = createTestState({
        players,
        pot: 300,
        communityCards: [
          card('A', 'diamonds'),
          card('K', 'diamonds'),
          card('Q', 'diamonds'),
          card('8', 'spades'),
          card('7', 'clubs'),
        ],
      })

      // When: ショーダウンを評価する
      const result = evaluateShowdown(state)

      // Then: 勝者にポット全額が加算される
      const totalChips = calcTotalChips(result)
      expect(totalChips).toBe(900 * 3 + 300)
    })

    test('should split pot equally on tie', () => {
      // Given: コミュニティカードだけで最強ハンド（全員同じ強さ）
      const players: Player[] = [
        createTestPlayer({ id: 'player-0', chips: 900 }),
        createTestPlayer({ id: 'player-1', chips: 900 }),
      ]
      const state = createTestState({
        players,
        pot: 200,
        communityCards: [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
        ],
      })

      // When: ショーダウンを評価する
      const result = evaluateShowdown(state)

      // Then: ポットが均等に分配される
      expect(result.players[0].chips).toBe(1000)
      expect(result.players[1].chips).toBe(1000)
    })

    test('should not mutate original state', () => {
      // Given: 初期状態
      const state = createTestState({ pot: 100 })
      const originalPot = state.pot
      const originalChips = state.players.map((p) => p.chips)

      // When: ショーダウンを評価する
      evaluateShowdown(state)

      // Then: 元の状態は変更されていない
      expect(state.pot).toBe(originalPot)
      expect(state.players.map((p) => p.chips)).toEqual(originalChips)
    })
  })

  describe('evaluateShowdown エッジケース', () => {
    test('should split pot among 3 tied players with remainder to first winner', () => {
      // Given: 3人がコミュニティカードだけで同じハンド（ロイヤルフラッシュ）、ポットが100（3で割り切れない）
      const players: Player[] = [
        createTestPlayer({ id: 'player-0', chips: 900 }),
        createTestPlayer({ id: 'player-1', chips: 900 }),
        createTestPlayer({ id: 'player-2', chips: 900 }),
      ]
      const state = createTestState({
        players,
        pot: 100,
        communityCards: [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
        ],
      })

      // When: ショーダウンを評価する
      const result = evaluateShowdown(state)

      // Then: 各プレイヤーに33ずつ配分され、端数1が最初の勝者に加算される
      expect(result.players[0].chips).toBe(900 + 34) // 33 + remainder 1
      expect(result.players[1].chips).toBe(900 + 33)
      expect(result.players[2].chips).toBe(900 + 33)
      expect(result.pot).toBe(0)
      // チップ保存則
      const totalChips = calcTotalChips(result)
      expect(totalChips).toBe(900 * 3 + 100)
    })

    test('should handle odd pot with 2 tied players giving remainder to first', () => {
      // Given: 2人が同じハンド、ポットが奇数（101）
      const players: Player[] = [
        createTestPlayer({ id: 'player-0', chips: 900 }),
        createTestPlayer({ id: 'player-1', chips: 900 }),
      ]
      const state = createTestState({
        players,
        pot: 101,
        communityCards: [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
        ],
      })

      // When: ショーダウンを評価する
      const result = evaluateShowdown(state)

      // Then: 50ずつ + 端数1が最初の勝者に加算される
      expect(result.players[0].chips).toBe(900 + 51) // 50 + remainder 1
      expect(result.players[1].chips).toBe(900 + 50)
      expect(result.pot).toBe(0)
    })

    test('should split pot among 4 tied players with remainder to first winner', () => {
      // Given: 4人が同じハンド、ポット103（4で割ると余り3）
      const players: Player[] = [
        createTestPlayer({ id: 'player-0', chips: 800 }),
        createTestPlayer({ id: 'player-1', chips: 800 }),
        createTestPlayer({ id: 'player-2', chips: 800 }),
        createTestPlayer({ id: 'player-3', chips: 800 }),
      ]
      const state = createTestState({
        players,
        pot: 103,
        communityCards: [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
        ],
      })

      // When: ショーダウンを評価する
      const result = evaluateShowdown(state)

      // Then: 各25 + 端数3が最初の勝者に加算される
      expect(result.players[0].chips).toBe(800 + 25 + 3) // share + remainder
      expect(result.players[1].chips).toBe(800 + 25)
      expect(result.players[2].chips).toBe(800 + 25)
      expect(result.players[3].chips).toBe(800 + 25)
      expect(result.pot).toBe(0)
      // チップ保存則
      const totalChips = calcTotalChips(result)
      expect(totalChips).toBe(800 * 4 + 103)
    })
  })

  describe('evaluateShowdown ポット配分の正当性', () => {
    test('should keep all players chips non-negative when all-in players with different chip amounts win', () => {
      // Given: 異なるchips額でオールインした複数プレイヤー（chips=0）がショーダウンに到達
      const players: Player[] = [
        createTestPlayer({ id: 'player-0', chips: 0 }), // オールインで残り0
        createTestPlayer({ id: 'player-1', chips: 0 }), // オールインで残り0
        createTestPlayer({ id: 'player-2', chips: 500, folded: true }),
      ]
      const state = createTestState({
        players,
        pot: 1500,
        communityCards: [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
        ],
      })

      // When: ショーダウンを評価する
      const result = evaluateShowdown(state)

      // Then: 全プレイヤーのchipsが0以上
      for (const p of result.players) {
        expect(p.chips).toBeGreaterThanOrEqual(0)
      }
      // チップ保存則
      const totalChips = calcTotalChips(result)
      expect(totalChips).toBe(0 + 0 + 500 + 1500)
    })

    test('should correctly distribute pot to a winner with chips=0', () => {
      // Given: オールインしてchips=0のプレイヤーが最強ハンドで勝利
      const players: Player[] = [
        createTestPlayer({
          id: 'player-0',
          chips: 0,
          holeCards: [card('A', 'diamonds'), card('K', 'diamonds')],
        }),
        createTestPlayer({
          id: 'player-1',
          chips: 800,
          holeCards: [card('2', 'clubs'), card('3', 'clubs')],
        }),
      ]
      const state = createTestState({
        players,
        pot: 200,
        communityCards: [
          card('Q', 'diamonds'),
          card('J', 'diamonds'),
          card('10', 'diamonds'),
          card('4', 'spades'),
          card('5', 'hearts'),
        ],
      })

      // When: ショーダウンを評価する
      const result = evaluateShowdown(state)

      // Then: chips=0の勝者にpot全額が加算される
      expect(result.players[0].chips).toBe(200)
      expect(result.players[1].chips).toBe(800)
      expect(result.pot).toBe(0)
      // チップ保存則
      const totalChips = calcTotalChips(result)
      expect(totalChips).toBe(0 + 800 + 200)
    })

    test('should handle pot=0 without error', () => {
      // Given: ポットが0の状態でショーダウンに到達
      const players: Player[] = [
        createTestPlayer({ id: 'player-0', chips: 1000 }),
        createTestPlayer({ id: 'player-1', chips: 1000 }),
      ]
      const state = createTestState({
        players,
        pot: 0,
        communityCards: [
          card('A', 'spades'),
          card('K', 'spades'),
          card('Q', 'spades'),
          card('J', 'spades'),
          card('10', 'spades'),
        ],
      })

      // When: ショーダウンを評価する
      const result = evaluateShowdown(state)

      // Then: エラーなく処理され、chipsは変わらず、potは0
      expect(result.players[0].chips).toBe(1000)
      expect(result.players[1].chips).toBe(1000)
      expect(result.pot).toBe(0)
      for (const p of result.players) {
        expect(p.chips).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('resolveUncontestedPot', () => {
    test('should award pot to last remaining player when all others folded', () => {
      // Given: 1人以外全員フォールド
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: 900,
          folded: i !== 2,
        })
      )
      const state = createTestState({ players, pot: 500 })

      // When: 無争のポットを解決する
      const result = resolveUncontestedPot(state)

      // Then: 残ったプレイヤーにポットが配分される
      expect(result.players[2].chips).toBe(1400)
      expect(result.pot).toBe(0)
    })

    test('should not mutate original state', () => {
      // Given: 初期状態
      const players = Array.from({ length: 5 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          folded: i !== 0,
        })
      )
      const state = createTestState({ players, pot: 100 })
      const originalPot = state.pot

      // When: 無争のポットを解決する
      resolveUncontestedPot(state)

      // Then: 元の状態は変更されていない
      expect(state.pot).toBe(originalPot)
    })
  })

  describe('resolveUncontestedPot ポット配分の正当性', () => {
    test('should keep winner chips non-negative when winner had chips=0', () => {
      // Given: オールインしてchips=0の勝者（他全員フォールド）
      const players: Player[] = [
        createTestPlayer({ id: 'player-0', chips: 0, folded: true }),
        createTestPlayer({ id: 'player-1', chips: 0 }),
        createTestPlayer({ id: 'player-2', chips: 500, folded: true }),
      ]
      const state = createTestState({ players, pot: 300 })

      // When: 無争のポットを解決する
      const result = resolveUncontestedPot(state)

      // Then: chips=0の勝者にpotが加算され、全プレイヤーのchipsが0以上
      expect(result.players[1].chips).toBe(300)
      expect(result.pot).toBe(0)
      for (const p of result.players) {
        expect(p.chips).toBeGreaterThanOrEqual(0)
      }
      // チップ保存則
      const totalChips = calcTotalChips(result)
      expect(totalChips).toBe(0 + 0 + 500 + 300)
    })

    test('should handle pot=0 without error', () => {
      // Given: ポットが0の状態
      const players = Array.from({ length: 3 }, (_, i) =>
        createTestPlayer({
          id: `player-${i}`,
          chips: 1000,
          folded: i !== 0,
        })
      )
      const state = createTestState({ players, pot: 0 })

      // When: 無争のポットを解決する
      const result = resolveUncontestedPot(state)

      // Then: エラーなく処理され、chipsは変わらず
      expect(result.players[0].chips).toBe(1000)
      expect(result.pot).toBe(0)
      for (const p of result.players) {
        expect(p.chips).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
