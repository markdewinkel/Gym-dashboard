import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { getProteinRange } from './dashboardLogic'

describe('gym dashboard profile input and filters', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('allows the weight field to be fully cleared and typed again before commit', async () => {
    const user = userEvent.setup()
    render(<App />)

    const weightInput = screen.getByLabelText(/lichaamsgewicht/i)

    expect(weightInput).toHaveValue('82')

    await user.clear(weightInput)
    expect(weightInput).toHaveValue('')
    expect(screen.queryByText('148 g')).toBeInTheDocument()

    await user.type(weightInput, '90')
    expect(weightInput).toHaveValue('90')
    expect(screen.queryByText('148 g')).toBeInTheDocument()

    await user.tab()

    await waitFor(() => {
      expect(weightInput).toHaveValue('90')
      expect(screen.getByText('162 g')).toBeInTheDocument()
      expect(screen.getByText('144-180 g/dag')).toBeInTheDocument()
    })
  })

  it('does not show NaN or Infinity for empty or invalid temporary weight input', async () => {
    const user = userEvent.setup()
    render(<App />)

    const weightInput = screen.getByLabelText(/lichaamsgewicht/i)

    await user.clear(weightInput)
    expect(weightInput).toHaveValue('')
    expect(document.body).not.toHaveTextContent(/NaN|Infinity/)

    await user.tab()

    await waitFor(() => {
      expect(weightInput).toHaveValue('82')
      expect(screen.getByRole('alert')).toHaveTextContent('Vul een gewicht in tussen 35 en 180 kg.')
      expect(document.body).not.toHaveTextContent(/NaN|Infinity/)
    })

    await user.clear(weightInput)
    await user.type(weightInput, 'abc')
    await user.tab()

    await waitFor(() => {
      expect(weightInput).toHaveValue('82')
      expect(screen.getByRole('alert')).toHaveTextContent('Gebruik een geldig gewicht.')
      expect(document.body).not.toHaveTextContent(/NaN|Infinity/)
    })

    expect(getProteinRange(Number.NaN)).toEqual({ low: 131, high: 164, perMeal: 37 })
    expect(getProteinRange(Number.POSITIVE_INFINITY)).toEqual({ low: 131, high: 164, perMeal: 37 })
  })

  it('updates the protein recommendation after a valid committed weight', async () => {
    const user = userEvent.setup()
    render(<App />)

    const weightInput = screen.getByLabelText(/lichaamsgewicht/i)

    await user.clear(weightInput)
    await user.type(weightInput, '100')
    await user.tab()

    await waitFor(() => {
      expect(weightInput).toHaveValue('100')
      expect(screen.getByText('180 g')).toBeInTheDocument()
      expect(screen.getByText('160-200 g/dag')).toBeInTheDocument()
    })
  })

  it('resets the muscle filter when the selected muscle is no longer available', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('button', { name: 'Gym' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Kuiten' }))
    expect(screen.getByRole('button', { name: 'Kuiten' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Actief: Kuiten')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thuis' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thuis' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByText('Actief: alle spiergroepen')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Alles' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.queryByRole('button', { name: 'Kuiten' })).not.toBeInTheDocument()
    })
  })
})
