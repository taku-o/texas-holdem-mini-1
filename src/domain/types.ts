export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'

export type Card = {
  suit: Suit
  rank: Rank
}

export type Player = {
  id: string
  isHuman: boolean
  chips: number
  holeCards: Card[]
  folded: boolean
  currentBetInRound: number
}

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise'

export type PlayerAction = {
  type: ActionType
  amount?: number
}

export type ValidAction = {
  type: ActionType
  min?: number
  max?: number
}

export type GamePhase =
  | 'idle'
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'showdown'

export type GameState = {
  phase: GamePhase
  dealerIndex: number
  players: Player[]
  communityCards: Card[]
  pot: number
  currentBet: number
  currentPlayerIndex: number
  humanPlayerId: string
  deck: Card[]
  lastAggressorIndex: number | null
  gameOverReason?: string
}

export type HandRankCategory =
  | 'high-card'
  | 'one-pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush'

export type HandRank = {
  category: HandRankCategory
  score: number
}
