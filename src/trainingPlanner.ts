import { exercises } from './data/exercises'
import type {
  DashboardMetrics,
  Exercise,
  Goal,
  LoadChartPoint,
  Location,
  Muscle,
  PlannedExercise,
  Profile,
  RecoveryWarning,
  TechniqueFocus,
  TrainingDay,
  TrainingDays,
  Weekday,
} from './types'

export const weekdayLabels: Record<Weekday, string> = {
  ma: 'Ma',
  di: 'Di',
  wo: 'Wo',
  do: 'Do',
  vr: 'Vr',
  za: 'Za',
  zo: 'Zo',
}

export const weekdays = Object.keys(weekdayLabels) as Weekday[]

export const defaultWeekdaysByDays: Record<TrainingDays, Weekday[]> = {
  1: ['wo'],
  2: ['ma', 'do'],
  3: ['ma', 'wo', 'vr'],
  4: ['ma', 'di', 'do', 'vr'],
  5: ['ma', 'di', 'wo', 'vr', 'za'],
  6: ['ma', 'di', 'wo', 'do', 'vr', 'za'],
}

const splitTemplates: Record<TrainingDays, Array<{ split: string; focus: Muscle[]; intensity: TrainingDay['intensity'] }>> = {
  1: [{ split: 'Full body compact', focus: ['benen', 'borst', 'rug', 'core'], intensity: 'normaal' }],
  2: [
    { split: 'Full body A', focus: ['quadriceps', 'borst', 'rug', 'core'], intensity: 'normaal' },
    { split: 'Full body B', focus: ['hamstrings', 'schouders', 'rug', 'billen'], intensity: 'normaal' },
  ],
  3: [
    { split: 'Full body kracht', focus: ['quadriceps', 'borst', 'rug', 'core'], intensity: 'zwaar' },
    { split: 'Lower techniek', focus: ['hamstrings', 'billen', 'benen', 'core'], intensity: 'normaal' },
    { split: 'Upper/full body volume', focus: ['rug', 'schouders', 'borst', 'triceps'], intensity: 'normaal' },
  ],
  4: [
    { split: 'Upper A', focus: ['borst', 'rug', 'schouders', 'triceps'], intensity: 'zwaar' },
    { split: 'Lower A', focus: ['quadriceps', 'hamstrings', 'billen', 'core'], intensity: 'zwaar' },
    { split: 'Upper B', focus: ['rug', 'borst', 'biceps', 'schouders'], intensity: 'normaal' },
    { split: 'Lower B', focus: ['benen', 'billen', 'kuiten', 'core'], intensity: 'normaal' },
  ],
  5: [
    { split: 'Push', focus: ['borst', 'schouders', 'triceps'], intensity: 'zwaar' },
    { split: 'Pull', focus: ['rug', 'biceps', 'schouders'], intensity: 'zwaar' },
    { split: 'Legs', focus: ['quadriceps', 'hamstrings', 'billen', 'kuiten'], intensity: 'zwaar' },
    { split: 'Techniek en preventie', focus: ['core', 'schouders', 'rug', 'billen'], intensity: 'techniek' },
    { split: 'Upper/lower onderhoud', focus: ['borst', 'rug', 'benen', 'core'], intensity: 'licht' },
  ],
  6: [
    { split: 'Push zwaar', focus: ['borst', 'schouders', 'triceps'], intensity: 'zwaar' },
    { split: 'Pull zwaar', focus: ['rug', 'biceps'], intensity: 'zwaar' },
    { split: 'Legs zwaar', focus: ['quadriceps', 'hamstrings', 'billen'], intensity: 'zwaar' },
    { split: 'Push volume', focus: ['borst', 'schouders', 'triceps'], intensity: 'normaal' },
    { split: 'Pull volume', focus: ['rug', 'biceps', 'core'], intensity: 'normaal' },
    { split: 'Legs volume', focus: ['benen', 'billen', 'kuiten', 'core'], intensity: 'normaal' },
  ],
}

