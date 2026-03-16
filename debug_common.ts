import { applyAction, getValidActions, isBettingRoundComplete } from './src/domain/betting'
import { PLAYER_COUNT } from './src/domain/constants'
import type { GameState, PlayerAction } from './src/domain/types'

export type ActionSelector = (
  state: GameState,
  playerIdx: number,
  actions: PlayerAction[],
) => PlayerAction | null

export type ActionLogger = (
  state: GameState,
  playerIdx: number,
  action: PlayerAction,
  actions: PlayerAction[],
) => void

export function executeBettingRound(
  state: GameState,
  selector: ActionSelector,
  maxActions: number,
  logger?: ActionLogger,
): GameState {
  let current = state
  let guard = 0
  while (!isBettingRoundComplete(current) && guard < maxActions) {
    const playerIdx = current.currentPlayerIndex
    const actions = getValidActions(current, playerIdx)
    const action = selector(current, playerIdx, actions)
    if (!action) break
    if (logger) logger(current, playerIdx, action, actions)
    current = applyAction(current, playerIdx, action)
    guard++
  }
  return current
}

export function setupCpuChips(state: GameState, cpuChips: number): GameState {
  const currentPlayerChips = state.players.reduce((sum, p) => sum + p.chips, 0)
  const totalCpuChips = cpuChips * (PLAYER_COUNT - 1)
  const humanChips = currentPlayerChips - totalCpuChips
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      chips: p.isHuman ? humanChips : cpuChips,
    })),
  }
}

export const callCheckSelector: ActionSelector = (_state, _playerIdx, actions) => {
  const callAction = actions.find((a) => a.type === 'call')
  const checkAction = actions.find((a) => a.type === 'check')
  return callAction ?? checkAction ?? null
}

export const checkOnlySelector: ActionSelector = (_state, _playerIdx, actions) => {
  return actions.find((a) => a.type === 'check') ?? null
}

export const cpuFoldHumanCallSelector: ActionSelector = (state, playerIdx, actions) => {
  const player = state.players[playerIdx]
  if (!player.isHuman) {
    const foldAction = actions.find((a) => a.type === 'fold')
    if (foldAction) return foldAction
    const checkAction = actions.find((a) => a.type === 'check')
    return checkAction ?? null
  }
  return callCheckSelector(state, playerIdx, actions)
}
