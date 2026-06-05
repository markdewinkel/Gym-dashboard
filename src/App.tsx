import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  commitWeightInput,
  formatWeightInput,
  getProteinRange,
  normalizeStoredWeight,
  parseSelectValue,
} from './dashboardLogic'
import {
  buildTrainingPlan,
  buildWeekSchedule,
  defaultWeekdaysByDays,
  exerciseMatchesFocus,
  getActiveFocuses,
  getDashboardMetrics,
  getLoadChartData,
  getRecoveryWarnings,
  getVolumeWarnings,
  normalizeTrainingDays,
  normalizeWeekdays,
  reconcileWeekdays,
  weekdayLabels,
  weekdays,
} from './trainingPlanner'
import type {
  DashboardMetrics,
  Diet,
  Goal,
  LoadChartPoint,
  Location,
  Muscle,
  PlannedExercise,
  Profile,
  Recipe,
  RecoveryWarning,
  TechniqueFocus,
  TrainingDay,
  TrainingDays,
  Weekday,
} from './types'

const STORAGE_KEY = 'personal-gym-dashboard-profile'
const trainingDayOptions = [1, 2, 3, 4, 5, 6] as const
const focusOptions: TechniqueFocus[] = [
  'alles',
  'borst',
  'rug',
  'schouders',
  'benen',
  'billen',
  'hamstrings',
  'quadriceps',
  'biceps',
  'triceps',
  'core',
  'kuiten',
  'compound lifts',
  'blessurepreventie',
  'ademhaling / bracing',
  'range of motion',
]

const defaultProfile: Profile = {
  weight: 82,
  goal: 'spiermassa',
  days: 4,
  selectedWeekdays: defaultWeekdaysByDays[4],
  level: 'gemiddeld',
  diet: 'normaal',
  location: 'gym',
}

const muscleLabels: Record<Muscle, string> = {
  borst: 'Borst',
  rug: 'Rug',
  schouders: 'Schouders',
  benen: 'Benen',
  billen: 'Billen',
  hamstrings: 'Hamstrings',
  quadriceps: 'Quadriceps',
  biceps: 'Biceps',
  triceps: 'Triceps',
  core: 'Core',
  kuiten: 'Kuiten',
  'full body': 'Full body',
}

const focusLabels: Record<TechniqueFocus, string> = {
  alles: 'Alles',
  borst: 'Borst',
  rug: 'Rug',
  schouders: 'Schouders',
  benen: 'Benen',
  billen: 'Billen',
  hamstrings: 'Hamstrings',
  quadriceps: 'Quadriceps',
  biceps: 'Biceps',
  triceps: 'Triceps',
  core: 'Core',
  kuiten: 'Kuiten',
  'full body': 'Full body',
  'compound lifts': 'Compound lifts',
  blessurepreventie: 'Blessurepreventie',
  'ademhaling / bracing': 'Ademhaling / bracing',
  'range of motion': 'Range of motion',
}

const recipes: Recipe[] = [
  {
    name: 'Kip rijst bowl',
    description: 'Herstelmaaltijd met veel eiwit en koolhydraten.',
    ingredients: ['160 g kipfilet', '125 g gekookte rijst', '200 g wokgroente', '1 el sojasaus'],
    portion: '1 grote bowl',
    protein: 42,
    calories: 560,
    labels: ['normaal', 'lactosevrij'],
  },
  {
    name: 'Skyr met banaan en noten',
    description: 'Snel ontbijt of snack met veel proteine.',
    ingredients: ['300 g skyr', '1 banaan', '20 g walnoten', '30 g havermout'],
    portion: '1 kom',
    protein: 35,
    calories: 480,
    labels: ['normaal', 'vegetarisch'],
  },
  {
    name: 'Tofu quinoa traybake',
    description: 'Vegetarische maaltijd met complete eiwitbron en vezels.',
    ingredients: ['180 g tofu', '120 g gekookte quinoa', '250 g groente', '1 el olijfolie'],
    portion: '1 bord',
    protein: 31,
    calories: 610,
    labels: ['vegetarisch', 'lactosevrij'],
  },
  {
    name: 'Eiwitrijke linzencurry',
    description: 'Plantaardige proteine met trage koolhydraten.',
    ingredients: ['200 g linzen', '150 ml kokosmelk light', 'Spinazie', 'Currykruiden', '100 g rijst'],
    portion: '1 diepe kom',
    protein: 28,
    calories: 590,
    labels: ['vegetarisch', 'lactosevrij'],
  },
]

