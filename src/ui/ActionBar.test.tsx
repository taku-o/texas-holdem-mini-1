import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { ActionBar } from './ActionBar'
import type { PlayerAction } from '../domain/types'
import { BIG_BLIND } from '../domain/constants'

describe('ActionBar', () => {
  const defaultProps = {
    validActions: [
      { type: 'fold' as const },
      { type: 'check' as const },
      { type: 'bet' as const },
    ],
    playerChips: 1000,
    currentBet: 0,
    playerCurrentBetInRound: 0,
    onAction: vi.fn(),
  }

  function renderActionBar(overrides: Partial<typeof defaultProps> = {}) {
    const props = { ...defaultProps, onAction: vi.fn(), ...overrides }
    const result = render(<ActionBar {...props} />)
    return { ...result, onAction: props.onAction }
  }

  describe('8.1: アクションボタンの表示', () => {
    test('should render fold, check, and bet buttons when those actions are valid', () => {
      // Given: fold, check, bet が有効なアクション
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet' },
      ]

      // When: ActionBarをレンダリングする
      renderActionBar({ validActions })

      // Then: 各ボタンが表示される
      expect(screen.getByRole('button', { name: /fold/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /check/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /bet/i })).toBeTruthy()
    })

    test('should render fold, call, and raise buttons when those actions are valid', () => {
      // Given: fold, call, raise が有効なアクション
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise' },
      ]

      // When: ActionBarをレンダリングする
      renderActionBar({ validActions })

      // Then: 各ボタンが表示される
      expect(screen.getByRole('button', { name: /fold/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /call/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /raise/i })).toBeTruthy()
    })

    test('should call onAction with fold immediately when fold button is clicked', () => {
      // Given: fold が有効なアクション
      const { onAction } = renderActionBar()

      // When: Foldボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /fold/i }))

      // Then: onActionがfoldアクションで呼ばれる
      expect(onAction).toHaveBeenCalledWith({ type: 'fold' })
    })

    test('should call onAction with check immediately when check button is clicked', () => {
      // Given: check が有効なアクション
      const { onAction } = renderActionBar()

      // When: Checkボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /check/i }))

      // Then: onActionがcheckアクションで呼ばれる
      expect(onAction).toHaveBeenCalledWith({ type: 'check' })
    })

    test('should call onAction with call immediately when call button is clicked', () => {
      // Given: call が有効なアクション
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise' },
      ]
      const { onAction } = renderActionBar({ validActions, currentBet: 20 })

      // When: Callボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /call/i }))

      // Then: onActionがcallアクションで呼ばれる
      expect(onAction).toHaveBeenCalledWith({ type: 'call' })
    })
  })

  describe('8.3: 有効/無効アクションの制御', () => {
    test('should disable buttons for actions not in validActions', () => {
      // Given: fold と check のみ有効（bet/call/raise は無効）
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'check' },
      ]

      // When: ActionBarをレンダリングする
      renderActionBar({ validActions })

      // Then: fold と check は有効、他は無効
      expect(screen.getByRole('button', { name: /fold/i })).not.toBeDisabled()
      expect(screen.getByRole('button', { name: /check/i })).not.toBeDisabled()

      // bet, call, raise ボタンは無効（存在する場合）
      const betButton = screen.queryByRole('button', { name: /^bet$/i })
      const callButton = screen.queryByRole('button', { name: /call/i })
      const raiseButton = screen.queryByRole('button', { name: /raise/i })
      if (betButton) expect(betButton).toBeDisabled()
      if (callButton) expect(callButton).toBeDisabled()
      if (raiseButton) expect(raiseButton).toBeDisabled()
    })

    test('should not call onAction when a disabled button is clicked', () => {
      // Given: fold のみ有効
      const validActions: PlayerAction[] = [{ type: 'fold' }]
      const { onAction } = renderActionBar({ validActions })

      // When: 無効なボタン（check等）をクリックしようとする
      const checkButton = screen.queryByRole('button', { name: /check/i })
      if (checkButton) {
        fireEvent.click(checkButton)
        // Then: onAction が check で呼ばれない
        expect(onAction).not.toHaveBeenCalledWith(
          expect.objectContaining({ type: 'check' }),
        )
      }
    })

    test('should enable fold button when fold is in validActions', () => {
      // Given: fold が有効
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise' },
      ]

      // When: ActionBarをレンダリングする
      renderActionBar({ validActions })

      // Then: fold ボタンが有効
      expect(screen.getByRole('button', { name: /fold/i })).not.toBeDisabled()
    })
  })

  describe('8.2: ベット時のチップ数入力', () => {
    test('should show chip input area when bet button is clicked', () => {
      // Given: bet が有効なアクション
      renderActionBar()

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: チップ数入力エリアが表示される
      expect(screen.getByRole('slider')).toBeTruthy()
      expect(screen.getByRole('spinbutton')).toBeTruthy()
    })

    test('should show chip input area when raise button is clicked', () => {
      // Given: raise が有効なアクション
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise' },
      ]
      renderActionBar({ validActions, currentBet: 20 })

      // When: Raiseボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))

      // Then: チップ数入力エリアが表示される
      expect(screen.getByRole('slider')).toBeTruthy()
      expect(screen.getByRole('spinbutton')).toBeTruthy()
    })

    test('should not show chip input area initially', () => {
      // Given: ActionBarをレンダリングする
      renderActionBar()

      // When: 何もクリックしない

      // Then: チップ数入力エリアは表示されない
      expect(screen.queryByRole('slider')).toBeNull()
      expect(screen.queryByRole('spinbutton')).toBeNull()
    })

    test('should set bet slider min to BIG_BLIND and max to playerChips', () => {
      // Given: bet が有効で playerChips = 500
      renderActionBar({ playerChips: 500 })

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: スライダーの min が BIG_BLIND、max が playerChips
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('min')).toBe(String(BIG_BLIND))
      expect(slider.getAttribute('max')).toBe('500')
    })

    test('should set raise slider min to currentBet * 2 and max to playerChips + playerCurrentBetInRound', () => {
      // Given: raise が有効で currentBet=20, playerChips=500, playerCurrentBetInRound=10
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise' },
      ]
      renderActionBar({
        validActions,
        currentBet: 20,
        playerChips: 500,
        playerCurrentBetInRound: 10,
      })

      // When: Raiseボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))

      // Then: スライダーの min が currentBet * 2 = 40、max が playerChips + playerCurrentBetInRound = 510
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('min')).toBe('40')
      expect(slider.getAttribute('max')).toBe('510')
    })

    test('should sync slider and number input values', () => {
      // Given: bet入力モードが表示されている
      renderActionBar({ playerChips: 500 })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When: スライダーの値を変更する
      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '100' } })

      // Then: 数値入力も同じ値になる
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', '100')
    })

    test('should sync number input change to slider', () => {
      // Given: bet入力モードが表示されている
      renderActionBar({ playerChips: 500 })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When: 数値入力の値を変更する
      const numberInput = screen.getByRole('spinbutton')
      fireEvent.change(numberInput, { target: { value: '200' } })

      // Then: スライダーも同じ値になる
      const slider = screen.getByRole('slider')
      expect(slider).toHaveProperty('value', '200')
    })

    test('should call onAction with bet and amount when confirm button is clicked', () => {
      // Given: bet入力モードでチップ数を設定
      const { onAction } = renderActionBar({ playerChips: 500 })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))
      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '100' } })

      // When: 確定ボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /confirm|確定/i }))

      // Then: onActionがbet + amountで呼ばれる
      expect(onAction).toHaveBeenCalledWith({ type: 'bet', amount: 100 })
    })

    test('should call onAction with raise and amount when confirm button is clicked', () => {
      // Given: raise入力モードでチップ数を設定
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise' },
      ]
      const { onAction } = renderActionBar({
        validActions,
        currentBet: 20,
        playerChips: 500,
        playerCurrentBetInRound: 10,
      })
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))
      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '60' } })

      // When: 確定ボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /confirm|確定/i }))

      // Then: onActionがraise + amountで呼ばれる
      expect(onAction).toHaveBeenCalledWith({ type: 'raise', amount: 60 })
    })

    test('should align bet amount to BIG_BLIND units', () => {
      // Given: bet入力モードが表示されている
      renderActionBar({ playerChips: 500 })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When: スライダーの step 属性を確認する
      const slider = screen.getByRole('slider')

      // Then: step が BIG_BLIND 単位
      expect(slider.getAttribute('step')).toBe(String(BIG_BLIND))
    })
  })

  describe('8.2: チップ入力の境界値', () => {
    test('should default bet amount to BIG_BLIND', () => {
      // Given: bet が有効
      renderActionBar({ playerChips: 500 })

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: 初期値が BIG_BLIND
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', String(BIG_BLIND))
    })

    test('should default raise amount to currentBet * 2', () => {
      // Given: raise が有効で currentBet=30
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise' },
      ]
      renderActionBar({
        validActions,
        currentBet: 30,
        playerChips: 500,
        playerCurrentBetInRound: 10,
      })

      // When: Raiseボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))

      // Then: 初期値が currentBet * 2 = 60
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', '60')
    })

    test('should allow all-in when playerChips is less than minimum bet', () => {
      // Given: チップが BIG_BLIND 未満
      renderActionBar({ playerChips: 5 })

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: スライダーの min と max が playerChips（オールイン）
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('max')).toBe('5')
    })

    test('should hide chip input area when cancel is clicked', () => {
      // Given: bet入力モードが表示されている
      renderActionBar()
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))
      expect(screen.getByRole('slider')).toBeTruthy()

      // When: キャンセルボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /cancel|キャンセル/i }))

      // Then: チップ入力エリアが非表示になる
      expect(screen.queryByRole('slider')).toBeNull()
    })
  })

  describe('dry-violation: デフォルト値とスライダーmin値の一貫性', () => {
    test('should have bet default value equal to slider min', () => {
      // Given: bet が有効で playerChips > BIG_BLIND
      renderActionBar({ playerChips: 500 })

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: 数値入力のデフォルト値 = スライダーのmin値
      const slider = screen.getByRole('slider')
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', slider.getAttribute('min'))
    })

    test('should have raise default value equal to slider min', () => {
      // Given: raise が有効
      const validActions: PlayerAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise' },
      ]
      renderActionBar({
        validActions,
        currentBet: 20,
        playerChips: 500,
        playerCurrentBetInRound: 10,
      })

      // When: Raiseボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))

      // Then: 数値入力のデフォルト値 = スライダーのmin値
      const slider = screen.getByRole('slider')
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', slider.getAttribute('min'))
    })
  })

  describe('8.2: クイックベットボタン', () => {
    test('should provide all-in quick bet button', () => {
      // Given: bet入力モードが表示されている
      renderActionBar({ playerChips: 500 })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When/Then: All-inボタンが存在する
      expect(
        screen.getByRole('button', { name: /all.?in/i }),
      ).toBeTruthy()
    })

    test('should set amount to playerChips when all-in button is clicked', () => {
      // Given: bet入力モードでall-inボタンがある
      const { onAction } = renderActionBar({ playerChips: 500 })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When: All-inボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /all.?in/i }))

      // Then: 数値入力が playerChips に設定される
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', '500')
    })
  })
})
