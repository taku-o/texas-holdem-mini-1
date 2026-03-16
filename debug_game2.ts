import { startNextHand, isGameOver } from './src/domain/handProgression'
import { resolveUncontestedPot } from './src/domain/showdown'
import type { GameState } from './src/domain/types'
import { setupNewGame } from './src/domain/gameSetup'
import { executeBettingRound, setupCpuChips, cpuFoldHumanCallSelector } from './debug_common'

let current: GameState = setupNewGame(() => 0.5)
current = setupCpuChips(current, 30)

for (let i = 0; i < 30; i++) {
  current = executeBettingRound(current, cpuFoldHumanCallSelector, 20)
  const nonFolded = current.players.filter((p) => !p.folded)
  if (nonFolded.length === 1) {
    current = resolveUncontestedPot(current)
  }
  console.log(`Hand ${i+1}: dealer=${current.dealerIndex} [${current.players.map(p => `${p.id}(${p.isHuman?'H':'C'}):${p.chips}`).join(', ')}] pot=${current.pot}`)
  const gameOverResult = isGameOver(current)
  if (gameOverResult.over) {
    console.log(`Game over: ${gameOverResult.reason}`)
    break
  }
  current = startNextHand(current, () => 0.5)
}