const largeMuscles = new Set<Muscle>(['borst', 'rug', 'benen', 'billen', 'hamstrings', 'quadriceps'])
const lowerMuscles = new Set<Muscle>(['benen', 'billen', 'hamstrings', 'quadriceps', 'kuiten'])

export function normalizeTrainingDays(value: unknown, fallback: TrainingDays = 4): TrainingDays {
  return [1, 2, 3, 4, 5, 6].includes(Number(value)) ? (Number(value) as TrainingDays) : fallback
}

export function normalizeWeekdays(value: unknown, days: TrainingDays): Weekday[] {
  const selected = Array.isArray(value)
    ? value.filter((day): day is Weekday => weekdays.includes(day as Weekday))
    : []

  return reconcileWeekdays(days, selected)
}

export function reconcileWeekdays(days: TrainingDays, selectedWeekdays: Weekday[]): Weekday[] {
  const unique = weekdays.filter((day) => selectedWeekdays.includes(day))
  const recommended = defaultWeekdaysByDays[days]
  const merged = [...unique, ...recommended, ...weekdays].filter(
    (day, index, all) => all.indexOf(day) === index,
  )

  return merged.slice(0, days).sort((a, b) => weekdays.indexOf(a) - weekdays.indexOf(b))
}

export function buildTrainingPlan(profile: Profile, swaps: Record<string, number> = {}): TrainingDay[] {
  const templates = splitTemplates[profile.days]
  const selectedIds = new Set<string>()
  const library = exercises.filter(
    (exercise) => exercise.location === profile.location || exercise.location === 'beide',
  )

  return templates.map((template, index) => {
    const plannedExercises = pickExercises({
      focus: template.focus,
      goal: profile.goal,
      level: profile.level,
      library,
      location: profile.location,
      selectedIds,
      swaps,
      intensity: template.intensity,
      exerciseTarget: getExerciseTarget(profile.days, profile.level, template.intensity),
    })

    return {
      weekday: profile.selectedWeekdays[index],
      title: `${weekdayLabels[profile.selectedWeekdays[index]]} - ${template.split}`,
      split: template.split,
      focus: template.focus,
      intensity: template.intensity,
      exercises: plannedExercises,
    }
  })
}

export function buildWeekSchedule(plan: TrainingDay[]) {
  const byWeekday = new Map(plan.map((day) => [day.weekday, day]))

  return weekdays.map((weekday) => byWeekday.get(weekday) ?? {
    weekday,
    title: `${weekdayLabels[weekday]} - Herstel`,
    split: 'Rustdag',
    focus: [],
    intensity: 'licht' as const,
    exercises: [],
    isRest: true,
  })
}

export function getRecoveryWarnings(plan: TrainingDay[], days: TrainingDays): RecoveryWarning[] {
  const schedule = buildWeekSchedule(plan)
  const warnings: RecoveryWarning[] = []
  const maxConsecutive = getMaxConsecutiveTrainingDays(plan.map((day) => day.weekday))

  if (maxConsecutive >= 3) {
    warnings.push({
      id: 'three-in-row',
      tone: 'critical',
      message: `${maxConsecutive} trainingsdagen achter elkaar: plan minstens een bewust lichte sessie of rustdag.`,
    })
  }

  schedule.forEach((day, index) => {
    if (day.isRest) return
    const next = schedule[(index + 1) % schedule.length]
    if (next.isRest) return

    if (day.intensity !== 'licht' && day.intensity !== 'techniek' && next.intensity !== 'licht') {
      warnings.push({
        id: `consecutive-${day.weekday}-${next.weekday}`,
        tone: day.intensity === 'zwaar' && next.intensity === 'zwaar' ? 'critical' : 'watch',
        message: `Opeenvolgende zware trainingsdagen op ${weekdayLabels[day.weekday]}/${weekdayLabels[next.weekday]}: bewaak techniek en herstel.`,
      })
    }

    const overlap = getHeavyOverlap(day, next)
    if (overlap.length > 0) {
      warnings.push({
        id: `overlap-${day.weekday}-${next.weekday}`,
        tone: day.intensity === 'zwaar' && next.intensity === 'zwaar' ? 'critical' : 'watch',
        message: `${weekdayLabels[day.weekday]}/${weekdayLabels[next.weekday]} belasten opnieuw ${overlap.map(formatMuscle).join(', ')}.`,
      })
    }
  })

  if (days === 6) {
    warnings.push({
      id: 'six-day-recovery',
      tone: 'watch',
      message: '6 dagen PPL x2 werkt alleen met strak herstelmanagement en gecontroleerd volume.',
    })
  }

  return warnings
}

