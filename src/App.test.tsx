import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { getProteinRange } from './dashboardLogic'

describe('training schema generator', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('allows choosing 1 through 6 training days', async () => {
    const user = userEvent.setup()
    render(<App />)

    for (const days of [1, 2, 3, 4, 5, 6]) {
      await user.click(screen.getByRole('button', { name: String(days) }))
      expect(screen.getByRole('button', { name: String(days) })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByText(new RegExp(`Kies exact ${days} trainingsdag`))).toBeInTheDocument()
    }
  })

  it('defaults 3 training days to Monday, Wednesday and Friday', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '3' }))

    const selectedDays = screen
      .getAllByRole('button', { pressed: true })
      .filter((button) => ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].some((day) => button.textContent?.includes(day)))
      .map((button) => within(button).getByText(/Ma|Di|Wo|Do|Vr|Za|Zo/).textContent)

    expect(selectedDays).toEqual(['Ma', 'Wo', 'Vr'])
    expect(screen.queryByText('Di -')).not.toBeInTheDocument()
  })

  it('lets weekdays be selected manually and updates the plan labels', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: /ZaRust/ }))
    await user.click(screen.getByRole('button', { name: /ZoRust/ }))

    expect(screen.getByRole('button', { name: /ZaTraining/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /ZoTraining/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Za -/)).toBeInTheDocument()
    expect(screen.getByText(/Zo -/)).toBeInTheDocument()
  })

  it('shows a recovery warning for consecutive heavy training days', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: /DiRust/ }))

    expect(screen.getAllByText(/Opeenvolgende zware trainingsdagen/i).length).toBeGreaterThan(0)
  })

  it('supports every technique focus option and marks the active focus', async () => {
    const user = userEvent.setup()
    render(<App />)

    for (const focus of [
      'Borst',
      'Rug',
      'Schouders',
      'Benen',
      'Billen',
      'Hamstrings',
      'Quadriceps',
      'Biceps',
      'Triceps',
      'Core',
      'Kuiten',
      'Compound lifts',
      'Blessurepreventie',
      'Ademhaling / bracing',
      'Range of motion',
    ]) {
      await user.click(screen.getByRole('button', { name: focus }))
      expect(screen.getByRole('button', { name: focus })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByText(`Actief: ${focus}`)).toBeInTheDocument()
    }
  })

  it('shows structured exercise technique details', async () => {
    render(<App />)

    expect(screen.getAllByText('Doel van de oefening').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Startpositie').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Uitvoering stap voor stap').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ademhaling/bracing').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Range of motion').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Veelgemaakte fouten').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Veiligheidsadvies').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Niveau-aanpassing').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Drukke gym:/).length).toBeGreaterThan(0)
  })

  it('updates protein and week status after valid profile changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    const weightInput = screen.getByLabelText(/lichaamsgewicht/i)

    await user.clear(weightInput)
    await user.type(weightInput, '100')
    await user.tab()
    await user.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() => {
      expect(weightInput).toHaveValue('100')
      expect(screen.getByText('180 g')).toBeInTheDocument()
      expect(screen.getByText(/160-200 g\/dag/)).toBeInTheDocument()
      expect(screen.getByText('2/5')).toBeInTheDocument()
    })
  })

  it('keeps the weight field clearable without NaN or Infinity output', async () => {
    const user = userEvent.setup()
    render(<App />)

    const weightInput = screen.getByLabelText(/lichaamsgewicht/i)

    expect(weightInput).toHaveValue('82')

    await user.clear(weightInput)
    expect(weightInput).toHaveValue('')
    expect(document.body).not.toHaveTextContent(/NaN|Infinity/)

    await user.tab()

    await waitFor(() => {
      expect(weightInput).toHaveValue('82')
      expect(screen.getByRole('alert')).toHaveTextContent('Vul een gewicht in tussen 35 en 180 kg.')
      expect(document.body).not.toHaveTextContent(/NaN|Infinity/)
    })

    expect(getProteinRange(Number.NaN)).toEqual({ low: 131, high: 164, perMeal: 37 })
    expect(getProteinRange(Number.POSITIVE_INFINITY)).toEqual({ low: 131, high: 164, perMeal: 37 })
  })
})
