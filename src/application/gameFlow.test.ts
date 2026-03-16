import { describe, expect, test } from 'vitest'
import { handlePlayerAction, advanceUntilHumanTurn } from './gameFlow'
import { setupNewGame } from '../domain/gameEngine'
import { BIG_BLIND, INITIAL_CHIPS, PLAYER_COUNT } from '../domain/constants'
import type { GameState, PlayerAction } from '../domain/types'
import {
  calcTotalChips,
  card,
  createTestPlayer,
  createTestState as createBaseTestState,
} from '../domain/testHelpers'

const fixedRandom = () => 0.5

// handlePlayerAction はハンド全体を処理するため、有効なデッキが必要
const defaultDeck = setupNewGame(fixedRandom).deck

function expectHumanTurnOrGameOver(state: GameState): void {
  const humanIndex = state.players.findIndex((p) => p.isHuman)
  const isHumanTurn = state.currentPlayerIndex === humanIndex
  const isGameOver = state.phase === 'idle'
  expect(isHumanTurn || isGameOver).toBe(true)
}

function expectHumanTurnOrHandOver(state: GameState): void {
  const humanIndex = state.players.findIndex((p) => p.isHuman)
  const isHumanTurn = state.currentPlayerIndex === humanIndex
  const isHandOver =
    state.phase === 'showdown' ||
    state.phase === 'idle' ||
    state.players.filter((p) => !p.folded).length <= 1
  expect(isHumanTurn || isHandOver).toBe(true)
}

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return createBaseTestState({
    phase: 'preflop',
    pot: 15,
    currentBet: BIG_BLIND,
    currentPlayerIndex: 0,
    deck: defaultDeck,
    ...overrides,
  })
}

/**
 * 人間がplayer-0、CPU がplayer-1〜4 のプリフロップ状態を作る。
 * currentPlayerIndex=0（人間の番）から始まる。
 */
function createHumanTurnState(
  overrides: Partial<GameState> = {},
): GameState {
  const players = Array.from({ length: 5 }, (_, i) =>
    createTestPlayer({
      id: `player-${i}`,
      isHuman: i === 0,
      chips: 1000,
      holeCards: [card('A', 'spades'), card('K', 'hearts')],
      currentBetInRound: i <= 2 ? BIG_BLIND : 0,
    }),
  )
  return createGameState({
    players,
    currentPlayerIndex: 0,
    lastAggressorIndex: null,
    ...overrides,
  })
}

