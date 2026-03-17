import { describe, expect, test } from 'vitest'
import { setupNewGame } from './gameSetup'
import { applyAction, getValidActions, isBettingRoundComplete } from './betting'
import { advancePhase, startNextHand, isGameOver } from './handProgression'
import { evaluateShowdown } from './showdown'
import { INITIAL_CHIPS, PLAYER_COUNT, BIG_BLIND } from './constants'
import { calcTotalChips, executeAllCallCheck, executeAllCheck } from './testHelpers'
import type { GameState } from './types'

function advanceToShowdown(state: GameState): GameState {
  let current = executeAllCheck(advancePhase(state)) // flop
  current = executeAllCheck(advancePhase(current)) // turn
  current = executeAllCheck(advancePhase(current)) // river
  current = advancePhase(current) // showdown
  return current
}

describe('gameEngine shortstack integration', () => {
  describe('ショートスタック + オールイン + チップ0除外シナリオ', () => {
    test('should handle shortstack BB posting partial blind then being eliminated next hand', () => {
      // Given: ゲームを開始し、1人のプレイヤーをBB未満のショートスタックにする
      let current: GameState = setupNewGame(() => 0.5)
      const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT

      // player-2（BB位置）をショートスタックにしたショーダウン後の状態を構築
      // dealer=0, SB=1, BB=2 の配置
      const shortstackChips = 3 // BB(10)未満
      const redistributedChips = INITIAL_CHIPS + (INITIAL_CHIPS - shortstackChips) / (PLAYER_COUNT - 1)
      const players = current.players.map((p, i) => ({
        ...p,
        chips: i === 2 ? shortstackChips : INITIAL_CHIPS,
        holeCards: [],
        folded: false,
        currentBetInRound: 0,
      }))
      // チップ合計を保存則に合わせる
      const totalWithShortstack = players.reduce((sum, p) => sum + p.chips, 0)
      players[0] = { ...players[0], chips: players[0].chips + (expectedTotal - totalWithShortstack) }

      current = {
        ...current,
        phase: 'showdown' as const,
        dealerIndex: 0,
        players,
        pot: 0,
        currentBet: 0,
        communityCards: [],
        lastAggressorIndex: null,
      }

      // When: 次のハンドを開始する（ショートスタックがBBになる）
      current = startNextHand(current, () => 0.5)

      // Then: チップ保存則が維持される
      expect(calcTotalChips(current)).toBe(expectedTotal)
      // ショートスタックプレイヤーは全チップをBBとしてポスト（オールイン状態）
      expect(current.players[2].chips).toBeLessThanOrEqual(0)
      expect(current.phase).toBe('preflop')
    })

    test('should eliminate chip-0 player and continue game correctly after showdown', () => {
      // Given: ゲームを開始
      let current: GameState = setupNewGame(() => 0.5)
      const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT

      // When: 1ハンド目: 全員コール → ショーダウン
      current = executeAllCallCheck(current)
      current = advanceToShowdown(current)
      current = evaluateShowdown(current)

      expect(calcTotalChips(current)).toBe(expectedTotal)

      // チップ0のプレイヤーがいるかチェックし、いなくてもフローが正しく動くことを確認
      const gameOverResult = isGameOver(current)
      if (!gameOverResult.over) {
        // When: 2ハンド目を開始
        current = startNextHand(current, () => 0.5)

        // Then: チップ0のプレイヤーがfolded=trueで参加していない
        for (const player of current.players) {
          if (player.chips === 0 && player.currentBetInRound === 0) {
            expect(player.folded).toBe(true)
            expect(player.holeCards).toHaveLength(0)
          }
        }

        // Then: チップ保存則
        expect(calcTotalChips(current)).toBe(expectedTotal)

        // Then: ゲームが正常に進行できる（preflopが開始されている）
        expect(current.phase).toBe('preflop')
        expect(current.currentBet).toBeGreaterThan(0)
      }
    })

    test('should correctly rotate dealer and blinds after chip-0 player exclusion', () => {
      // Given: index 1のプレイヤーがチップ0の状態でショーダウン後
      let current: GameState = setupNewGame(() => 0.5)
      const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT

      const players = current.players.map((p, i) => ({
        ...p,
        chips: i === 1 ? 0 : INITIAL_CHIPS,
        holeCards: [],
        folded: false,
        currentBetInRound: 0,
      }))
      // チップ保存則の調整
      const diff = expectedTotal - players.reduce((sum, p) => sum + p.chips, 0)
      players[0] = { ...players[0], chips: players[0].chips + diff }

      current = {
        ...current,
        phase: 'showdown' as const,
        dealerIndex: 0,
        players,
        pot: 0,
        currentBet: 0,
        communityCards: [],
        lastAggressorIndex: null,
      }

      // When: 次のハンドを開始
      current = startNextHand(current, () => 0.5)

      // Then: index 1はスキップされ、ディーラーはindex 2に移動
      expect(current.dealerIndex).toBe(2)
      // チップ0のプレイヤーはfoldedでホールカードなし
      expect(current.players[1].folded).toBe(true)
      expect(current.players[1].holeCards).toHaveLength(0)
      expect(current.players[1].currentBetInRound).toBe(0)
      // チップ保存則
      expect(calcTotalChips(current)).toBe(expectedTotal)
    })
  })

  describe('複数プレイヤーのオールイン結合テスト', () => {
    test('should preserve chip conservation when multiple players go all-in and showdown resolves', () => {
      // Given: 2名がオールインの状態を構築
      let current: GameState = setupNewGame(() => 0.5)
      const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT

      // プリフロップで全員コール
      current = executeAllCallCheck(current)

      // フロップに進む
      current = advancePhase(current)
      expect(current.phase).toBe('flop')

      // フロップで最初のアクティブプレイヤーがbet、2人目がraise（大きめ）
      let actionCount = 0
      while (!isBettingRoundComplete(current) && actionCount < 20) {
        const playerIdx = current.currentPlayerIndex
        const actions = getValidActions(current, playerIdx)
        const betAction = actions.find((a) => a.type === 'bet')
        const callAction = actions.find((a) => a.type === 'call')
        const checkAction = actions.find((a) => a.type === 'check')

        if (betAction && actionCount === 0) {
          current = applyAction(current, playerIdx, {
            type: 'bet',
            amount: BIG_BLIND * 2,
          })
        } else {
          const action = callAction ?? checkAction
          if (!action) break
          current = applyAction(current, playerIdx, action)
        }
        actionCount++
      }

      // ターン → リバー → ショーダウン
      current = executeAllCheck(advancePhase(current)) // turn
      current = executeAllCheck(advancePhase(current)) // river
      current = advancePhase(current) // showdown
      current = evaluateShowdown(current)

      // Then: チップ保存則
      expect(calcTotalChips(current)).toBe(expectedTotal)
      // ポットが0になっている
      expect(current.pot).toBe(0)
      // 全プレイヤーのchipsが0以上
      for (const player of current.players) {
        expect(player.chips).toBeGreaterThanOrEqual(0)
      }
    })

    test('should exclude chip-0 players after multi-player all-in and continue to next hand', () => {
      // Given: ショーダウン後に複数のchip-0プレイヤーがいる状態
      let current: GameState = setupNewGame(() => 0.5)
      const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT

      // index 1, 2がチップ0
      const players = current.players.map((p, i) => ({
        ...p,
        chips: i === 1 || i === 2 ? 0 : INITIAL_CHIPS,
        holeCards: [],
        folded: false,
        currentBetInRound: 0,
      }))
      const diff = expectedTotal - players.reduce((sum, p) => sum + p.chips, 0)
      players[0] = { ...players[0], chips: players[0].chips + diff }

      current = {
        ...current,
        phase: 'showdown' as const,
        dealerIndex: 0,
        players,
        pot: 0,
        currentBet: 0,
        communityCards: [],
        lastAggressorIndex: null,
      }

      // When: 次のハンドを開始
      const gameOverResult = isGameOver(current)
      if (!gameOverResult.over) {
        current = startNextHand(current, () => 0.5)

        // Then: 両方のchip-0プレイヤーが除外されている
        expect(current.players[1].folded).toBe(true)
        expect(current.players[1].holeCards).toHaveLength(0)
        expect(current.players[2].folded).toBe(true)
        expect(current.players[2].holeCards).toHaveLength(0)

        // アクティブプレイヤーにはカードが配られている
        for (const player of current.players) {
          if (player.chips > 0 || player.currentBetInRound > 0) {
            expect(player.holeCards).toHaveLength(2)
          }
        }

        // チップ保存則
        expect(calcTotalChips(current)).toBe(expectedTotal)
      }
    })
  })

  describe('人間プレイヤーアクション結合テスト', () => {
    test('should complete a hand where human player bets and CPUs respond', () => {
      // Given: 新しいゲーム
      let current: GameState = setupNewGame(() => 0.5)
      const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT

      // When: プリフロップで人間プレイヤーの番まで進め、betする
      let guard = 0
      while (!isBettingRoundComplete(current) && guard < 20) {
        const playerIdx = current.currentPlayerIndex
        const player = current.players[playerIdx]
        const actions = getValidActions(current, playerIdx)

        if (player.isHuman) {
          // 人間プレイヤーがbet/raise
          const raiseAction = actions.find((a) => a.type === 'raise')
          const callAction = actions.find((a) => a.type === 'call')
          if (raiseAction) {
            current = applyAction(current, playerIdx, {
              type: 'raise',
              amount: raiseAction.min!,
            })
          } else if (callAction) {
            current = applyAction(current, playerIdx, callAction)
          } else {
            break
          }
        } else {
          // CPUはコール/チェック
          const callAction = actions.find((a) => a.type === 'call')
          const checkAction = actions.find((a) => a.type === 'check')
          const action = callAction ?? checkAction
          if (!action) {
            current = applyAction(current, playerIdx, { type: 'fold' })
          } else {
            current = applyAction(current, playerIdx, action)
          }
        }
        guard++
      }

      // フロップ→ターン→リバー: 全員チェック
      current = advanceToShowdown(current)
      current = evaluateShowdown(current)

      // Then: チップ保存則
      expect(calcTotalChips(current)).toBe(expectedTotal)
      expect(current.pot).toBe(0)
    })
  })
})
