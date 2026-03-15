import { describe, expect, test } from 'vitest'
import { setupNewGame } from './gameSetup'
import { PLAYER_COUNT, INITIAL_CHIPS, BIG_BLIND } from './constants'

describe('gameSetup', () => {
  describe('setupNewGame', () => {
    test('should create game with correct number of players', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.5

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: PLAYER_COUNT人のプレイヤーがいる
      expect(state.players).toHaveLength(PLAYER_COUNT)
    })

    test('should assign exactly one human player', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.3

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: 人間プレイヤーが1人だけいる
      const humanPlayers = state.players.filter((p) => p.isHuman)
      expect(humanPlayers).toHaveLength(1)
    })

    test('should assign human player ID to humanPlayerId', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.7

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: humanPlayerIdが人間プレイヤーのIDと一致する
      const humanPlayer = state.players.find((p) => p.isHuman)
      expect(state.humanPlayerId).toBe(humanPlayer!.id)
    })

    test('should give each player initial chips', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.5

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: ブラインドポスト後、合計チップは初期値×人数と一致する
      const totalChips =
        state.players.reduce((sum, p) => sum + p.chips, 0) + state.pot
      expect(totalChips).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })

    test('should deal 2 hole cards to each player', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.5

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: 各プレイヤーが2枚のホールカードを持つ
      for (const player of state.players) {
        expect(player.holeCards).toHaveLength(2)
      }
    })

    test('should set phase to preflop', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.5

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: フェーズがpreflopである
      expect(state.phase).toBe('preflop')
    })

    test('should post blinds with pot equal to SB + BB', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.5

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: ポットにSB+BBが入っている
      expect(state.pot).toBeGreaterThanOrEqual(15)
    })

    test('should set currentBet to BIG_BLIND', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.5

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: currentBetがBIG_BLINDである
      expect(state.currentBet).toBe(BIG_BLIND)
    })

    test('should have empty community cards', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.5

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: コミュニティカードが空である
      expect(state.communityCards).toHaveLength(0)
    })

    test('should produce different human seat with different randomFn', () => {
      // Given: 異なるrandomFn
      const randomFn1 = () => 0.1
      const randomFn2 = () => 0.9

      // When: 異なるrandomFnでセットアップする
      const state1 = setupNewGame(randomFn1)
      const state2 = setupNewGame(randomFn2)

      // Then: 人間の席が異なる
      const humanIndex1 = state1.players.findIndex((p) => p.isHuman)
      const humanIndex2 = state2.players.findIndex((p) => p.isHuman)
      expect(humanIndex1).not.toBe(humanIndex2)
    })

    test('should have deck with remaining cards after dealing', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.5

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: デッキに52 - (プレイヤー数 × 2)枚が残る
      const dealtCards = PLAYER_COUNT * 2
      expect(state.deck).toHaveLength(52 - dealtCards)
    })

    test('should set lastAggressorIndex to BB index after posting blinds', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.5

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: lastAggressorIndexがBBのインデックスである（プリフロップでBBにアクション権を保証するため）
      const bbIndex = (state.dealerIndex + 2) % PLAYER_COUNT
      expect(state.lastAggressorIndex).toBe(bbIndex)
    })

    test('should have all players with folded false', () => {
      // Given: 固定のrandomFn
      const randomFn = () => 0.5

      // When: 新しいゲームをセットアップする
      const state = setupNewGame(randomFn)

      // Then: 全プレイヤーがフォールドしていない
      for (const player of state.players) {
        expect(player.folded).toBe(false)
      }
    })
  })
})
