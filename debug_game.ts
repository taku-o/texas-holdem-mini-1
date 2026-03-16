import { advancePhase, startNextHand, isGameOver } from './src/domain/handProgression'
import { evaluateShowdown } from './src/domain/showdown'
import type { GameState } from './src/domain/types'
import { setupNewGame } from './src/domain/gameSetup'
import { executeBettingRound, setupCpuChips, callCheckSelector, checkOnlySelector } from './debug_common'

let seed = 1
const seededRandom = () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

let current: GameState = setupNewGame(seededRandom)
current = setupCpuChips(current, 30)

for (let i = 0; i < 20; i++) {
  current = executeBettingRound(current, callCheckSelector, 20)
  while (current.phase !== 'showdown' && current.phase !== 'idle') {
    current = advancePhase(current)
    if (current.phase === 'showdown') break
    current = executeBettingRound(current, checkOnlySelector, 20)
  }
  if (current.phase === 'showdown') {
    current = evaluateShowdown(current)
  }
  console.log(`Hand ${i+1}: [${current.players.map(p => `${p.id}(${p.isHuman?'H':'C'}):${p.chips}`).join(', ')}] pot=${current.pot}`)
  const gameOverResult = isGameOver(current)
  if (gameOverResult.over) {
    console.log(`Game over: ${gameOverResult.reason}`)
    break
  }
  current = startNextHand(current, seededRandom)
}
