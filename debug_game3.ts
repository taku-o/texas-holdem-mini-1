import { setupNewGame } from './src/domain/gameSetup'
import { startNextHand, isGameOver } from './src/domain/handProgression'
import { resolveUncontestedPot } from './src/domain/showdown'
import { INITIAL_CHIPS, PLAYER_COUNT } from './src/domain/constants'
import type { GameState } from './src/domain/types'
import { executeBettingRound, cpuFoldHumanCallSelector } from './debug_common'
import type { ActionLogger } from './debug_common'

let current: GameState = setupNewGame(() => 0.5)
console.log(`After setup: humanIndex=${current.players.findIndex(p=>p.isHuman)}, dealerIndex=${current.dealerIndex}`)
console.log(`Chips: [${current.players.map((p,i) => `${i}(${p.isHuman?'H':'C'}):${p.chips}`).join(', ')}]`)

current = {
  ...current,
  players: current.players.map((p, i) => ({
    ...p,
    chips: p.isHuman ? INITIAL_CHIPS * PLAYER_COUNT - 5 : i === 4 ? 5 : 0,
  })),
  dealerIndex: 2,
}
console.log(`\nBefore startNextHand: dealerIndex=${current.dealerIndex}`)
console.log(`Chips: [${current.players.map((p,i) => `${i}(${p.isHuman?'H':'C'}):${p.chips}`).join(', ')}]`)

current = startNextHand(current, () => 0.5)
console.log(`\nAfter startNextHand: dealerIndex=${current.dealerIndex}`)
console.log(`Chips: [${current.players.map((p,i) => `${i}(${p.isHuman?'H':'C'}):${p.chips} bet=${p.currentBetInRound}`).join(', ')}]`)
console.log(`pot=${current.pot}, currentPlayerIndex=${current.currentPlayerIndex}`)

const logger: ActionLogger = (state, playerIdx, action, actions) => {
  const player = state.players[playerIdx]
  console.log(`\nTurn: player-${playerIdx}(${player.isHuman?'H':'C'}) chips=${player.chips}, actions=[${actions.map(a=>a.type).join(',')}]`)
  console.log(`  -> ${action.type}`)
}
current = executeBettingRound(current, cpuFoldHumanCallSelector, 20, logger)

const nonFolded = current.players.filter(p => !p.folded)
console.log(`\nNon-folded: ${nonFolded.length}`)
if (nonFolded.length === 1) {
  current = resolveUncontestedPot(current)
}

console.log(`\nFinal chips: [${current.players.map((p,i) => `${i}(${p.isHuman?'H':'C'}):${p.chips}`).join(', ')}]`)
console.log(`pot=${current.pot}`)
console.log(`isGameOver: ${JSON.stringify(isGameOver(current))}`)
