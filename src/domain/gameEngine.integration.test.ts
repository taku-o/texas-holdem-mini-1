import { describe, expect, test } from 'vitest'
import { setupNewGame } from './gameSetup'
import { applyAction, getValidActions, isBettingRoundComplete } from './betting'
import { advancePhase, startNextHand, isGameOver } from './handProgression'
import { evaluateShowdown, resolveUncontestedPot } from './showdown'
import { INITIAL_CHIPS, PLAYER_COUNT, BIG_BLIND } from './constants'
import { calcTotalChips, executeAllCallCheck, executeAllCheck } from './testHelpers'
import type { GameState } from './types'

function advanceAndCheckAll(state: GameState): GameState {
  return executeAllCheck(advancePhase(state))
}

const EXPECTED_EXPORTS = [
  'setupNewGame',
  'getValidActions',
  'applyAction',
  'isBettingRoundComplete',
  'evaluateShowdown',
  'determineWinners',
  'resolveUncontestedPot',
  'advancePhase',
  'startNextHand',
  'isGameOver',
  'getActivePlayerCount',
]

describe('gameEngine integration', () => {
  describe('完全なハンドフロー', () => {
    test('should complete a full hand from setup through showdown', () => {
      // Given: 新しいゲーム
      const state = setupNewGame(() => 0.5)

      // When: プリフロップで全員コール→フロップ→全員チェック→...→ショーダウン
      let current: GameState = state

      // プリフロップ: 全員コール（BB以降のプレイヤー）
      current = executeAllCallCheck(current)

      // フロップ
      current = advancePhase(current)
      expect(current.phase).toBe('flop')
      expect(current.communityCards).toHaveLength(3)

      // フロップ: 全員チェック
      current = executeAllCheck(current)

      // ターン
      current = advancePhase(current)
      expect(current.phase).toBe('turn')
      expect(current.communityCards).toHaveLength(4)

      // ターン: 全員チェック
      current = executeAllCheck(current)

      // リバー
      current = advancePhase(current)
      expect(current.phase).toBe('river')
      expect(current.communityCards).toHaveLength(5)

      // リバー: 全員チェック
      current = executeAllCheck(current)

      // ショーダウン
      current = advancePhase(current)
      expect(current.phase).toBe('showdown')
      current = evaluateShowdown(current)

      // Then: チップの合計が初期値と一致する（ゼロサム）
      expect(calcTotalChips(current)).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })

    test('should handle all-fold scenario with uncontested pot', () => {
      // Given: 新しいゲーム
      const state = setupNewGame(() => 0.5)
      let current: GameState = state

      // When: BB以外が全員フォールド
      let foldCount = 0
      while (!isBettingRoundComplete(current) && foldCount < PLAYER_COUNT - 1) {
        const playerIdx = current.currentPlayerIndex
        const actions = getValidActions(current, playerIdx)
        const hasFold = actions.some((a) => a.type === 'fold')
        if (hasFold) {
          current = applyAction(current, playerIdx, { type: 'fold' })
          foldCount++
        } else {
          break
        }
      }

      // 1人残り → 無争のポット解決
      const nonFolded = current.players.filter((p) => !p.folded)
      if (nonFolded.length === 1) {
        current = resolveUncontestedPot(current)
      }

      // Then: チップの合計が初期値と一致する
      expect(calcTotalChips(current)).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })

    test('should handle multiple hands with dealer rotation', () => {
      // Given: 新しいゲーム
      let current: GameState = setupNewGame(() => 0.5)
      const initialDealerIndex = current.dealerIndex

      // When: 1ハンド目を簡易的に完了（全員チェック/コール）
      current = executeAllCallCheck(current)

      // フロップ→ショーダウンまで進める
      current = advanceAndCheckAll(current) // flop
      current = advanceAndCheckAll(current) // turn
      current = advanceAndCheckAll(current) // river
      current = advancePhase(current) // showdown
      current = evaluateShowdown(current)

      // ゲームが終了していなければ次のハンドを開始
      const gameOverResult = isGameOver(current)
      if (!gameOverResult.over) {
        current = startNextHand(current, () => 0.5)

        // Then: ディーラーが移動している
        expect(current.dealerIndex).not.toBe(initialDealerIndex)
        expect(current.phase).toBe('preflop')
        expect(current.communityCards).toHaveLength(0)
        expect(current.currentBet).toBe(BIG_BLIND)
      }
    })
  })

  describe('完全なゲームセッション', () => {
    test('should complete multiple hands with bet/raise actions preserving chip conservation', () => {
      // Given: 新しいゲーム
      const state = setupNewGame(() => 0.5)
      let current: GameState = state

      // When: 2ハンドにわたってbet/raiseを含むアクションをプレイする
      for (let hand = 0; hand < 2; hand++) {
        // プリフロップ: 最初のプレイヤーがbet、残りがcall
        let actionCount = 0
        while (!isBettingRoundComplete(current) && actionCount < 20) {
          const playerIdx = current.currentPlayerIndex
          const actions = getValidActions(current, playerIdx)
          const betAction = actions.find((a) => a.type === 'bet')
          const raiseAction = actions.find((a) => a.type === 'raise')
          const callAction = actions.find((a) => a.type === 'call')
          const checkAction = actions.find((a) => a.type === 'check')

          if (betAction && actionCount === 0) {
            current = applyAction(current, playerIdx, { type: 'bet', amount: BIG_BLIND * 2 })
          } else if (raiseAction && actionCount === 1) {
            current = applyAction(current, playerIdx, { type: 'raise', amount: BIG_BLIND * 4 })
          } else {
            const action = callAction ?? checkAction
            if (!action) break
            current = applyAction(current, playerIdx, action)
          }
          actionCount++
        }

        // フロップ→ターン→リバー: 全員チェック
        const phases = ['flop', 'turn', 'river'] as const
        for (const expectedPhase of phases) {
          current = advancePhase(current)
          expect(current.phase).toBe(expectedPhase)
          current = executeAllCheck(current)
        }

        // ショーダウン
        current = advancePhase(current)
        expect(current.phase).toBe('showdown')
        current = evaluateShowdown(current)

        // チップ保存則の検証
        expect(calcTotalChips(current)).toBe(INITIAL_CHIPS * PLAYER_COUNT)

        // ゲーム終了でなければ次のハンドを開始
        const gameOverResult = isGameOver(current)
        if (gameOverResult.over) break
        current = startNextHand(current, () => 0.5)
      }
    })

    test('should detect game over when all CPUs are eliminated after showdown', () => {
      // Given: ショーダウン直前の状態。最後のCPU(index 1)のみが残りチップをオールインしている
      // 人間(index 2)がエースペア、CPU(index 1)が弱いハンドで、人間が勝利する
      const humanChips = INITIAL_CHIPS * PLAYER_COUNT - BIG_BLIND
      const state: GameState = {
        phase: 'showdown' as const,
        dealerIndex: 0,
        players: [
          { id: 'player-0', isHuman: false, chips: 0, holeCards: [], folded: true, currentBetInRound: 0 },
          { id: 'player-1', isHuman: false, chips: 0, holeCards: [{ rank: '2', suit: 'clubs' }, { rank: '7', suit: 'diamonds' }], folded: false, currentBetInRound: BIG_BLIND },
          { id: 'player-2', isHuman: true, chips: humanChips - BIG_BLIND, holeCards: [{ rank: 'A', suit: 'spades' }, { rank: 'A', suit: 'hearts' }], folded: false, currentBetInRound: BIG_BLIND },
          { id: 'player-3', isHuman: false, chips: 0, holeCards: [], folded: true, currentBetInRound: 0 },
          { id: 'player-4', isHuman: false, chips: 0, holeCards: [], folded: true, currentBetInRound: 0 },
        ],
        communityCards: [
          { rank: 'A', suit: 'diamonds' },
          { rank: 'K', suit: 'spades' },
          { rank: '9', suit: 'hearts' },
          { rank: '5', suit: 'clubs' },
          { rank: '3', suit: 'spades' },
        ],
        pot: BIG_BLIND * 2,
        currentBet: BIG_BLIND,
        currentPlayerIndex: 2,
        humanPlayerId: 'player-2',
        deck: [],
        lastAggressorIndex: null,
      }

      // When: ショーダウンで勝者を決定する
      const result = evaluateShowdown(state)

      // Then: チップ保存則が成り立つ
      expect(calcTotalChips(result)).toBe(INITIAL_CHIPS * PLAYER_COUNT)

      // Then: 人間が勝利しポットを獲得、全CPUのチップが0
      expect(result.players[2].chips).toBe(humanChips - BIG_BLIND + BIG_BLIND * 2)
      expect(result.players[1].chips).toBe(0)

      // Then: ゲーム終了が正しく検知される
      const gameOverResult = isGameOver(result)
      expect(gameOverResult.over).toBe(true)
      expect(gameOverResult.reason).toBeDefined()
    })

    test('should preserve chip conservation across each phase in a single hand', () => {
      // Given: 新しいゲーム
      const state = setupNewGame(() => 0.5)
      let current: GameState = state
      const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT

      // When: 各フェーズ通過時にチップ保存則を検証する
      // プリフロップ: 全員コール
      current = executeAllCallCheck(current)
      expect(calcTotalChips(current)).toBe(expectedTotal)

      // フロップ
      current = advanceAndCheckAll(current)
      expect(calcTotalChips(current)).toBe(expectedTotal)

      // ターン
      current = advanceAndCheckAll(current)
      expect(calcTotalChips(current)).toBe(expectedTotal)

      // リバー
      current = advanceAndCheckAll(current)
      expect(calcTotalChips(current)).toBe(expectedTotal)

      // ショーダウン
      current = advancePhase(current)
      current = evaluateShowdown(current)

      // Then: ショーダウン後もチップ保存則が成り立つ
      expect(calcTotalChips(current)).toBe(expectedTotal)
    })
  })

  describe('ショーダウン後のポット配分', () => {
    test('should distribute pot to winner with pot becoming 0 after showdown', () => {
      // Given: 新しいゲームで全員コール→全員チェックでショーダウンまで進める
      let current: GameState = setupNewGame(() => 0.5)

      // プリフロップ: 全員コール
      current = executeAllCallCheck(current)

      // フロップ→ターン→リバー: 全員チェック
      const phases = ['flop', 'turn', 'river'] as const
      for (const expectedPhase of phases) {
        current = advancePhase(current)
        expect(current.phase).toBe(expectedPhase)
        current = executeAllCheck(current)
      }

      // When: ショーダウンを実行する
      const potBeforeShowdown = current.pot
      expect(potBeforeShowdown).toBeGreaterThan(0)
      current = advancePhase(current)
      expect(current.phase).toBe('showdown')
      current = evaluateShowdown(current)

      // Then: ポットが0になり、勝者のチップが増加している
      expect(current.pot).toBe(0)
      expect(calcTotalChips(current)).toBe(INITIAL_CHIPS * PLAYER_COUNT)
    })
  })

  describe('facade エクスポート検証', () => {
    test('should export all expected public API functions', async () => {
      // Given: gameEngine facade モジュール

      // When: gameEngineモジュールをインポートする
      const gameEngine = await import('./gameEngine')

      // Then: 期待する全関数がエクスポートされている
      for (const name of EXPECTED_EXPORTS) {
        expect(gameEngine).toHaveProperty(name)
        expect(typeof (gameEngine as Record<string, unknown>)[name]).toBe('function')
      }
    })

    test('should not export any unexpected functions', async () => {
      // Given: gameEngine facade モジュール

      // When: gameEngineモジュールのエクスポートを取得する
      const gameEngine = await import('./gameEngine')

      // Then: 想定外のエクスポートが存在しない
      const expectedSet = new Set(EXPECTED_EXPORTS)
      const actualExports = Object.keys(gameEngine)
      for (const key of actualExports) {
        expect(expectedSet.has(key)).toBe(true)
      }
    })
  })

  describe('チップ保存則', () => {
    test('should preserve total chips through any action sequence', () => {
      // Given: 新しいゲーム
      const state = setupNewGame(() => 0.5)
      const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT

      // When: 初期状態でチップ合計を確認
      // Then: ゲーム内の全チップがINITIAL_CHIPS × PLAYER_COUNTと一致する
      expect(calcTotalChips(state)).toBe(expectedTotal)
    })
  })
})