export function getLoadChartData(plan: TrainingDay[]): LoadChartPoint[] {
  const schedule = buildWeekSchedule(plan)

  return schedule.map((day) => ({
    label: weekdayLabels[day.weekday],
    value: day.exercises.reduce((sum, exercise) => sum + parseSetRange(exercise.plannedSets).high, 0),
    kind: day.isRest ? 'rest' : 'training',
  }))
}

export function getActiveFocuses(plan: TrainingDay[]): TechniqueFocus[] {
  const muscles = new Set<Muscle>()
  plan.forEach((day) => {
    day.exercises.forEach((exercise) => {
      exercise.primaryMuscles.forEach((muscle) => muscles.add(muscle))
      exercise.secondaryMuscles.forEach((muscle) => muscles.add(muscle))
    })
  })

  return [
    'alles',
    ...Array.from(muscles),
    'compound lifts',
    'blessurepreventie',
    'ademhaling / bracing',
    'range of motion',
  ]
}

export function exerciseMatchesFocus(exercise: PlannedExercise, focus: TechniqueFocus) {
  if (focus === 'alles') return true
  if (focus === 'compound lifts') return exercise.movementPattern !== 'isolation'
  if (['blessurepreventie', 'ademhaling / bracing', 'range of motion'].includes(focus)) return true

  return (
    exercise.primaryMuscles.includes(focus as Muscle) ||
    exercise.secondaryMuscles.includes(focus as Muscle)
  )
}

export function getDashboardMetrics(
  plan: TrainingDay[],
  proteinRange: { low: number; high: number },
  profile: Profile,
): DashboardMetrics {
  const exerciseCount = plan.reduce((sum, day) => sum + day.exercises.length, 0)
  const setRanges = plan.flatMap((day) => day.exercises.map((exercise) => parseSetRange(exercise.plannedSets)))
  const weeklySetLow = setRanges.reduce((sum, range) => sum + range.low, 0)
  const weeklySetHigh = setRanges.reduce((sum, range) => sum + range.high, 0)
  const maxConsecutiveTrainingDays = getMaxConsecutiveTrainingDays(profile.selectedWeekdays)
  const warnings = getRecoveryWarnings(plan, profile.days)
  const muscleSetTotals = getMuscleSetTotals(plan)
  const loadLabel = weeklySetHigh >= getHighSetThreshold(profile.level) ? 'Hoog' : weeklySetHigh >= 34 ? 'Gebalanceerd' : 'Licht'
  const recoveryQuality: DashboardMetrics['recoveryQuality'] =
    warnings.some((warning) => warning.tone === 'critical') || weeklySetHigh > getMaxRecommendedSets(profile.level)
      ? 'risicovol'
      : warnings.length > 0 || maxConsecutiveTrainingDays === 2
        ? 'oke'
        : 'goed'

  return {
    trainingDays: profile.days,
    restDays: 7 - profile.days,
    exerciseCount,
    weeklySetLow,
    weeklySetHigh,
    avgExercises: Number((exerciseCount / Math.max(1, plan.length)).toFixed(1)),
    proteinMidpoint: Math.round((proteinRange.low + proteinRange.high) / 2),
    focusCount: Object.keys(muscleSetTotals).length,
    loadLabel,
    maxConsecutiveTrainingDays,
    recoveryQuality,
    recoverySummary: warnings[0]?.message ?? 'Rustdagen en spiergroepen zijn logisch gespreid.',
    muscleSetTotals,
  }
}

