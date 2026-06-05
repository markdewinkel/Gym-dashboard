export const MIN_WEIGHT = 35
export const MAX_WEIGHT = 180
export const DEFAULT_WEIGHT = 82

export type ProteinRange = {
  low: number
  high: number
  perMeal: number
}

export type WeightCommitResult = {
  weight: number
  input: string
  message: string
}

export function normalizeStoredWeight(value: unknown, fallback = DEFAULT_WEIGHT) {
  const fallbackWeight = toFiniteNumber(fallback)

  if (fallbackWeight === null) {
    return DEFAULT_WEIGHT
  }

  const parsed = toFiniteNumber(value)
  return parsed === null ? clampWeight(fallbackWeight) : clampWeight(parsed)
}

export function clampWeight(weight: number) {
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, weight))
}

export function formatWeightInput(weight: number) {
  const normalized = normalizeStoredWeight(weight)
  return Number.isInteger(normalized) ? String(normalized) : String(Number(normalized.toFixed(1)))
}

export function commitWeightInput(input: string, currentWeight: number): WeightCommitResult {
  const current = normalizeStoredWeight(currentWeight)
  const normalizedInput = input.trim().replace(',', '.')

  if (normalizedInput === '') {
    return {
      weight: current,
      input: formatWeightInput(current),
      message: `Vul een gewicht in tussen ${MIN_WEIGHT} en ${MAX_WEIGHT} kg.`,
    }
  }

  const parsed = toFiniteNumber(normalizedInput)

  if (parsed === null) {
    return {
      weight: current,
      input: formatWeightInput(current),
      message: 'Gebruik een geldig gewicht.',
    }
  }

  const clamped = clampWeight(parsed)

  return {
    weight: clamped,
    input: formatWeightInput(clamped),
    message:
      clamped === parsed
        ? ''
        : `Gewicht gecorrigeerd naar ${formatWeightInput(clamped)} kg.`,
  }
}

export function getProteinRange(weight: unknown): ProteinRange {
  const normalizedWeight = normalizeStoredWeight(weight)
  const low = Math.round(normalizedWeight * 1.6)
  const high = Math.round(normalizedWeight * 2)

  return {
    low,
    high,
    perMeal: Math.round(((low + high) / 2) / 4),
  }
}

export function normalizeSelectedMuscle<T extends string>(
  selected: T | 'alles',
  available: readonly T[],
) {
  return selected === 'alles' || available.includes(selected) ? selected : 'alles'
}

export function parseSelectValue<T extends string | number>(value: string, options: readonly T[]) {
  const sample = options[0]
  const parsed = typeof sample === 'number' ? Number(value) : value

  return options.includes(parsed as T) ? (parsed as T) : sample
}

function toFiniteNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
