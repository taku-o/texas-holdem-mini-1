import { setupNewGame } from '../domain/gameEngine'
import { BIG_BLIND } from '../domain/constants'
import type { GameState } from '../domain/types'
import {
  card,
  createTestPlayer,
  createTestState as createBaseTestState,
} from '../domain/testHelpers'

export const fixedRandom = () => 0.5

// handlePlayerAction はハンド全体を処理するため、有効なデッキが必要
export const defaultDeck = setupNewGame(fixedRandom).deck

export function createGameState(
  overrides: Partial<GameState> = {},
): GameState {
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
export function createHumanTurnState(
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