function App() {
  const [profile, setProfile] = useState<Profile>(() => loadProfile())
  const [techniqueFocus, setTechniqueFocus] = useState<TechniqueFocus>('alles')
  const [swaps, setSwaps] = useState<Record<string, number>>({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  const plan = useMemo(() => buildTrainingPlan(profile, swaps), [profile, swaps])
  const proteinRange = useMemo(() => getProteinRange(profile.weight), [profile.weight])
  const metrics = useMemo(() => getDashboardMetrics(plan, proteinRange, profile), [plan, profile, proteinRange])
  const loadChartData = useMemo(() => getLoadChartData(plan), [plan])
  const schedule = useMemo(() => buildWeekSchedule(plan), [plan])
  const recoveryWarnings = useMemo(() => getRecoveryWarnings(plan, profile.days), [plan, profile.days])
  const volumeWarnings = useMemo(() => getVolumeWarnings(plan, profile), [plan, profile])
  const availableFocuses = useMemo(() => getActiveFocuses(plan), [plan])
  const selectedFocus = availableFocuses.includes(techniqueFocus) ? techniqueFocus : 'alles'
  const visiblePlan = useMemo(
    () =>
      plan.map((day) => ({
        ...day,
        exercises: day.exercises.filter((exercise) => exerciseMatchesFocus(exercise, selectedFocus)),
      })),
    [plan, selectedFocus],
  )
  const matchingRecipes = recipes.filter((recipe) => recipe.labels.includes(profile.diet)).slice(0, 3)

  function changeProfile(next: Profile) {
    setProfile({
      ...next,
      days: normalizeTrainingDays(next.days),
      selectedWeekdays: reconcileWeekdays(normalizeTrainingDays(next.days), next.selectedWeekdays),
    })
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-title">
          <p className="eyebrow">Persoonlijke generator</p>
          <h1>Trainingsschema-generator</h1>
        </div>
        <div className="topbar-controls">
          <div className="status-strip" aria-label="Actieve profielstatus">
            <span>{goalLabel(profile.goal)}</span>
            <span>{profile.days} trainingsdagen</span>
            <span>{metrics.recoveryQuality} herstel</span>
          </div>
          <LocationToggle
            location={profile.location}
            onChange={(location) => changeProfile({ ...profile, location })}
          />
        </div>
      </header>

      <section className="operations-grid">
        <ProfileForm profile={profile} onChange={changeProfile} />
        <div className="operations-stack">
          <KpiPanel metrics={metrics} proteinRange={proteinRange} profile={profile} />
          <WarningPanel title="Herstelchecks" warnings={[...recoveryWarnings, ...volumeWarnings]} />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Kalenderstrip</p>
            <h2>Kies exact {profile.days} trainingsdag{profile.days === 1 ? '' : 'en'}</h2>
          </div>
          <span className="panel-badge">Aanbevolen: {defaultWeekdaysByDays[profile.days].map((day) => weekdayLabels[day]).join('/')}</span>
        </div>
        <WeekdaySelector profile={profile} onChange={changeProfile} warnings={recoveryWarnings} />
        <WeekOverview schedule={schedule} />
      </section>

      <OperationsCharts data={loadChartData} metrics={metrics} proteinRange={proteinRange} />

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Schema</p>
            <h2>{splitSummary(profile.days)}</h2>
          </div>
          <TechniqueFocusFilter value={selectedFocus} onChange={setTechniqueFocus} />
        </div>
        <div className="training-list">
          {visiblePlan.map((day, index) => (
            <TrainingDayCard
              day={day}
              focus={selectedFocus}
              key={`${day.weekday}-${day.split}`}
              number={index + 1}
              onSwap={(exercise) =>
                setSwaps((current) => ({ ...current, [exercise.id]: (current[exercise.id] ?? 0) + 1 }))
              }
            />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Volume</p>
            <h2>Werksets per spiergroep</h2>
          </div>
          <p className="section-copy">Beginner lager volume, gemiddeld gematigd, gevorderd meer frequentie met herstelcheck.</p>
        </div>
        <VolumeGrid totals={metrics.muscleSetTotals} />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Voeding</p>
            <h2>Proteine en herstel</h2>
          </div>
          <p className="section-copy">ISSN-range verwerkt als praktische dagrange voor sportende mensen.</p>
        </div>
        <div className="recipe-grid">
          {matchingRecipes.map((recipe) => (
            <RecipeCard key={recipe.name} recipe={recipe} />
          ))}
        </div>
      </section>

      <footer className="disclaimer">
        Gebruikte richtlijnen: CDC/Physical Activity Guidelines voor minstens 2 dagen spierversterking en grote spiergroepen,
        Mayo Clinic en NSCA voor herstel tussen dezelfde spiergroepen, ACSM voor 2-3 full-body starts en 8-12 reps,
        ISSN voor circa 1.4-2.0 g proteine/kg/dag. Dit is algemene fitnessinformatie, geen medisch advies.
      </footer>
    </main>
  )
}

function loadProfile(): Profile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultProfile

    const parsed = JSON.parse(stored) as Partial<Profile>
    const days = normalizeTrainingDays(parsed.days, defaultProfile.days)

    return {
      weight: normalizeStoredWeight(parsed.weight, defaultProfile.weight),
      goal: isOneOf(parsed.goal, ['spiermassa', 'vetverlies', 'onderhoud']) ? parsed.goal : defaultProfile.goal,
      days,
      selectedWeekdays: normalizeWeekdays(parsed.selectedWeekdays, days),
      level: isOneOf(parsed.level, ['beginner', 'gemiddeld', 'gevorderd']) ? parsed.level : defaultProfile.level,
      diet: isOneOf(parsed.diet, ['normaal', 'vegetarisch', 'lactosevrij']) ? parsed.diet : defaultProfile.diet,
      location: isOneOf(parsed.location, ['gym', 'thuis']) ? parsed.location : defaultProfile.location,
    }
  } catch {
    return defaultProfile
  }
}

function isOneOf<T extends string | number>(value: unknown, options: readonly T[]): value is T {
  return options.includes(value as T)
}

function LocationToggle({ location, onChange }: { location: Location; onChange: (location: Location) => void }) {
  return (
    <div className="location-toggle" aria-label="Trainingslocatie">
      {(['gym', 'thuis'] as const).map((option) => (
        <button
          aria-pressed={location === option}
          className={location === option ? 'active' : ''}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {option === 'gym' ? 'Gym' : 'Thuis'}
        </button>
      ))}
    </div>
  )
}

function ProfileForm({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  const [weightDraft, setWeightDraft] = useState(() => ({
    input: formatWeightInput(profile.weight),
    message: '',
    sourceWeight: profile.weight,
  }))
  const draftMatchesProfile = weightDraft.sourceWeight === profile.weight
  const weightInput = draftMatchesProfile ? weightDraft.input : formatWeightInput(profile.weight)
  const weightMessage = draftMatchesProfile ? weightDraft.message : ''

  function commitWeight() {
    const result = commitWeightInput(weightInput, profile.weight)
    setWeightDraft({ input: result.input, message: result.message, sourceWeight: result.weight })
    if (result.weight !== profile.weight) onChange({ ...profile, weight: result.weight })
  }

  return (
    <section className="panel profile-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Intake</p>
          <h2>Profiel</h2>
        </div>
        <span className="panel-badge">Lokaal opgeslagen</span>
      </div>
      <div className="form-grid">
        <label>
          Lichaamsgewicht
          <div className="input-row">
            <input
              aria-describedby="weight-feedback"
              aria-invalid={Boolean(weightMessage)}
              inputMode="decimal"
              onBlur={commitWeight}
              onChange={(event) => setWeightDraft({ input: event.target.value, message: '', sourceWeight: profile.weight })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur()
              }}
              type="text"
              value={weightInput}
            />
            <span>kg</span>
          </div>
          <span className={weightMessage ? 'field-message error' : 'field-message'} id="weight-feedback" role={weightMessage ? 'alert' : undefined}>
            {weightMessage || '35-180 kg'}
          </span>
        </label>
        <SelectField label="Doel" onChange={(goal) => onChange({ ...profile, goal })} options={['spiermassa', 'vetverlies', 'onderhoud']} value={profile.goal} />
        <TrainingDaysStepper profile={profile} onChange={onChange} />
        <SelectField label="Niveau" onChange={(level) => onChange({ ...profile, level })} options={['beginner', 'gemiddeld', 'gevorderd']} value={profile.level} />
        <SelectField label="Dieetvoorkeur" onChange={(diet) => onChange({ ...profile, diet })} options={['normaal', 'vegetarisch', 'lactosevrij']} value={profile.diet} />
        <SelectField label="Trainingslocatie" onChange={(location) => onChange({ ...profile, location })} options={['gym', 'thuis']} value={profile.location} />
      </div>
    </section>
  )
}

function TrainingDaysStepper({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  function setDays(days: TrainingDays) {
    const currentIsRecommended =
      profile.selectedWeekdays.join(',') === defaultWeekdaysByDays[profile.days].join(',')
    onChange({
      ...profile,
      days,
      selectedWeekdays: currentIsRecommended
        ? defaultWeekdaysByDays[days]
        : reconcileWeekdays(days, profile.selectedWeekdays),
    })
  }

  return (
    <div className="field-control">
      <span className="field-label">Trainingsdagen</span>
      <div className="segmented-control" role="group" aria-label="Trainingsdagen per week">
        {trainingDayOptions.map((days) => (
          <button
            aria-pressed={profile.days === days}
            className={profile.days === days ? 'active' : ''}
            key={days}
            onClick={() => setDays(days)}
            type="button"
          >
            {days}
          </button>
        ))}
      </div>
    </div>
  )
}

function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  return (
    <label>
      {label}
      <select onChange={(event) => onChange(parseSelectValue(event.target.value, options))} value={value}>
        {options.map((option) => (
          <option key={option} value={option}>
            {String(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

function WeekdaySelector({
  profile,
  onChange,
  warnings,
}: {
  profile: Profile
  onChange: (profile: Profile) => void
  warnings: RecoveryWarning[]
}) {
  function toggleWeekday(day: Weekday) {
    const selected = profile.selectedWeekdays.includes(day)
      ? profile.selectedWeekdays.filter((item) => item !== day)
      : [...profile.selectedWeekdays, day]

    if (selected.length > profile.days) {
      selected.splice(0, selected.length - profile.days)
    }

    onChange({ ...profile, selectedWeekdays: reconcileWeekdays(profile.days, selected) })
  }

  return (
    <div className="weekday-selector">
      <div className="calendar-strip" role="group" aria-label="Kies weekdagen">
        {weekdays.map((day) => {
          const selected = profile.selectedWeekdays.includes(day)
          const recommended = defaultWeekdaysByDays[profile.days].includes(day)
          return (
            <button
              aria-pressed={selected}
              className={selected ? 'week-toggle selected' : 'week-toggle'}
              key={day}
              onClick={() => toggleWeekday(day)}
              type="button"
            >
              <strong>{weekdayLabels[day]}</strong>
              <span>{selected ? 'Training' : 'Rust'}</span>
              {recommended && <small>Aanbevolen</small>}
            </button>
          )
        })}
      </div>
      <p className={warnings.length > 0 ? 'weekday-feedback warning' : 'weekday-feedback'}>
        {warnings[0]?.message ?? 'Dagkeuze past bij herstel: dezelfde zware spiergroepen krijgen rust.'}
      </p>
    </div>
  )
}

function WeekOverview({ schedule }: { schedule: TrainingDay[] }) {
  return (
    <div className="week-overview">
      {schedule.map((day) => (
        <div className={day.isRest ? 'week-day rest' : `week-day training intensity-${day.intensity}`} key={day.weekday}>
          <strong>{weekdayLabels[day.weekday]}</strong>
          <span>{day.isRest ? 'Herstelmoment' : day.split}</span>
        </div>
      ))}
    </div>
  )
}

function KpiPanel({
  metrics,
  profile,
  proteinRange,
}: {
  metrics: DashboardMetrics
  profile: Profile
  proteinRange: ReturnType<typeof getProteinRange>
}) {
  return (
    <section className="panel kpi-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Weekstatus</p>
          <h2>Herstel en volume</h2>
        </div>
        <span className={`load-badge load-${metrics.loadLabel.toLowerCase()}`}>{metrics.loadLabel}</span>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card primary">
          <span className="kpi-label">Werksets per week</span>
          <strong>{metrics.weeklySetLow}-{metrics.weeklySetHigh}</strong>
          <span>{metrics.exerciseCount} oefeningen</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Training/rust</span>
          <strong>{metrics.trainingDays}/{metrics.restDays}</strong>
          <span>max {metrics.maxConsecutiveTrainingDays} achter elkaar</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Herstelkwaliteit</span>
          <strong>{metrics.recoveryQuality}</strong>
          <span>{metrics.recoverySummary}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Proteine</span>
          <strong>{metrics.proteinMidpoint} g</strong>
          <span>{proteinRange.low}-{proteinRange.high} g/dag, {goalLabel(profile.goal)}</span>
        </div>
      </div>
    </section>
  )
}

function WarningPanel({ title, warnings }: { title: string; warnings: RecoveryWarning[] }) {
  const items = warnings.length > 0 ? warnings : [{ id: 'ok', tone: 'good' as const, message: 'Geen herstel- of volumewaarschuwingen.' }]

  return (
    <section className="panel risk-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Checks</p>
          <h2>{title}</h2>
        </div>
        <span className="panel-badge">{warnings.length} waarschuwingen</span>
      </div>
      <div className="risk-list">
        {items.map((item) => (
          <article className={`risk-item risk-${item.tone}`} key={item.id}>
            <div>
              <div className="risk-title-row">
                <h3>{item.tone === 'critical' ? 'Risicovol' : item.tone === 'watch' ? 'Let op' : 'Goed'}</h3>
                <span>{item.tone}</span>
              </div>
              <p>{item.message}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function OperationsCharts({
  data,
  metrics,
  proteinRange,
}: {
  data: LoadChartPoint[]
  metrics: DashboardMetrics
  proteinRange: ReturnType<typeof getProteinRange>
}) {
  return (
    <section className="section-block chart-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Grafieken</p>
          <h2>Belasting en voeding</h2>
        </div>
        <p className="section-copy">Werksets volgen de gekozen weekdagen; rustdagen blijven zichtbaar.</p>
      </div>
      <div className="chart-grid">
        <article className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Werksets per dag</h3>
              <p>Weektotaal {metrics.weeklySetLow}-{metrics.weeklySetHigh} sets</p>
            </div>
            <span className="chart-unit">sets</span>
          </div>
          <LoadBarChart data={data} />
          <p className="chart-conclusion">Conclusie: herstelkwaliteit is {metrics.recoveryQuality}.</p>
        </article>
        <article className="chart-card">
          <div className="chart-header">
            <div>
              <h3>Proteinedoel</h3>
              <p>Dagbereik {proteinRange.low}-{proteinRange.high} g</p>
            </div>
            <span className="chart-unit">g/dag</span>
          </div>
          <ProteinRangeChart metrics={metrics} proteinRange={proteinRange} />
          <p className="chart-conclusion">Mik op ongeveer {proteinRange.perMeal} g per maaltijd bij 4 maaltijden.</p>
        </article>
      </div>
    </section>
  )
}

function LoadBarChart({ data }: { data: LoadChartPoint[] }) {
  const maxValue = Math.max(...data.map((point) => point.value), 1)

  return (
    <svg className="bar-chart" viewBox="0 0 360 190" role="img" aria-labelledby="load-chart-title">
      <title id="load-chart-title">Werksets per dag</title>
      <line className="chart-gridline" x1="42" x2="336" y1="142" y2="142" />
      <line className="chart-gridline" x1="42" x2="336" y1="92" y2="92" />
      <line className="chart-gridline" x1="42" x2="336" y1="42" y2="42" />
      {data.map((point, index) => {
        const x = 54 + index * 41
        const barHeight = point.kind === 'rest' ? 8 : Math.max(8, Math.round((point.value / maxValue) * 100))
        const y = 142 - barHeight

        return (
          <g key={point.label}>
            <rect className={point.kind === 'training' ? 'chart-bar training' : 'chart-bar rest'} height={barHeight} rx="4" width="24" x={x} y={y} />
            <text className="bar-value" x={x + 12} y={y - 7}>{point.kind === 'training' ? point.value : 'R'}</text>
            <text className="axis-tick" x={x + 12} y="170">{point.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function ProteinRangeChart({
  metrics,
  proteinRange,
}: {
  metrics: DashboardMetrics
  proteinRange: ReturnType<typeof getProteinRange>
}) {
  const scaleMax = Math.ceil((proteinRange.high * 1.2) / 10) * 10
  const chartStart = 54
  const chartWidth = 256
  const lowX = chartStart + (proteinRange.low / scaleMax) * chartWidth
  const highX = chartStart + (proteinRange.high / scaleMax) * chartWidth
  const midpointX = chartStart + (metrics.proteinMidpoint / scaleMax) * chartWidth

  return (
    <svg className="range-chart" viewBox="0 0 360 190" role="img" aria-labelledby="protein-chart-title">
      <title id="protein-chart-title">Proteinedoel per dag</title>
      <line className="range-track" x1={chartStart} x2={chartStart + chartWidth} y1="94" y2="94" />
      <rect className="range-target" height="18" rx="9" width={highX - lowX} x={lowX} y="85" />
      <line className="range-midpoint" x1={midpointX} x2={midpointX} y1="70" y2="116" />
      <circle className="range-dot" cx={midpointX} cy="94" r="7" />
      <text className="range-label" x={lowX} y="72">{proteinRange.low}g</text>
      <text className="range-label" x={highX} y="72">{proteinRange.high}g</text>
      <text className="range-label midpoint" x={midpointX} y="52">{metrics.proteinMidpoint}g focus</text>
      <text className="range-meal-label" x="180" y="164">{proteinRange.perMeal} g per maaltijd</text>
    </svg>
  )
}

function TechniqueFocusFilter({
  value,
  onChange,
}: {
  value: TechniqueFocus
  onChange: (value: TechniqueFocus) => void
}) {
  return (
    <div className="filter-panel">
      <span className="filter-status">Actief: {focusLabels[value]}</span>
      <div className="filter-bar" role="group" aria-label="Techniekfocus">
        {focusOptions.map((focus) => (
          <button
            aria-pressed={value === focus}
            className={value === focus ? 'active' : ''}
            key={focus}
            onClick={() => onChange(focus)}
            type="button"
          >
            {focusLabels[focus]}
          </button>
        ))}
      </div>
    </div>
  )
}

function TrainingDayCard({
  day,
  focus,
  number,
  onSwap,
}: {
  day: TrainingDay
  focus: TechniqueFocus
  number: number
  onSwap: (exercise: PlannedExercise) => void
}) {
  return (
    <article className={`training-card intensity-${day.intensity}`}>
      <div className="training-header">
        <div>
          <p className="eyebrow">{weekdayLabels[day.weekday]} - {day.intensity}</p>
          <h3>{day.split}</h3>
        </div>
        <div className="day-index">{number}</div>
      </div>
      <div className="muscle-tags">
        {day.focus.map((muscle) => (
          <span key={muscle}>{muscleLabels[muscle]}</span>
        ))}
      </div>
      {day.exercises.length === 0 ? (
        <p className="empty-state">Geen oefeningen binnen techniekfocus {focusLabels[focus]}.</p>
      ) : (
        <div className="exercise-stack">
          {day.exercises.map((exercise, index) => (
            <ExerciseCard exercise={exercise} focus={focus} key={`${exercise.id}-${index}`} onSwap={() => onSwap(exercise)} />
          ))}
        </div>
      )}
    </article>
  )
}

function ExerciseCard({
  exercise,
  focus,
  onSwap,
}: {
  exercise: PlannedExercise
  focus: TechniqueFocus
  onSwap: () => void
}) {
  return (
    <details className="exercise-card">
      <summary>
        <div className="exercise-summary">
          <MuscleMap compact exercise={exercise} title={exercise.name} />
          <div>
            <h4>{exercise.name}</h4>
            <p>{exercise.technique.goal}</p>
            <div className="exercise-meta">
              <span>{exercise.plannedSets} sets</span>
              <span>{exercise.plannedReps} reps</span>
              <span>{exercise.plannedRest} rust</span>
              <span>{exercise.equipment.join(', ')}</span>
            </div>
          </div>
        </div>
      </summary>
      <div className="exercise-detail">
        <div className="target-line">
          <strong>Primair: {exercise.primaryMuscles.map(labelMuscle).join(', ')}</strong>
          <span>Secundair: {exercise.secondaryMuscles.map(labelMuscle).join(', ')}</span>
        </div>
        <TechniqueBlock exercise={exercise} focus={focus} />
        <div className="alternative-row">
          <span>Drukke gym: {exercise.alternatives.busyGym} Thuisvariant: {exercise.alternatives.home}</span>
          <button onClick={onSwap} type="button">Andere oefening</button>
        </div>
      </div>
    </details>
  )
}

function TechniqueBlock({ exercise, focus }: { exercise: PlannedExercise; focus: TechniqueFocus }) {
  return (
    <div className="technique-grid">
      <InfoBlock highlighted={focus !== 'alles'} title="Doel van de oefening" value={exercise.technique.goal} />
      <InfoBlock title="Sets/reps/rust" value={`${exercise.plannedSets} sets, ${exercise.plannedReps} reps, ${exercise.plannedRest} rust.`} />
      <InfoBlock title="Startpositie" value={exercise.technique.start} />
      <InfoBlock title="Houding" value={exercise.technique.posture} />
      <ListBlock title="Uitvoering stap voor stap" values={exercise.technique.steps} />
      <InfoBlock highlighted={focus === 'ademhaling / bracing'} title="Ademhaling/bracing" value={exercise.technique.breathing} />
      <InfoBlock highlighted={focus === 'range of motion'} title="Range of motion" value={exercise.technique.range} />
      <ListBlock title="Veelgemaakte fouten" values={exercise.technique.mistakes} />
      <ListBlock highlighted={focus === 'blessurepreventie'} title="Veiligheidsadvies" values={exercise.technique.injuryTips} />
      <InfoBlock title="Niveau-aanpassing" value={exercise.technique.levelAdjustments.beginner + ' ' + exercise.technique.levelAdjustments.gemiddeld + ' ' + exercise.technique.levelAdjustments.gevorderd} />
    </div>
  )
}

function InfoBlock({ title, value, highlighted = false }: { title: string; value: string; highlighted?: boolean }) {
  return (
    <div className={highlighted ? 'info-block highlighted' : 'info-block'}>
      <strong>{title}</strong>
      <p>{value}</p>
    </div>
  )
}

function ListBlock({ title, values, highlighted = false }: { title: string; values: string[]; highlighted?: boolean }) {
  return (
    <div className={highlighted ? 'info-block highlighted' : 'info-block'}>
      <strong>{title}</strong>
      <ul>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  )
}

function MuscleMap({ exercise, title, compact = false }: { exercise: PlannedExercise; title: string; compact?: boolean }) {
  const primary = exercise.primaryMuscles[0] ?? 'core'
  const highlighted = new Set<Muscle>([...exercise.primaryMuscles, ...exercise.secondaryMuscles])

  return (
    <div className={compact ? 'muscle-map compact' : 'muscle-map'} aria-label={`Spiervisual voor ${title}`}>
      <svg viewBox="0 0 120 220" role="img">
        <title>{title}</title>
        <circle className="body-base" cx="60" cy="22" r="14" />
        <rect className={partClass('schouders', primary, highlighted)} x="30" y="42" width="60" height="18" rx="9" />
        <rect className={partClass('borst', primary, highlighted)} x="39" y="58" width="42" height="28" rx="10" />
        <rect className={partClass('rug', primary, highlighted)} x="42" y="88" width="36" height="38" rx="12" />
        <rect className={partClass('core', primary, highlighted)} x="44" y="112" width="32" height="36" rx="9" />
        <rect className={partClass('biceps', primary, highlighted)} x="18" y="62" width="14" height="42" rx="7" />
        <rect className={partClass('triceps', primary, highlighted)} x="88" y="62" width="14" height="42" rx="7" />
        <rect className={partClass('billen', primary, highlighted)} x="41" y="145" width="38" height="22" rx="9" />
        <rect className={partClass('quadriceps', primary, highlighted)} x="36" y="166" width="18" height="38" rx="8" />
        <rect className={partClass('hamstrings', primary, highlighted)} x="66" y="166" width="18" height="38" rx="8" />
        <rect className={partClass('kuiten', primary, highlighted)} x="38" y="202" width="16" height="16" rx="7" />
        <rect className={partClass('kuiten', primary, highlighted)} x="66" y="202" width="16" height="16" rx="7" />
      </svg>
    </div>
  )
}

function VolumeGrid({ totals }: { totals: DashboardMetrics['muscleSetTotals'] }) {
  const entries = Object.entries(totals).filter(([muscle]) => muscle !== 'full body')

  return (
    <div className="volume-grid">
      {entries.map(([muscle, sets]) => (
        <div className="volume-item" key={muscle}>
          <strong>{labelMuscle(muscle as Muscle)}</strong>
          <span>{sets} sets</span>
        </div>
      ))}
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="recipe-card">
      <div>
        <p className="eyebrow">{recipe.labels.map(dietLabel).join(' / ')}</p>
        <h3>{recipe.name}</h3>
        <p>{recipe.description}</p>
      </div>
      <div className="recipe-metrics">
        <span>{recipe.protein} g proteine</span>
        <span>{recipe.calories} kcal</span>
        <span>{recipe.portion}</span>
      </div>
      <ul>
        {recipe.ingredients.map((ingredient) => (
          <li key={ingredient}>{ingredient}</li>
        ))}
      </ul>
    </article>
  )
}

function partClass(muscle: Muscle, primary: Muscle, highlighted: Set<Muscle>) {
  if (muscle === primary) return 'body-part primary'
  if (highlighted.has(muscle) || (primary === 'benen' && ['quadriceps', 'hamstrings', 'billen', 'kuiten'].includes(muscle))) return 'body-part secondary'
  return 'body-part'
}

function splitSummary(days: TrainingDays) {
  const labels: Record<TrainingDays, string> = {
    1: 'Full body compact',
    2: 'Full body A/B',
    3: 'Full body met spreiding',
    4: 'Upper/lower split',
    5: 'Push/pull/legs met techniekdag',
    6: 'Push/pull/legs x2',
  }

  return labels[days]
}

function labelMuscle(muscle: Muscle) {
  return muscleLabels[muscle]
}

function dietLabel(diet: Diet) {
  return diet
}

function goalLabel(goal: Goal) {
  const labels: Record<Goal, string> = {
    spiermassa: 'Spiermassa',
    vetverlies: 'Vetverlies',
    onderhoud: 'Onderhoud',
  }

  return labels[goal]
}

export default App
