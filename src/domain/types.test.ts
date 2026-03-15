import { describe, expect, test } from 'vitest'
import type {
  Suit,
  Rank,
  Card,
  Player,
  ActionType,
  PlayerAction,
  GamePhase,
  GameState,
  HandRankCategory,
  HandRank,
} from './types'

describe('types', () => {
  describe('Card', () => {
    test('should accept valid suit and rank combination', () => {
      // Given: 有効なスートとランク
      const card: Card = { suit: 'spades', rank: 'A' }

      // When: Card型として使用する
      // Then: 正しいプロパティを持つ
      expect(card.suit).toBe('spades')
      expect(card.rank).toBe('A')
    })

    test('should accept all four suits', () => {
      // Given: 4つのスート
      const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']

      // When: 各スートでカードを生成する
      const cards: Card[] = suits.map((suit) => ({ suit, rank: '2' as Rank }))

      // Then: 4枚のカードが生成される
      expect(cards).toHaveLength(4)
    })

    test('should accept all thirteen ranks', () => {
      // Given: 13のランク
      const ranks: Rank[] = [
        '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
      ]

      // When: 各ランクでカードを生成する
      const cards: Card[] = ranks.map((rank) => ({
        suit: 'hearts' as Suit,
        rank,
      }))

      // Then: 13枚のカードが生成される
      expect(cards).toHaveLength(13)
    })

    test('should create a full deck of 52 unique cards', () => {
      // Given: 全スートと全ランク
      const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
      const ranks: Rank[] = [
        '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
      ]

      // When: 全組み合わせでカードを生成する
      const deck: Card[] = suits.flatMap((suit) =>
        ranks.map((rank) => ({ suit, rank }))
      )

      // Then: 52枚のユニークなカードが生成される
      expect(deck).toHaveLength(52)
      const serialized = deck.map((c) => `${c.suit}-${c.rank}`)
      const unique = new Set(serialized)
      expect(unique.size).toBe(52)
    })
  })

  describe('Player', () => {
    test('should accept valid human player', () => {
      // Given: 人間プレイヤーの情報
      const player: Player = {
        id: 'player-1',
        isHuman: true,
        chips: 1000,
        holeCards: [],
        folded: false,
        currentBetInRound: 0,
      }

      // When: Player型として使用する
      // Then: 正しいプロパティを持つ
      expect(player.isHuman).toBe(true)
      expect(player.chips).toBe(1000)
      expect(player.holeCards).toHaveLength(0)
      expect(player.folded).toBe(false)
    })

    test('should accept valid CPU player', () => {
      // Given: CPUプレイヤーの情報
      const player: Player = {
        id: 'cpu-1',
        isHuman: false,
        chips: 1000,
        holeCards: [],
        folded: false,
        currentBetInRound: 0,
      }

      // When: Player型として使用する
      // Then: isHumanがfalse
      expect(player.isHuman).toBe(false)
    })

    test('should accept player with two hole cards', () => {
      // Given: ホールカード2枚を持つプレイヤー
      const holeCards: Card[] = [
        { suit: 'spades', rank: 'A' },
        { suit: 'hearts', rank: 'K' },
      ]
      const player: Player = {
        id: 'player-1',
        isHuman: true,
        chips: 995,
        holeCards,
        folded: false,
        currentBetInRound: 5,
      }

      // When: ホールカードを確認する
      // Then: 2枚のカードを持つ
      expect(player.holeCards).toHaveLength(2)
    })

    test('should accept player with folded state', () => {
      // Given: フォールドしたプレイヤー
      const player: Player = {
        id: 'player-1',
        isHuman: true,
        chips: 990,
        holeCards: [
          { suit: 'clubs', rank: '2' },
          { suit: 'diamonds', rank: '7' },
        ],
        folded: true,
        currentBetInRound: 10,
      }

      // When: フォールド状態を確認する
      // Then: foldedがtrue
      expect(player.folded).toBe(true)
    })

    test('should accept player with zero chips', () => {
      // Given: チップが0のプレイヤー（オールイン後）
      const player: Player = {
        id: 'player-1',
        isHuman: false,
        chips: 0,
        holeCards: [
          { suit: 'spades', rank: 'A' },
          { suit: 'spades', rank: 'K' },
        ],
        folded: false,
        currentBetInRound: 1000,
      }

      // When: チップを確認する
      // Then: 0チップが許容される
      expect(player.chips).toBe(0)
    })
  })

  describe('PlayerAction', () => {
    test('should accept fold action without amount', () => {
      // Given: フォールドアクション
      const action: PlayerAction = { type: 'fold' }

      // When: アクション型を確認する
      // Then: foldタイプである
      expect(action.type).toBe('fold')
      expect(action.amount).toBeUndefined()
    })

    test('should accept check action without amount', () => {
      // Given: チェックアクション
      const action: PlayerAction = { type: 'check' }

      // When: アクション型を確認する
      // Then: checkタイプである
      expect(action.type).toBe('check')
    })

    test('should accept call action without amount', () => {
      // Given: コールアクション
      const action: PlayerAction = { type: 'call' }

      // When: アクション型を確認する
      // Then: callタイプである
      expect(action.type).toBe('call')
    })

    test('should accept bet action with amount', () => {
      // Given: ベットアクション
      const action: PlayerAction = { type: 'bet', amount: 50 }

      // When: アクション型を確認する
      // Then: betタイプで金額が設定されている
      expect(action.type).toBe('bet')
      expect(action.amount).toBe(50)
    })

    test('should accept raise action with amount', () => {
      // Given: レイズアクション
      const action: PlayerAction = { type: 'raise', amount: 100 }

      // When: アクション型を確認する
      // Then: raiseタイプで金額が設定されている
      expect(action.type).toBe('raise')
      expect(action.amount).toBe(100)
    })

    test('should cover all five action types', () => {
      // Given: 全5種のアクションタイプ
      const actionTypes: ActionType[] = [
        'fold', 'check', 'call', 'bet', 'raise',
      ]

      // When: 各アクションを生成する
      const actions: PlayerAction[] = actionTypes.map((type) => ({ type }))

      // Then: 5種類のアクションが生成される
      expect(actions).toHaveLength(5)
    })
  })

  describe('GamePhase', () => {
    test('should accept all game phases', () => {
      // Given: 全ゲームフェーズ
      const phases: GamePhase[] = [
        'idle', 'preflop', 'flop', 'turn', 'river', 'showdown',
      ]

      // When: フェーズの数を確認する
      // Then: 6つのフェーズがある
      expect(phases).toHaveLength(6)
    })

    test('should include idle as initial phase', () => {
      // Given: アイドルフェーズ
      const phase: GamePhase = 'idle'

      // When: 値を確認する
      // Then: idleである
      expect(phase).toBe('idle')
    })

    test('should include showdown as final playing phase', () => {
      // Given: ショーダウンフェーズ
      const phase: GamePhase = 'showdown'

      // When: 値を確認する
      // Then: showdownである
      expect(phase).toBe('showdown')
    })
  })

  describe('GameState', () => {
    test('should accept valid initial game state', () => {
      // Given: 初期ゲーム状態
      const state: GameState = {
        phase: 'idle',
        dealerIndex: 0,
        players: [],
        communityCards: [],
        pot: 0,
        currentBet: 0,
        currentPlayerIndex: 0,
        humanPlayerId: 'player-1',
        deck: [],
      }

      // When: 初期状態を確認する
      // Then: idle状態でポットが0
      expect(state.phase).toBe('idle')
      expect(state.pot).toBe(0)
      expect(state.communityCards).toHaveLength(0)
    })

    test('should accept game state during preflop', () => {
      // Given: プリフロップ中のゲーム状態
      const players: Player[] = Array.from({ length: 5 }, (_, i) => ({
        id: i === 0 ? 'human-1' : `cpu-${i}`,
        isHuman: i === 0,
        chips: i === 1 ? 995 : i === 2 ? 990 : 1000,
        holeCards: [
          { suit: 'spades' as Suit, rank: 'A' as Rank },
          { suit: 'hearts' as Suit, rank: 'K' as Rank },
        ],
        folded: false,
        currentBetInRound: i === 1 ? 5 : i === 2 ? 10 : 0,
      }))

      const state: GameState = {
        phase: 'preflop',
        dealerIndex: 0,
        players,
        communityCards: [],
        pot: 15,
        currentBet: 10,
        currentPlayerIndex: 3,
        humanPlayerId: 'human-1',
        deck: [],
      }

      // When: プリフロップ状態を確認する
      // Then: 5人のプレイヤーがいてコミュニティカードはなし
      expect(state.players).toHaveLength(5)
      expect(state.communityCards).toHaveLength(0)
      expect(state.phase).toBe('preflop')
    })

    test('should accept game state during flop with 3 community cards', () => {
      // Given: フロップ中のゲーム状態
      const communityCards: Card[] = [
        { suit: 'spades', rank: '10' },
        { suit: 'hearts', rank: 'J' },
        { suit: 'diamonds', rank: 'Q' },
      ]

      const state: GameState = {
        phase: 'flop',
        dealerIndex: 0,
        players: [],
        communityCards,
        pot: 30,
        currentBet: 0,
        currentPlayerIndex: 0,
        humanPlayerId: 'human-1',
        deck: [],
      }

      // When: フロップ状態のコミュニティカードを確認する
      // Then: 3枚のコミュニティカードがある
      expect(state.communityCards).toHaveLength(3)
    })

    test('should accept game state during turn with 4 community cards', () => {
      // Given: ターン中のゲーム状態
      const communityCards: Card[] = [
        { suit: 'spades', rank: '10' },
        { suit: 'hearts', rank: 'J' },
        { suit: 'diamonds', rank: 'Q' },
        { suit: 'clubs', rank: 'K' },
      ]

      const state: GameState = {
        phase: 'turn',
        dealerIndex: 0,
        players: [],
        communityCards,
        pot: 60,
        currentBet: 0,
        currentPlayerIndex: 0,
        humanPlayerId: 'human-1',
        deck: [],
      }

      // When: ターン状態のコミュニティカードを確認する
      // Then: 4枚のコミュニティカードがある
      expect(state.communityCards).toHaveLength(4)
    })

    test('should accept game state during river with 5 community cards', () => {
      // Given: リバー中のゲーム状態
      const communityCards: Card[] = [
        { suit: 'spades', rank: '10' },
        { suit: 'hearts', rank: 'J' },
        { suit: 'diamonds', rank: 'Q' },
        { suit: 'clubs', rank: 'K' },
        { suit: 'spades', rank: 'A' },
      ]

      const state: GameState = {
        phase: 'river',
        dealerIndex: 0,
        players: [],
        communityCards,
        pot: 120,
        currentBet: 0,
        currentPlayerIndex: 0,
        humanPlayerId: 'human-1',
        deck: [],
      }

      // When: リバー状態のコミュニティカードを確認する
      // Then: 5枚のコミュニティカードがある
      expect(state.communityCards).toHaveLength(5)
    })

    test('should track dealer index for button position', () => {
      // Given: ディーラーインデックスが設定されたゲーム状態
      const state: GameState = {
        phase: 'preflop',
        dealerIndex: 3,
        players: [],
        communityCards: [],
        pot: 0,
        currentBet: 0,
        currentPlayerIndex: 0,
        humanPlayerId: 'human-1',
        deck: [],
      }

      // When: ディーラーインデックスを確認する
      // Then: 指定した値が設定されている
      expect(state.dealerIndex).toBe(3)
    })

    test('should hold deck for card distribution management', () => {
      // Given: デッキを持つゲーム状態
      const deck: Card[] = [
        { suit: 'spades', rank: '2' },
        { suit: 'hearts', rank: '3' },
      ]

      const state: GameState = {
        phase: 'preflop',
        dealerIndex: 0,
        players: [],
        communityCards: [],
        pot: 0,
        currentBet: 0,
        currentPlayerIndex: 0,
        humanPlayerId: 'human-1',
        deck,
      }

      // When: デッキを確認する
      // Then: 残りカードが保持されている
      expect(state.deck).toHaveLength(2)
    })
  })

  describe('HandRank', () => {
    test('should accept valid hand rank', () => {
      // Given: ワンペアの役ランク
      const handRank: HandRank = {
        category: 'one-pair',
        score: 2000,
      }

      // When: 役ランクを確認する
      // Then: カテゴリとスコアが正しい
      expect(handRank.category).toBe('one-pair')
      expect(handRank.score).toBe(2000)
    })

    test('should accept all hand rank categories', () => {
      // Given: 全10種の役カテゴリ
      const categories: HandRankCategory[] = [
        'high-card',
        'one-pair',
        'two-pair',
        'three-of-a-kind',
        'straight',
        'flush',
        'full-house',
        'four-of-a-kind',
        'straight-flush',
        'royal-flush',
      ]

      // When: カテゴリ数を確認する
      // Then: 10種類のカテゴリがある
      expect(categories).toHaveLength(10)
    })

    test('should allow score comparison between hand ranks', () => {
      // Given: 異なる強さの役ランク
      const highCard: HandRank = { category: 'high-card', score: 1000 }
      const onePair: HandRank = { category: 'one-pair', score: 2000 }
      const royalFlush: HandRank = { category: 'royal-flush', score: 10000 }

      // When: スコアで比較する
      // Then: スコアで強弱が判定できる
      expect(highCard.score).toBeLessThan(onePair.score)
      expect(onePair.score).toBeLessThan(royalFlush.score)
    })
  })
})
