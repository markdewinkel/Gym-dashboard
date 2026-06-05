export type Goal = 'spiermassa' | 'vetverlies' | 'onderhoud'
export type Level = 'beginner' | 'gemiddeld' | 'gevorderd'
export type Diet = 'normaal' | 'vegetarisch' | 'lactosevrij'
export type Location = 'gym' | 'thuis'
export type TrainingDays = 1 | 2 | 3 | 4 | 5 | 6
export type Weekday = 'ma' | 'di' | 'wo' | 'do' | 'vr' | 'za' | 'zo'
export type MovementPattern = 'push' | 'pull' | 'squat' | 'hinge' | 'lunge' | 'carry' | 'core' | 'isolation'

export type Muscle =
  | 'borst'
  | 'rug'
  | 'schouders'
  | 'benen'
  | 'billen'
  | 'hamstrings'
  | 'quadriceps'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'kuiten'
  | 'full body'

export type TechniqueFocus =
  | 'alles'
  | Muscle
  | 'compound lifts'
  | 'blessurepreventie'
  | 'ademhaling / bracing'
  | 'range of motion'

export type ExerciseTechnique = {
  goal: string
  start: string
  posture: string
  steps: string[]
  range: string
  breathing: string
  mistakes: string[]
  targetTips: string[]
  injuryTips: string[]
  levelAdjustments: Record<Level, string>
}

export type Exercise = {
  id: string
  name: string
  location: Location | 'beide'
  movementPattern: MovementPattern
  primaryMuscles: Muscle[]
  secondaryMuscles: Muscle[]
  equipment: string[]
  difficulty: Level
  goalFit: Goal[]
  setsByGoal: Record<Goal, string>
  repsByGoal: Record<Goal, string>
  restByGoal: Record<Goal, string>
  technique: ExerciseTechnique
  alternatives: {
    busyGym: string
    home: string
  }
}

export type Profile = {
  weight: number
  goal: Goal
  days: TrainingDays
  selectedWeekdays: Weekday[]
  level: Level
  diet: Diet
  location: Location
}

export type TrainingDay = {
  weekday: Weekday
  title: string
  focus: Muscle[]
  split: string
  intensity: 'zwaar' | 'normaal' | 'licht' | 'techniek'
  exercises: PlannedExercise[]
  isRest?: boolean
}

export type PlannedExercise = Exercise & {
  plannedSets: string
  plannedReps: string
  plannedRest: string
}

export type Recipe = {
  name: string
  description: string
  ingredients: string[]
  portion: string
  protein: number
  calories: number
  labels: Diet[]
}

export type DashboardMetrics = {
  trainingDays: number
  restDays: number
  exerciseCount: number
  weeklySetLow: number
  weeklySetHigh: number
  avgExercises: number
  proteinMidpoint: number
  focusCount: number
  loadLabel: string
  maxConsecutiveTrainingDays: number
  recoveryQuality: 'goed' | 'oke' | 'risicovol'
  recoverySummary: string
  muscleSetTotals: Partial<Record<Muscle, number>>
}

export type RiskTone = 'good' | 'watch' | 'critical'

export type RiskItem = {
  id: string
  title: string
  status: string
  detail: string
  actionLabel: string
  tone: RiskTone
  onAction: () => void
}

export type LoadChartPoint = {
  label: string
  value: number
  kind: 'training' | 'rest'
}

export type RecoveryWarning = {
  id: string
  tone: RiskTone
  message: string
}