describe('gameFlow', () => {
  describe('handlePlayerAction', () => {
    describe('人間のアクション適用', () => {
      test('should apply fold action and advance through CPU turns', () => {
        // Given: 人間の番（player-0）
        const state = createHumanTurnState()

        // When: 人間がフォールドする
        const result = handlePlayerAction(
          state,
          { type: 'fold' },
          fixedRandom,
        )

        // Then: ハンドが処理され、次のハンドまたはゲーム終了に到達している
        expectHumanTurnOrGameOver(result)
      })

      test('should apply call action from human player', () => {
        // Given: 人間の番でcallが必要な状態
        const players = Array.from({ length: 5 }, (_, i) =>
          createTestPlayer({
            id: `player-${i}`,
            isHuman: i === 0,
            chips: 1000,
            currentBetInRound: 0,
          }),
        )
        const state = createGameState({
          players,
          currentBet: BIG_BLIND,
          currentPlayerIndex: 0,
          lastAggressorIndex: 1,
        })

        // When: 人間がコールする
        const result = handlePlayerAction(
          state,
          { type: 'call' },
          fixedRandom,
        )

        // Then: ハンドが処理され、有効な状態が返される
        expect(result).toBeDefined()
        const totalChips =
          calcTotalChips(result)
        const initialTotal =
          calcTotalChips(state)
        expect(totalChips).toBe(initialTotal)
      })

      test('should apply bet action with amount from human player', () => {
        // Given: 人間の番でbet可能な状態（currentBet=0）
        const players = Array.from({ length: 5 }, (_, i) =>
          createTestPlayer({
            id: `player-${i}`,
            isHuman: i === 0,
            chips: 1000,
            currentBetInRound: 0,
          }),
        )
        const state = createGameState({
          players,
          currentBet: 0,
          currentPlayerIndex: 0,
          phase: 'flop',
          communityCards: [
            card('2', 'clubs'),
            card('7', 'diamonds'),
            card('J', 'hearts'),
          ],
          lastAggressorIndex: null,
        })

        // When: 人間がベットする
        const result = handlePlayerAction(
          state,
          { type: 'bet', amount: BIG_BLIND * 2 },
          fixedRandom,
        )

        // Then: ハンドが処理され、チップ保存則が守られている
        expect(result).toBeDefined()
        const totalChips =
          calcTotalChips(result)
        const initialTotal =
          calcTotalChips(state)
        expect(totalChips).toBe(initialTotal)
      })
    })

    describe('CPU自動ターンの処理', () => {
      test('should process CPU turns until human turn comes back', () => {
        // Given: setupNewGameで初期化（CPUの行動が決定的になるfixedRandom）
        const state = setupNewGame(fixedRandom)
        const humanIndex = state.players.findIndex((p) => p.isHuman)
        expect(humanIndex).toBeGreaterThanOrEqual(0)

        // setupNewGame後、人間の番になるまでadvanceUntilHumanTurnを呼ぶ
        const readyState = advanceUntilHumanTurn(state, fixedRandom)

        // When: 人間がコールする
        const result = handlePlayerAction(
          readyState,
          { type: 'call' },
          fixedRandom,
        )

        // Then: 結果の状態では人間の番に戻っているか、ハンドが終了している
        expectHumanTurnOrHandOver(result)
      })

      test('should handle CPU turns resulting in all-fold (uncontested pot)', () => {
        // Given: 2人残り（人間とCPU1人）、CPUが弱いハンドでフォールドする状況
        const players = [
          createTestPlayer({
            id: 'player-0',
            isHuman: true,
            chips: 1000,
            holeCards: [card('A', 'spades'), card('A', 'hearts')],
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-1',
            isHuman: false,
            chips: 1000,
            holeCards: [card('2', 'clubs'), card('7', 'diamonds')],
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-2',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-3',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-4',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
        ]
        const state = createGameState({
          players,
          currentBet: BIG_BLIND * 5,
          currentPlayerIndex: 0,
          pot: BIG_BLIND * 10,
          phase: 'flop',
          communityCards: [
            card('J', 'hearts'),
            card('9', 'spades'),
            card('4', 'diamonds'),
          ],
          lastAggressorIndex: 0,
        })
        const initialTotal =
          calcTotalChips(state)

        // When: 人間がレイズする（CPUがフォールドする可能性が高い状況）
        const result = handlePlayerAction(
          state,
          { type: 'raise', amount: BIG_BLIND * 10 },
          () => 0.9,
        )

        // Then: ポットが解決され、チップ保存則が守られている
        const resultTotal =
          calcTotalChips(result)
        expect(resultTotal).toBe(initialTotal)
        // 人間の番に戻っているか、ゲーム終了している
        expectHumanTurnOrGameOver(result)
      })
    })

    describe('フェーズ遷移', () => {
      test('should advance phase when betting round completes after human action', () => {
        // Given: 全員がBIG_BLINDをコール済みで、人間が最後のプレイヤー
        const players = Array.from({ length: 5 }, (_, i) =>
          createTestPlayer({
            id: `player-${i}`,
            isHuman: i === 0,
            chips: 990,
            currentBetInRound: i === 0 ? 0 : BIG_BLIND,
          }),
        )
        const state = createGameState({
          players,
          currentBet: BIG_BLIND,
          currentPlayerIndex: 0,
          lastAggressorIndex: 1,
          deck: setupNewGame(fixedRandom).deck,
        })

        // When: 人間がコールしてベッティングラウンドが完了する
        const result = handlePlayerAction(
          state,
          { type: 'call' },
          fixedRandom,
        )

        // Then: ハンドが処理され、有効な状態が返される（フェーズが進んだか、新しいハンドが始まっている）
        expect(result).toBeDefined()
        expectHumanTurnOrGameOver(result)
      })
    })

    describe('ハンド終了 → 次ハンド or ゲーム終了', () => {
      test('should start next hand when hand ends and game is not over', () => {
        // Given: setupNewGameで完全な初期状態を作成
        const fullState = setupNewGame(fixedRandom)

        // 全員フォールドさせて人間以外1人だけ残す（ショーダウンまで行かずに終了）
        let state = fullState
        // player-0（人間）の番まで進める
        const readyState = advanceUntilHumanTurn(state, fixedRandom)

        // When: 人間がフォールドして、ハンドが終了する
        const result = handlePlayerAction(
          readyState,
          { type: 'fold' },
          fixedRandom,
        )

        // Then: ゲーム終了でなければ新しいハンドが始まっている
        // 人間のチップが0でない限り、ゲームは続行される
        if (result.players[0].chips > 0) {
          // 新しいハンドが開始されているか、まだCPUターンが進行中
          expect(
            result.phase === 'preflop' ||
              result.phase === 'flop' ||
              result.phase === 'idle',
          ).toBe(true)
        }
      })

      test('should set phase to idle and gameOverReason when game ends', () => {
        // Given: 人間のチップが残りわずか（フォールドでブラインド分失う）
        const players = [
          createTestPlayer({
            id: 'player-0',
            isHuman: true,
            chips: 0,
            currentBetInRound: BIG_BLIND,
            holeCards: [card('2', 'clubs'), card('7', 'diamonds')],
          }),
          createTestPlayer({
            id: 'player-1',
            isHuman: false,
            chips: 2000,
            currentBetInRound: 0,
            holeCards: [card('A', 'spades'), card('A', 'hearts')],
          }),
          createTestPlayer({
            id: 'player-2',
            isHuman: false,
            chips: 1000,
            currentBetInRound: 0,
            folded: true,
          }),
          createTestPlayer({
            id: 'player-3',
            isHuman: false,
            chips: 1000,
            currentBetInRound: 0,
            folded: true,
          }),
          createTestPlayer({
            id: 'player-4',
            isHuman: false,
            chips: 1000,
            currentBetInRound: 0,
            folded: true,
          }),
        ]
        const state = createGameState({
          players,
          currentBet: BIG_BLIND,
          pot: BIG_BLIND,
          currentPlayerIndex: 0,
          lastAggressorIndex: null,
        })

        // When: 人間がフォールドする（チップ0なのでゲーム終了になるはず）
        const result = handlePlayerAction(
          state,
          { type: 'fold' },
          fixedRandom,
        )

        // Then: ゲーム終了状態になる
        expect(result.phase).toBe('idle')
        expect(result.gameOverReason).toBeDefined()
      })

      test('should set gameOverReason when all CPUs are eliminated', () => {
        // Given: CPU全員のチップが0で、人間が最後のポットを取る状況
        const players = [
          createTestPlayer({
            id: 'player-0',
            isHuman: true,
            chips: 4990,
            currentBetInRound: 0,
            holeCards: [card('A', 'spades'), card('A', 'hearts')],
          }),
          createTestPlayer({
            id: 'player-1',
            isHuman: false,
            chips: 0,
            currentBetInRound: BIG_BLIND,
            holeCards: [card('2', 'clubs'), card('7', 'diamonds')],
            folded: false,
          }),
          createTestPlayer({
            id: 'player-2',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-3',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-4',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
        ]
        const state = createGameState({
          players,
          currentBet: BIG_BLIND,
          pot: BIG_BLIND,
          currentPlayerIndex: 0,
          phase: 'flop',
          communityCards: [
            card('A', 'diamonds'),
            card('5', 'clubs'),
            card('9', 'hearts'),
          ],
          lastAggressorIndex: 1,
        })

        // When: 人間がレイズ（CPU-1がフォールドしてゲーム終了）
        const result = handlePlayerAction(
          state,
          { type: 'raise', amount: BIG_BLIND * 3 },
          () => 0.9,
        )

        // Then: ゲーム終了（全CPU脱落）
        expect(result.phase).toBe('idle')
        expect(result.gameOverReason).toBeDefined()
      })
    })

    describe('チップ保存則', () => {
      test('should preserve total chips through handlePlayerAction', () => {
        // Given: setupNewGameで初期化した状態
        const state = setupNewGame(fixedRandom)
        const readyState = advanceUntilHumanTurn(state, fixedRandom)
        const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT
        const initialTotal = calcTotalChips(readyState)

        // When: 人間がコールする
        const result = handlePlayerAction(
          readyState,
          { type: 'call' },
          fixedRandom,
        )

        // Then: チップ合計が保存されている
        const resultTotal =
          calcTotalChips(result)
        expect(initialTotal).toBe(expectedTotal)
        expect(resultTotal).toBe(expectedTotal)
      })
    })

    describe('エッジケース', () => {
      test('should handle human raise followed by CPU re-raise cycle', () => {
        // Given: フロップで人間がベットする
        const players = Array.from({ length: 5 }, (_, i) =>
          createTestPlayer({
            id: `player-${i}`,
            isHuman: i === 0,
            chips: 1000,
            holeCards:
              i === 0
                ? [card('A', 'spades'), card('K', 'hearts')]
                : [card('A', 'hearts'), card('A', 'diamonds')],
            currentBetInRound: 0,
          }),
        )
        const state = createGameState({
          players,
          currentBet: 0,
          currentPlayerIndex: 0,
          phase: 'flop',
          communityCards: [
            card('A', 'clubs'),
            card('5', 'hearts'),
            card('9', 'diamonds'),
          ],
          lastAggressorIndex: null,
          deck: setupNewGame(fixedRandom).deck,
        })

        // When: 人間がベットする
        const result = handlePlayerAction(
          state,
          { type: 'bet', amount: BIG_BLIND * 2 },
          fixedRandom,
        )

        // Then: 状態が返される（無限ループしない）
        expect(result).toBeDefined()
        // 人間の番に戻っているか、フェーズが進んでいる
        const humanIndex = result.players.findIndex((p) => p.isHuman)
        const isHumanTurn = result.currentPlayerIndex === humanIndex
        const isHandProgressed =
          result.phase !== 'flop' ||
          result.players.filter((p) => !p.folded).length <= 1
        expect(isHumanTurn || isHandProgressed).toBe(true)

      })
    })
  })

  describe('advanceUntilHumanTurn', () => {
    describe('人間が最初のプレイヤーの場合', () => {
      test('should return immediately when current player is human', () => {
        // Given: 人間の番
        const state = createHumanTurnState({
          currentPlayerIndex: 0,
        })

        // When: advanceUntilHumanTurnを呼ぶ
        const result = advanceUntilHumanTurn(state, fixedRandom)

        // Then: 状態が大きく変わらない（人間の番のまま）
        expect(result.currentPlayerIndex).toBe(0)
        expect(result.players[0].isHuman).toBe(true)
      })
    })

    describe('CPUターンの消化', () => {
      test('should process CPU turns until human turn', () => {
        // Given: CPUの番から始まる状態（player-1が現在のプレイヤー）
        const players = Array.from({ length: 5 }, (_, i) =>
          createTestPlayer({
            id: `player-${i}`,
            isHuman: i === 0,
            chips: 1000,
            holeCards: [card('Q', 'spades'), card('J', 'hearts')],
            currentBetInRound: 0,
          }),
        )
        const state = createGameState({
          players,
          currentBet: 0,
          currentPlayerIndex: 1,
          phase: 'flop',
          communityCards: [
            card('2', 'clubs'),
            card('7', 'diamonds'),
            card('J', 'clubs'),
          ],
          lastAggressorIndex: null,
          deck: setupNewGame(fixedRandom).deck,
        })

        // When: CPUターンを消化する
        const result = advanceUntilHumanTurn(state, fixedRandom)

        // Then: 人間の番になっているか、ハンドが終了している
        expectHumanTurnOrHandOver(result)
      })
    })

    describe('ショーダウン処理', () => {
      test('should evaluate showdown when phase reaches showdown', () => {
        // Given: ショーダウンフェーズの状態
        const players = Array.from({ length: 5 }, (_, i) =>
          createTestPlayer({
            id: `player-${i}`,
            isHuman: i === 0,
            chips: 900,
            holeCards:
              i === 0
                ? [card('A', 'spades'), card('A', 'hearts')]
                : [card('2', 'clubs'), card('3', 'diamonds')],
            currentBetInRound: 0,
            folded: i >= 3,
          }),
        )
        const state = createGameState({
          players,
          phase: 'showdown',
          pot: 600,
          currentBet: 0,
          currentPlayerIndex: 0,
          communityCards: [
            card('K', 'hearts'),
            card('Q', 'diamonds'),
            card('J', 'clubs'),
            card('9', 'spades'),
            card('4', 'hearts'),
          ],
        })
        const initialTotal =
          calcTotalChips(state)

        // When: advanceUntilHumanTurnを呼ぶ
        const result = advanceUntilHumanTurn(state, fixedRandom)

        // Then: ショーダウンが処理され、チップ保存則が守られている
        const resultTotal =
          calcTotalChips(result)
        expect(resultTotal).toBe(initialTotal)
        // 人間の番に戻っているか、ゲーム終了している
        expectHumanTurnOrGameOver(result)
      })
    })

    describe('全員all-in時のフェーズスキップ', () => {
      test('should skip betting rounds when all non-folded players are all-in', () => {
        // Given: 非フォールドプレイヤーが全員all-in（chips=0）
        const players = [
          createTestPlayer({
            id: 'player-0',
            isHuman: true,
            chips: 0,
            currentBetInRound: 500,
            holeCards: [card('A', 'spades'), card('K', 'hearts')],
          }),
          createTestPlayer({
            id: 'player-1',
            isHuman: false,
            chips: 0,
            currentBetInRound: 500,
            holeCards: [card('Q', 'hearts'), card('Q', 'diamonds')],
          }),
          createTestPlayer({
            id: 'player-2',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-3',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-4',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
        ]
        const state = createGameState({
          players,
          phase: 'preflop',
          pot: 1000,
          currentBet: 500,
          currentPlayerIndex: 0,
          deck: setupNewGame(fixedRandom).deck,
          lastAggressorIndex: 1,
        })

        // When: advanceUntilHumanTurnを呼ぶ
        const result = advanceUntilHumanTurn(state, fixedRandom)

        // Then: ショーダウンまで自動進行してポットが分配されている
        expect(result.pot).toBe(0)
      })
    })

    describe('1人だけチップ残りの場合のフェーズスキップ', () => {
      test('should skip to showdown when only one non-folded player has chips', () => {
        // Given: 非フォールド2人のうち1人だけall-in（chips=0）
        const players = [
          createTestPlayer({
            id: 'player-0',
            isHuman: true,
            chips: 500,
            currentBetInRound: 500,
            holeCards: [card('A', 'spades'), card('K', 'hearts')],
          }),
          createTestPlayer({
            id: 'player-1',
            isHuman: false,
            chips: 0,
            currentBetInRound: 500,
            holeCards: [card('Q', 'hearts'), card('Q', 'diamonds')],
          }),
          createTestPlayer({
            id: 'player-2',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-3',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-4',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
        ]
        const state = createGameState({
          players,
          phase: 'preflop',
          pot: 1000,
          currentBet: 500,
          currentPlayerIndex: 0,
          deck: setupNewGame(fixedRandom).deck,
          lastAggressorIndex: 1,
        })

        // When: advanceUntilHumanTurnを呼ぶ
        const result = advanceUntilHumanTurn(state, fixedRandom)

        // Then: ショーダウンまで自動進行してポットが分配されている
        expect(result.pot).toBe(0)
      })
    })

    describe('非争ポットの解決', () => {
      test('should resolve uncontested pot when only one player remains', () => {
        // Given: 1人を除いて全員フォールド、CPUの番
        const players = [
          createTestPlayer({
            id: 'player-0',
            isHuman: true,
            chips: 900,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-1',
            isHuman: false,
            chips: 900,
            folded: false,
            currentBetInRound: BIG_BLIND,
            holeCards: [card('A', 'spades'), card('K', 'hearts')],
          }),
          createTestPlayer({
            id: 'player-2',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-3',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
          createTestPlayer({
            id: 'player-4',
            isHuman: false,
            chips: 0,
            folded: true,
            currentBetInRound: 0,
          }),
        ]
        const state = createGameState({
          players,
          pot: 200,
          currentBet: BIG_BLIND,
          currentPlayerIndex: 1,
          lastAggressorIndex: null,
        })

        // When: advanceUntilHumanTurnを呼ぶ
        const result = advanceUntilHumanTurn(state, fixedRandom)

        // Then: ポットが分配されている
        expect(result.pot).toBe(0)
        // player-1がポットを獲得している
        expect(result.players[1].chips).toBe(900 + 200)
      })
    })

    describe('ゲーム開始直後のCPU自動進行', () => {
      test('should work with setupNewGame to advance through initial CPU turns', () => {
        // Given: setupNewGameで初期化した状態
        const state = setupNewGame(fixedRandom)

        // When: ゲーム開始後にCPUターンを消化
        const result = advanceUntilHumanTurn(state, fixedRandom)

        // Then: 人間の番になっているか、ハンドが終了している
        expectHumanTurnOrHandOver(result)
      })
    })
  })

  describe('統合テスト: 完全なゲームフロー', () => {
    test('should handle a complete hand flow through handlePlayerAction', () => {
      // Given: ゲーム開始
      const state = setupNewGame(fixedRandom)
      const readyState = advanceUntilHumanTurn(state, fixedRandom)
      const expectedTotal = INITIAL_CHIPS * PLAYER_COUNT

      // When: 人間がコールを繰り返し、最終的にハンドが終了するまで
      let current = readyState
      let iterations = 0
      const maxIterations = 20

      while (
        current.phase !== 'idle' &&
        current.phase !== 'showdown' &&
        iterations < maxIterations
      ) {
        // 人間の番なら行動する
        const humanIndex = current.players.findIndex((p) => p.isHuman)
        if (
          current.currentPlayerIndex === humanIndex &&
          !current.players[humanIndex].folded
        ) {
          current = handlePlayerAction(
            current,
            { type: 'call' },
            fixedRandom,
          )
        } else {
          break
        }
        iterations++
      }

      // Then: チップ合計が保存されている
      const totalChips =
        calcTotalChips(current)
      expect(totalChips).toBe(expectedTotal)
    })

    test('should handle game over scenario when human folds repeatedly', () => {
      // Given: ゲーム開始
      let current = setupNewGame(fixedRandom)
      current = advanceUntilHumanTurn(current, fixedRandom)
      let iterations = 0
      const maxIterations = 500

      // When: 人間が毎回フォールドして、いずれゲームオーバーになる
      while (current.phase !== 'idle' && iterations < maxIterations) {
        const humanIndex = current.players.findIndex((p) => p.isHuman)
        if (
          current.currentPlayerIndex === humanIndex &&
          !current.players[humanIndex].folded
        ) {
          current = handlePlayerAction(
            current,
            { type: 'fold' },
            fixedRandom,
          )
        } else {
          break
        }
        iterations++
      }

      // Then: いずれゲーム終了に到達する
      expect(current.phase).toBe('idle')
      expect(current.gameOverReason).toBeDefined()
    })
  })
})
