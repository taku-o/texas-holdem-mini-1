import type { GameState, PlayerAction, ValidAction } from './types'
import { BIG_BLIND } from './constants'

export function getValidActions(
  state: GameState,
  playerIndex: number,
): ValidAction[] {
  const player = state.players[playerIndex]
  const actions: ValidAction[] = [{ type: 'fold' }]

  if (player.currentBetInRound >= state.currentBet) {
    actions.push({ type: 'check' })
    if (state.currentBet === 0 && player.chips >= BIG_BLIND) {
      actions.push({ type: 'bet', min: BIG_BLIND, max: player.chips })
    }
  } else {
    actions.push({ type: 'call' })
  }

  if (state.currentBet > 0) {
    const minRaiseTotal = state.currentBet + BIG_BLIND
    const minRaiseCost = minRaiseTotal - player.currentBetInRound
    if (player.chips >= minRaiseCost) {
      const maxRaiseTotal = player.currentBetInRound + player.chips
      actions.push({ type: 'raise', min: minRaiseTotal, max: maxRaiseTotal })
    }
  }

  return actions
}

export function applyAction(
  state: GameState,
  playerIndex: number,
  action: PlayerAction,
): GameState {
  const validActions = getValidActions(state, playerIndex)
  if (!validActions.some((a) => a.type === action.type)) {
    throw new Error(`Invalid action: ${action.type}`)
  }

  const players = state.players.map((p) => ({ ...p }))
  const player = players[playerIndex]
  let pot = state.pot
  let currentBet = state.currentBet
  let lastAggressorIndex = state.lastAggressorIndex

  switch (action.type) {
    case 'fold':
      player.folded = true
      break

    case 'check':
      break

    case 'call': {
      const callAmount = Math.min(
        currentBet - player.currentBetInRound,
        player.chips,
      )
      player.chips -= callAmount
      player.currentBetInRound += callAmount
      pot += callAmount
      break
    }

    case 'bet': {
      if (action.amount === undefined) {
        throw new Error('Bet action requires amount')
      }
      const betAmount = action.amount
      if (betAmount > player.chips) {
        throw new Error('Bet amount exceeds player chips')
      }
      if (betAmount < BIG_BLIND && betAmount < player.chips) {
        throw new Error('Bet amount is below minimum')
      }
      player.chips -= betAmount
      player.currentBetInRound = betAmount
      pot += betAmount
      currentBet = betAmount
      lastAggressorIndex = playerIndex
      break
    }

    case 'raise': {
      if (action.amount === undefined) {
        throw new Error('Raise action requires amount')
      }
      const raiseTotal = action.amount
      const raiseAmount = raiseTotal - player.currentBetInRound
      if (raiseAmount > player.chips) {
        throw new Error('Raise amount exceeds player chips')
      }
      const minRaise = currentBet + BIG_BLIND
      if (raiseTotal < minRaise && raiseTotal < player.currentBetInRound + player.chips) {
        throw new Error('Raise is below minimum')
      }
      player.chips -= raiseAmount
      player.currentBetInRound = raiseTotal
      pot += raiseAmount
      currentBet = raiseTotal
      lastAggressorIndex = playerIndex
      break
    }
  }

  const updatedState: GameState = {
    ...state,
    players,
    pot,
    currentBet,
    lastAggressorIndex,
  }

  const nextPlayerIndex = getNextActivePlayerIndex(updatedState, playerIndex)
  return { ...updatedState, currentPlayerIndex: nextPlayerIndex }
}

export function isBettingRoundComplete(state: GameState): boolean {
  const nonFolded = state.players.filter((p) => !p.folded)
  if (nonFolded.length <= 1) return true

  if (state.lastAggressorIndex !== null) {
    const aggressor = state.players[state.lastAggressorIndex]
    if (!aggressor.folded && aggressor.chips > 0 &&
        state.currentPlayerIndex === state.lastAggressorIndex) {
      return true
    }
  }

  return nonFolded.every(
    (p) => p.chips === 0 || p.currentBetInRound >= state.currentBet,
  )
}

export function getNextActivePlayerIndex(
  state: GameState,
  fromIndex: number,
): number {
  const count = state.players.length
  let index = (fromIndex + 1) % count
  while (index !== fromIndex) {
    const player = state.players[index]
    if (!player.folded && player.chips > 0) {
      return index
    }
    index = (index + 1) % count
  }
  return fromIndex
}
