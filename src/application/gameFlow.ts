import type { GameState, PlayerAction } from '../domain/types'
import { applyAction, isBettingRoundComplete } from '../domain/betting'
import {
  advancePhase,
  startNextHand,
  isGameOver,
} from '../domain/handProgression'
import { evaluateShowdown, resolveUncontestedPot } from '../domain/showdown'
import { decideAction } from '../domain/cpuStrategy'

const MAX_CPU_ITERATIONS = 500

function getNonFoldedCount(state: GameState): number {
  return state.players.filter((p) => !p.folded).length
}

function canAnyoneStillBet(state: GameState): boolean {
  const nonFoldedWithChips = state.players.filter(
    (p) => !p.folded && p.chips > 0,
  )
  return nonFoldedWithChips.length >= 2
}

function finishAsGameOver(state: GameState, reason: string): GameState {
  return { ...state, phase: 'idle', gameOverReason: reason }
}

function resolveAndCheckGameOver(
  state: GameState,
  randomFn: () => number,
): GameState {
  const gameOverCheck = isGameOver(state)
  if (gameOverCheck.over) {
    return finishAsGameOver(state, gameOverCheck.reason!)
  }
  return startNextHand(state, randomFn)
}

function skipToShowdownAndResolve(
  state: GameState,
  randomFn: () => number,
): GameState {
  let current = state
  while (current.phase !== 'showdown') {
    current = advancePhase(current)
  }
  const resolved = evaluateShowdown(current)
  return resolveAndCheckGameOver(resolved, randomFn)
}

function processCpuTurnsAndPhases(
  state: GameState,
  randomFn: () => number,
): GameState {
  let current = state
  let iterations = 0

  while (iterations < MAX_CPU_ITERATIONS) {
    iterations++

    if (current.phase === 'idle') {
      return current
    }

    if (getNonFoldedCount(current) <= 1) {
      const resolved = resolveUncontestedPot(current)
      current = resolveAndCheckGameOver(resolved, randomFn)
      continue
    }

    // 非フォールドプレイヤーが全員all-in、または
    // アクション可能なプレイヤーが1人以下の場合はショーダウンまでスキップ
    if (!canAnyoneStillBet(current)) {
      current = skipToShowdownAndResolve(current, randomFn)
      continue
    }

    if (current.phase === 'showdown') {
      const resolved = evaluateShowdown(current)
      current = resolveAndCheckGameOver(resolved, randomFn)
      continue
    }

    if (isBettingRoundComplete(current)) {
      current = advancePhase(current)
      continue
    }

    const currentPlayer = current.players[current.currentPlayerIndex]
    if (currentPlayer.isHuman) {
      return current
    }

    const cpuAction = decideAction(
      current,
      current.currentPlayerIndex,
      randomFn,
    )
    current = applyAction(current, current.currentPlayerIndex, cpuAction)
  }

  return current
}

export function handlePlayerAction(
  state: GameState,
  action: PlayerAction,
  randomFn: () => number,
): GameState {
  const afterAction = applyAction(state, state.currentPlayerIndex, action)
  return processCpuTurnsAndPhases(afterAction, randomFn)
}

export function advanceUntilHumanTurn(
  state: GameState,
  randomFn: () => number,
): GameState {
  return processCpuTurnsAndPhases(state, randomFn)
}
