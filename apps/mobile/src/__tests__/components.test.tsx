import { fireEvent, render, screen } from '@testing-library/react-native'
import { AnswerSelector } from '../components/AnswerSelector'
import { Button } from '../components/Button'
import { SealBadge } from '../components/SealBadge'
import { TOUCH_MIN } from '../theme'

describe('SealBadge', () => {
  it('descreve o selo em texto para o leitor de tela, sem depender da cor', async () => {
    await render(<SealBadge seal="acessivel" approval={0.82} evaluationCount={5} />)
    expect(screen.getByLabelText('Selo: Acessível, 82% de aprovação, 5 avaliações')).toBeTruthy()
    expect(screen.getByText('Acessível · 82%')).toBeTruthy()
  })

  it('não mostra percentual quando há poucas avaliações', async () => {
    await render(<SealBadge seal="poucas_avaliacoes" approval={1} evaluationCount={1} />)
    expect(screen.getByLabelText('Selo: Poucas avaliações, 1 avaliação')).toBeTruthy()
  })
})

describe('AnswerSelector', () => {
  it('funciona como grupo de rádio acessível e permite desmarcar', async () => {
    const onChange = jest.fn()
    const { rerender } = await render(
      <AnswerSelector question="Tem piso tátil?" value={undefined} onChange={onChange} />,
    )
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    await fireEvent.press(screen.getByLabelText('Sim, opção 1 de 3'))
    expect(onChange).toHaveBeenLastCalledWith('sim')

    await rerender(<AnswerSelector question="Tem piso tátil?" value="sim" onChange={onChange} />)
    expect(screen.getByRole('radio', { checked: true })).toBeTruthy()
    await fireEvent.press(screen.getByLabelText('Sim, opção 1 de 3'))
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })
})

describe('Button', () => {
  it('tem área de toque mínima e rótulo acessível', async () => {
    await render(
      <Button label="Avaliar" accessibilityLabel="Avaliar este local" onPress={() => {}} />,
    )
    const btn = screen.getByRole('button', { name: 'Avaliar este local' })
    const style = Array.isArray(btn.props.style)
      ? Object.assign({}, ...btn.props.style.flat())
      : btn.props.style
    expect(style.minHeight).toBeGreaterThanOrEqual(44)
    expect(TOUCH_MIN).toBeGreaterThanOrEqual(44)
  })
})
