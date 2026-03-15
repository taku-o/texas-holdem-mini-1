import { useState } from 'react'
import type { ActionType, PlayerAction } from '../domain/types'
import { BIG_BLIND } from '../domain/constants'

export type ActionBarProps = {
  validActions: PlayerAction[]
  playerChips: number
  currentBet: number
  playerCurrentBetInRound: number
  onAction: (action: PlayerAction) => void
}

const IMMEDIATE_ACTIONS: ActionType[] = ['fold', 'check', 'call']
const CHIP_INPUT_ACTIONS: ActionType[] = ['bet', 'raise']
const ALL_ACTION_TYPES: ActionType[] = [...IMMEDIATE_ACTIONS, ...CHIP_INPUT_ACTIONS]

export function ActionBar({
  validActions,
  playerChips,
  currentBet,
  playerCurrentBetInRound,
  onAction,
}: ActionBarProps) {
  const [chipInputMode, setChipInputMode] = useState<'bet' | 'raise' | null>(null)
  const [chipAmount, setChipAmount] = useState(0)

  const validActionTypes = new Set(validActions.map((a) => a.type))

  function getMinBet(): number {
    return Math.min(BIG_BLIND, playerChips)
  }

  function getMinRaise(): number {
    return Math.min(currentBet * 2, playerChips + playerCurrentBetInRound)
  }

  function handleButtonClick(actionType: ActionType) {
    if (!validActionTypes.has(actionType)) return

    if (actionType === 'bet') {
      setChipAmount(getMinBet())
      setChipInputMode('bet')
      return
    }

    if (actionType === 'raise') {
      setChipAmount(getMinRaise())
      setChipInputMode('raise')
      return
    }

    onAction({ type: actionType })
  }

  function handleConfirm() {
    if (!chipInputMode) return
    onAction({ type: chipInputMode, amount: chipAmount })
    setChipInputMode(null)
  }

  function handleCancel() {
    setChipInputMode(null)
  }

  function handleAllIn() {
    if (chipInputMode === 'raise') {
      setChipAmount(playerChips + playerCurrentBetInRound)
    } else {
      setChipAmount(playerChips)
    }
  }

  function getSliderProps(): { min: number; max: number } {
    if (chipInputMode === 'raise') {
      return { min: getMinRaise(), max: playerChips + playerCurrentBetInRound }
    }
    return { min: getMinBet(), max: playerChips }
  }

  return (
    <div>
      <div>
        {ALL_ACTION_TYPES.map((actionType) => (
          <button
            key={actionType}
            disabled={!validActionTypes.has(actionType)}
            onClick={() => handleButtonClick(actionType)}
          >
            {actionType}
          </button>
        ))}
      </div>
      {chipInputMode && (
        <ChipInput
          sliderProps={getSliderProps()}
          chipAmount={chipAmount}
          onChipAmountChange={setChipAmount}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onAllIn={handleAllIn}
        />
      )}
    </div>
  )
}

type ChipInputProps = {
  sliderProps: { min: number; max: number }
  chipAmount: number
  onChipAmountChange: (amount: number) => void
  onConfirm: () => void
  onCancel: () => void
  onAllIn: () => void
}

function ChipInput({
  sliderProps,
  chipAmount,
  onChipAmountChange,
  onConfirm,
  onCancel,
  onAllIn,
}: ChipInputProps) {
  return (
    <div>
      <input
        type="range"
        min={sliderProps.min}
        max={sliderProps.max}
        step={BIG_BLIND}
        value={chipAmount}
        onChange={(e) => onChipAmountChange(Number(e.target.value))}
      />
      <input
        type="number"
        min={sliderProps.min}
        max={sliderProps.max}
        step={BIG_BLIND}
        value={chipAmount}
        onChange={(e) => onChipAmountChange(Number(e.target.value))}
      />
      <button onClick={onAllIn}>All-in</button>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}