export function getVolumeWarnings(plan: TrainingDay[], profile: Profile): RecoveryWarning[] {
  const totals = getMuscleSetTotals(plan)
  const warnings: RecoveryWarning[] = []
  const upperPush = (totals.borst ?? 0) + (totals.schouders ?? 0) + (totals.triceps ?? 0)
  const pull = (totals.rug ?? 0) + (totals.biceps ?? 0)
  const lower = (totals.benen ?? 0) + (totals.quadriceps ?? 0) + (totals.hamstrings ?? 0) + (totals.billen ?? 0)

  if (profile.days >= 2 && (totals.rug ?? 0) < 6) {
    warnings.push({ id: 'missing-pull', tone: 'watch', message: 'Rug/trekbewegingen zijn laag; voeg rows of pulldowns toe.' })
  }

  if ((totals.core ?? 0) < 4) {
    warnings.push({ id: 'missing-core', tone: 'watch', message: 'Corevolume is laag; bracingwerk ontbreekt bijna.' })
  }

  if (lower > getMaxMuscleSets(profile.level) * 1.7) {
    warnings.push({ id: 'too-much-legs', tone: 'critical', message: 'Beenbelasting is hoog voor dit niveau; bewaak knieën, heupen en onderrug.' })
  }

  if (upperPush > pull * 1.5) {
    warnings.push({ id: 'push-pull-balance', tone: 'watch', message: 'Push-volume is duidelijk hoger dan pull-volume.' })
  }

  if (profile.goal === 'spiermassa' && profile.days >= 3 && Math.max(...Object.values(totals), 0) < 8) {
    warnings.push({ id: 'low-hypertrophy-volume', tone: 'watch', message: 'Volume is mogelijk te laag voor spiermassa; verhoog pas na technische consistentie.' })
  }

  return warnings
}

export function parseSetRange(value: string) {
  const numbers = value.match(/\d+/g)?.map(Number) ?? []
  const low = numbers[0] ?? 0
  const high = numbers[1] ?? low

  return { low, high }
}

function pickExercises({
  exerciseTarget,
  focus,
  goal,
  intensity,
  level,
  library,
  location,
  selectedIds,
  swaps,
}: {
  exerciseTarget: number
  focus: Muscle[]
  goal: Goal
  intensity: TrainingDay['intensity']
  level: Profile['level']
  library: Exercise[]
  location: Location
  selectedIds: Set<string>
  swaps: Record<string, number>
}) {
  const picked: PlannedExercise[] = []

  focus.forEach((muscle) => {
    const pool = library
      .filter((exercise) => exerciseTargetsMuscle(exercise, muscle))
      .sort((a, b) => scoreExercise(b, goal, level, location, intensity) - scoreExercise(a, goal, level, location, intensity))
    const fresh = pool.filter((exercise) => !selectedIds.has(exercise.id))
    const options = fresh.length > 0 ? fresh : pool
    const seed = options.reduce((sum, exercise) => sum + (swaps[exercise.id] ?? 0), 0)
    const exercise = options[seed % Math.max(1, options.length)]

    if (exercise && picked.every((item) => item.id !== exercise.id)) {
      selectedIds.add(exercise.id)
      picked.push(toPlannedExercise(exercise, goal, level, intensity))
    }
  })

  if (!picked.some((exercise) => exercise.primaryMuscles.includes('core') || exercise.secondaryMuscles.includes('core'))) {
    const core = library.find((exercise) => exercise.primaryMuscles.includes('core') && !selectedIds.has(exercise.id))
    if (core) picked.push(toPlannedExercise(core, goal, level, 'techniek'))
  }

  return picked.slice(0, exerciseTarget)
}

