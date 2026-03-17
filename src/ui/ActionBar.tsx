import { useState } from 'react'
import type { ActionType, PlayerAction, ValidAction } from '../domain/types'

type RangeAction = Extract<ValidAction, { min: number }>
import { BIG_BLIND } from '../domain/constants'

export type ActionBarProps = {
  validActions: ValidAction[]
  onAction: (action: PlayerAction) => void
}

const IMMEDIATE_ACTIONS: ActionType[] = ['fold', 'check', 'call']
const CHIP_INPUT_ACTIONS = ['bet', 'raise'] as const
type ChipInputAction = (typeof CHIP_INPUT_ACTIONS)[number]
const ALL_ACTION_TYPES: ActionType[] = [...IMMEDIATE_ACTIONS, ...CHIP_INPUT_ACTIONS]

function isChipInputAction(action: ActionType): action is ChipInputAction {
  return (CHIP_INPUT_ACTIONS as readonly string[]).includes(action)
}

export function ActionBar({
  validActions,
  onAction,
}: ActionBarProps) {
  const [chipInputMode, setChipInputMode] = useState<'bet' | 'raise' | null>(null)
  const [chipAmount, setChipAmount] = useState(0)

  const validActionTypes = new Set(validActions.map((a) => a.type))

  function findRangeAction(type: 'bet' | 'raise'): RangeAction | undefined {
    return validActions.find(
      (a): a is RangeAction => a.type === type,
    )
  }

  function handleButtonClick(actionType: ActionType) {
    if (!validActionTypes.has(actionType)) return

    if (isChipInputAction(actionType)) {
      const action = findRangeAction(actionType)
      if (action) {
        setChipAmount(action.min)
      }
      setChipInputMode(actionType)
      return
    }

    onAction({ type: actionType })
  }

  function isChipAmountValid(): boolean {
    if (!chipInputMode) return false
    const action = findRangeAction(chipInputMode)
    if (!action) return false
    return chipAmount >= action.min && chipAmount <= action.max
  }

  function handleConfirm() {
    if (!chipInputMode) return
    if (!isChipAmountValid()) return
    onAction({ type: chipInputMode, amount: chipAmount })
    setChipInputMode(null)
  }

  function handleCancel() {
    setChipInputMode(null)
  }

  function handleChipAmountChange(value: number) {
    if (!chipInputMode) return
    const action = findRangeAction(chipInputMode)
    if (!action) return
    const clipped = Math.min(Math.max(value, action.min), action.max)
    setChipAmount(clipped)
  }

  function handleAllIn() {
    if (!chipInputMode) return
    const action = findRangeAction(chipInputMode)
    if (action) {
      setChipAmount(action.max)
    }
  }

  function getSliderProps(): { min: number; max: number } {
    if (chipInputMode) {
      const action = findRangeAction(chipInputMode)
      if (action) {
        return { min: action.min, max: action.max }
      }
    }
    return { min: 0, max: 0 }
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
          mode={chipInputMode}
          sliderProps={getSliderProps()}
          chipAmount={chipAmount}
          isValid={isChipAmountValid()}
          onChipAmountChange={handleChipAmountChange}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onAllIn={handleAllIn}
        />
      )}
    </div>
  )
}

type ChipInputProps = {
  mode: 'bet' | 'raise'
  sliderProps: { min: number; max: number }
  chipAmount: number
  isValid: boolean
  onChipAmountChange: (amount: number) => void
  onConfirm: () => void
  onCancel: () => void
  onAllIn: () => void
}

function ChipInput({
  mode,
  sliderProps,
  chipAmount,
  isValid,
  onChipAmountChange,
  onConfirm,
  onCancel,
  onAllIn,
}: ChipInputProps) {
  const sliderLabel = mode === 'bet' ? 'Bet amount' : 'Raise amount'
  const inputLabel = mode === 'bet' ? 'Bet amount input' : 'Raise amount input'

  return (
    <div>
      <input
        type="range"
        min={sliderProps.min}
        max={sliderProps.max}
        step={BIG_BLIND}
        value={chipAmount}
        aria-label={sliderLabel}
        onChange={(e) => onChipAmountChange(Number(e.target.value))}
      />
      <input
        type="number"
        min={sliderProps.min}
        max={sliderProps.max}
        step={BIG_BLIND}
        value={chipAmount}
        aria-label={inputLabel}
        onChange={(e) => onChipAmountChange(Number(e.target.value))}
      />
      <button onClick={onAllIn}>All-in</button>
      <button disabled={!isValid} onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}
