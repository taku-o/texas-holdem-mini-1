import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { ActionBar } from './ActionBar'
import type { ValidAction } from '../domain/types'
import { BIG_BLIND } from '../domain/constants'

describe('ActionBar', () => {
  const defaultProps = {
    validActions: [
      { type: 'fold' as const },
      { type: 'check' as const },
      { type: 'bet' as const, min: BIG_BLIND, max: 1000 },
    ],
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 1000 },
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 1000 },
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 1000 },
      ]
      const { onAction } = renderActionBar({ validActions })

      // When: Callボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /call/i }))

      // Then: onActionがcallアクションで呼ばれる
      expect(onAction).toHaveBeenCalledWith({ type: 'call' })
    })
  })

  describe('8.3: 有効/無効アクションの制御', () => {
    test('should disable buttons for actions not in validActions', () => {
      // Given: fold と check のみ有効（bet/call/raise は無効）
      const validActions: ValidAction[] = [
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
      const validActions: ValidAction[] = [{ type: 'fold' }]
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 1000 },
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 1000 },
      ]
      renderActionBar({ validActions })

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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: スライダーの min が BIG_BLIND、max が playerChips
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('min')).toBe(String(BIG_BLIND))
      expect(slider.getAttribute('max')).toBe('500')
    })

    test('should set raise slider min and max from ValidAction', () => {
      // Given: raise が有効で min=30 (currentBet+BIG_BLIND), max=510 (playerCurrentBetInRound+playerChips)
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 510 },
      ]
      renderActionBar({ validActions })

      // When: Raiseボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))

      // Then: スライダーの min/max が ValidAction の値と一致
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('min')).toBe('30')
      expect(slider.getAttribute('max')).toBe('510')
    })

    test('should sync slider and number input values', () => {
      // Given: bet入力モードが表示されている
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      const { onAction } = renderActionBar({ validActions })
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 510 },
      ]
      const { onAction } = renderActionBar({ validActions })
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: 初期値が BIG_BLIND
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', String(BIG_BLIND))
    })

    test('should default raise amount to ValidAction.min', () => {
      // Given: raise が有効で min=40 (currentBet + BIG_BLIND)
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 40, max: 510 },
      ]
      renderActionBar({ validActions })

      // When: Raiseボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))

      // Then: 初期値が ValidAction.min = 40
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', '40')
    })

    test('should allow all-in when playerChips is less than minimum bet', () => {
      // Given: チップが BIG_BLIND 未満（ドメイン層がmin=5, max=5を設定）
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: 5, max: 5 },
      ]
      renderActionBar({ validActions })

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: スライダーの min と max が playerChips（オールイン）
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('max')).toBe('5')
    })

    test('should hide chip input area when cancel is clicked', () => {
      // Given: bet入力モードが表示されている
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 1000 },
      ]
      renderActionBar({ validActions })
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
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: 数値入力のデフォルト値 = スライダーのmin値
      const slider = screen.getByRole('slider')
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', slider.getAttribute('min'))
    })

    test('should have raise default value equal to slider min', () => {
      // Given: raise が有効
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 510 },
      ]
      renderActionBar({ validActions })

      // When: Raiseボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))

      // Then: 数値入力のデフォルト値 = スライダーのmin値
      const slider = screen.getByRole('slider')
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', slider.getAttribute('min'))
    })
  })

  describe('11.1: チップ額のクライアント側バリデーション', () => {
    test('should disable confirm button when chipAmount is below min', () => {
      // Given: bet入力モードで数値入力をmin未満に設定
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When: 数値入力をmin未満の値にする
      const numberInput = screen.getByRole('spinbutton')
      fireEvent.change(numberInput, { target: { value: '0' } })

      // Then: Confirmボタンが無効になる
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).toBeDisabled()
    })

    test('should disable confirm button when chipAmount exceeds max', () => {
      // Given: bet入力モードで数値入力をmax超過に設定
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When: 数値入力をmax超過の値にする
      const numberInput = screen.getByRole('spinbutton')
      fireEvent.change(numberInput, { target: { value: '600' } })

      // Then: Confirmボタンが無効になる
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).toBeDisabled()
    })

    test('should enable confirm button when chipAmount equals min', () => {
      // Given: bet入力モードで数値入力をmin値に設定
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When: 数値入力をmin値に設定する
      const numberInput = screen.getByRole('spinbutton')
      fireEvent.change(numberInput, { target: { value: String(BIG_BLIND) } })

      // Then: Confirmボタンが有効になる
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).not.toBeDisabled()
    })

    test('should enable confirm button when chipAmount equals max', () => {
      // Given: bet入力モードで数値入力をmax値に設定
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When: 数値入力をmax値に設定する
      const numberInput = screen.getByRole('spinbutton')
      fireEvent.change(numberInput, { target: { value: '500' } })

      // Then: Confirmボタンが有効になる
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).not.toBeDisabled()
    })

    test('should not call onAction when confirm is clicked with invalid chipAmount', () => {
      // Given: bet入力モードで数値入力をmax超過に設定
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      const { onAction } = renderActionBar({ validActions })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))
      const numberInput = screen.getByRole('spinbutton')
      fireEvent.change(numberInput, { target: { value: '600' } })

      // When: Confirmボタンをクリックする（disabled状態）
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      fireEvent.click(confirmButton)

      // Then: onActionが呼ばれない
      expect(onAction).not.toHaveBeenCalled()
    })

    test('should disable confirm button when raise chipAmount is below min', () => {
      // Given: raise入力モードで数値入力をmin未満に設定
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 510 },
      ]
      renderActionBar({ validActions })
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))

      // When: 数値入力をmin未満の値にする
      const numberInput = screen.getByRole('spinbutton')
      fireEvent.change(numberInput, { target: { value: '10' } })

      // Then: Confirmボタンが無効になる
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      expect(confirmButton).toBeDisabled()
    })
  })

  describe('11.2: チップ入力のアクセシビリティラベル', () => {
    test('should have aria-label on slider when in bet mode', () => {
      // Given: bet入力モードが表示されている
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: スライダーにaria-labelが設定されている
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('aria-label')).toBeTruthy()
    })

    test('should have aria-label on number input when in bet mode', () => {
      // Given: bet入力モードが表示されている
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })

      // When: Betボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // Then: 数値入力にaria-labelが設定されている
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput.getAttribute('aria-label')).toBeTruthy()
    })

    test('should have aria-label on slider when in raise mode', () => {
      // Given: raise入力モードが表示されている
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 510 },
      ]
      renderActionBar({ validActions })

      // When: Raiseボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))

      // Then: スライダーにaria-labelが設定されている
      const slider = screen.getByRole('slider')
      expect(slider.getAttribute('aria-label')).toBeTruthy()
    })

    test('should have aria-label on number input when in raise mode', () => {
      // Given: raise入力モードが表示されている
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 510 },
      ]
      renderActionBar({ validActions })

      // When: Raiseボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))

      // Then: 数値入力にaria-labelが設定されている
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput.getAttribute('aria-label')).toBeTruthy()
    })

    test('should distinguish bet and raise in aria-label', () => {
      // Given: bet と raise のそれぞれの入力モード

      // When: bet モードでスライダーのラベルを取得
      const validActionsBet: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      const { unmount } = render(
        <ActionBar validActions={validActionsBet} onAction={vi.fn()} />,
      )
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))
      const betSliderLabel = screen.getByRole('slider').getAttribute('aria-label')
      unmount()

      // When: raise モードでスライダーのラベルを取得
      const validActionsRaise: ValidAction[] = [
        { type: 'fold' },
        { type: 'call' },
        { type: 'raise', min: 30, max: 510 },
      ]
      render(
        <ActionBar validActions={validActionsRaise} onAction={vi.fn()} />,
      )
      fireEvent.click(screen.getByRole('button', { name: /raise/i }))
      const raiseSliderLabel = screen.getByRole('slider').getAttribute('aria-label')

      // Then: bet と raise のラベルが異なる
      expect(betSliderLabel).not.toBe(raiseSliderLabel)
    })
  })

  describe('8.2: クイックベットボタン', () => {
    test('should provide all-in quick bet button', () => {
      // Given: bet入力モードが表示されている
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      renderActionBar({ validActions })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When/Then: All-inボタンが存在する
      expect(
        screen.getByRole('button', { name: /all.?in/i }),
      ).toBeTruthy()
    })

    test('should set amount to playerChips when all-in button is clicked', () => {
      // Given: bet入力モードでall-inボタンがある
      const validActions: ValidAction[] = [
        { type: 'fold' },
        { type: 'check' },
        { type: 'bet', min: BIG_BLIND, max: 500 },
      ]
      const { onAction } = renderActionBar({ validActions })
      fireEvent.click(screen.getByRole('button', { name: /bet/i }))

      // When: All-inボタンをクリックする
      fireEvent.click(screen.getByRole('button', { name: /all.?in/i }))

      // Then: 数値入力が playerChips に設定される
      const numberInput = screen.getByRole('spinbutton')
      expect(numberInput).toHaveProperty('value', '500')
    })
  })
})