function toPlannedExercise(
  exercise: Exercise,
  goal: Goal,
  level: Profile['level'],
  intensity: TrainingDay['intensity'],
): PlannedExercise {
  const range = parseSetRange(exercise.setsByGoal[goal])
  const levelOffset = level === 'beginner' || intensity === 'techniek' || intensity === 'licht' ? -1 : level === 'gevorderd' && intensity === 'zwaar' ? 1 : 0
  const low = Math.max(1, range.low + Math.min(0, levelOffset))
  const high = Math.max(low, range.high + Math.max(0, levelOffset))

  return {
    ...exercise,
    plannedSets: low === high ? String(low) : `${low}-${high}`,
    plannedReps: intensity === 'techniek' ? '10-15 technisch' : exercise.repsByGoal[goal],
    plannedRest: intensity === 'techniek' ? '45-75 sec' : exercise.restByGoal[goal],
  }
}

function scoreExercise(
  exercise: Exercise,
  goal: Goal,
  level: Profile['level'],
  location: Location,
  intensity: TrainingDay['intensity'],
) {
  let score = 0
  if (exercise.goalFit.includes(goal)) score += 4
  if (exercise.location === location) score += 2
  if (exercise.location === 'beide') score += 1
  if (exercise.difficulty === level) score += 2
  if (level === 'beginner' && exercise.difficulty === 'beginner') score += 2
  if (intensity === 'techniek' && ['core', 'pull', 'hinge'].includes(exercise.movementPattern)) score += 2
  if (intensity === 'zwaar' && exercise.movementPattern !== 'isolation') score += 1
  return score
}

function getExerciseTarget(days: TrainingDays, level: Profile['level'], intensity: TrainingDay['intensity']) {
  if (days <= 2) return level === 'beginner' ? 4 : 5
  if (intensity === 'techniek' || intensity === 'licht') return 4
  if (days >= 5) return level === 'gevorderd' ? 5 : 4
  return level === 'beginner' ? 4 : 5
}

function exerciseTargetsMuscle(exercise: Exercise, muscle: Muscle) {
  if (muscle === 'benen') {
    return [...exercise.primaryMuscles, ...exercise.secondaryMuscles].some((item) => lowerMuscles.has(item))
  }

  return exercise.primaryMuscles.includes(muscle) || exercise.secondaryMuscles.includes(muscle)
}

function getMaxConsecutiveTrainingDays(selectedWeekdays: Weekday[]) {
  const trainingIndexes = new Set(selectedWeekdays.map((day) => weekdays.indexOf(day)))
  let best = 0

  for (let start = 0; start < weekdays.length; start += 1) {
    let count = 0
    for (let offset = 0; offset < weekdays.length; offset += 1) {
      if (!trainingIndexes.has((start + offset) % weekdays.length)) break
      count += 1
    }
    best = Math.max(best, count)
  }

  return best
}

function getHeavyOverlap(current: TrainingDay, next: TrainingDay) {
  const currentFocus = new Set(current.focus.filter((muscle) => largeMuscles.has(muscle) || muscle === 'benen'))
  return next.focus.filter((muscle) => currentFocus.has(muscle) || (muscle === 'benen' && [...currentFocus].some((item) => lowerMuscles.has(item))))
}

function getMuscleSetTotals(plan: TrainingDay[]) {
  const totals: Partial<Record<Muscle, number>> = {}

  plan.forEach((day) => {
    day.exercises.forEach((exercise) => {
      const sets = parseSetRange(exercise.plannedSets).high
      exercise.primaryMuscles.forEach((muscle) => {
        totals[muscle] = (totals[muscle] ?? 0) + sets
      })
      exercise.secondaryMuscles.forEach((muscle) => {
        totals[muscle] = (totals[muscle] ?? 0) + Math.ceil(sets / 2)
      })
    })
  })

  return totals
}

function getHighSetThreshold(level: Profile['level']) {
  return level === 'beginner' ? 46 : level === 'gemiddeld' ? 62 : 78
}

function getMaxRecommendedSets(level: Profile['level']) {
  return level === 'beginner' ? 54 : level === 'gemiddeld' ? 72 : 92
}

function getMaxMuscleSets(level: Profile['level']) {
  return level === 'beginner' ? 12 : level === 'gemiddeld' ? 18 : 24
}

function formatMuscle(muscle: Muscle) {
  return muscle === 'full body' ? 'full body' : muscle
}
