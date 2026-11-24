/**
 * Durable store for the calendar document.
 *
 * One JSON document under the DSH home, written atomically (temp file + rename)
 * after a short debounce so a burst of edits costs one write. The document is
 * validated on read: a damaged file is set aside instead of being overwritten,
 * so a user can always recover their data by hand.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, copyFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { CalendarSettings, CalendarState, Course, Period, Plan, Term } from './types.js'

/** Default bell schedule for a Chinese university day (12 periods). */
export const DEFAULT_PERIODS: Period[] = [
  { index: 1, start: '08:00', end: '08:45' },
  { index: 2, start: '08:55', end: '09:40' },
  { index: 3, start: '10:00', end: '10:45' },
  { index: 4, start: '10:55', end: '11:40' },
  { index: 5, start: '14:00', end: '14:45' },
  { index: 6, start: '14:55', end: '15:40' },
  { index: 7, start: '16:00', end: '16:45' },
  { index: 8, start: '16:55', end: '17:40' },
  { index: 9, start: '19:00', end: '19:45' },
  { index: 10, start: '19:55', end: '20:40' },
  { index: 11, start: '20:50', end: '21:35' },
  { index: 12, start: '21:45', end: '22:30' },
]

/** Settings a fresh install starts with. */
export const DEFAULT_SETTINGS: CalendarSettings = {
  timetableEnabled: false,
  defaultRemindBefore: 10,
  quietHours: { enabled: false, from: '23:00', to: '07:00' },
  soundEnabled: true,
  systemNotification: true,
  weekStart: 1,
  timeFormat: '24h',
}

/** Monday of the ISO week containing `date`, as `YYYY-MM-DD`. */
export function mondayOf(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - (day - 1))
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Two-digit zero padding. */
function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** A term starting on the current week's Monday, 20 weeks long. */
export function defaultTerm(): Term {
  return {
    startDate: mondayOf(new Date()),
    totalWeeks: 20,
    days: [1, 2, 3, 4, 5, 6, 7],
    periods: DEFAULT_PERIODS.map((p) => ({ ...p })),
  }
}

/** A brand-new empty document. */
export function emptyState(): CalendarState {
  return {
    version: 1,
    term: defaultTerm(),
    events: [],
    courses: [],
    plans: [],
    settings: { ...DEFAULT_SETTINGS, quietHours: { ...DEFAULT_SETTINGS.quietHours } },
  }
}

/** Directory holding the document, under the DSH home. */
export function dataDir(env: NodeJS.ProcessEnv = process.env): string {
  const home = env.DSH_HOME && env.DSH_HOME.trim() !== '' ? env.DSH_HOME : join(homedir(), '.dsh')
  return join(home, 'storages', 'dsh-schedule-calendar')
}

/** Absolute path of the document. */
export function dataFile(env: NodeJS.ProcessEnv = process.env): string {
  return join(dataDir(env), 'calendar.json')
}

/**
 * Coerce a parsed document into a valid state, filling anything missing.
 * Unknown fields are dropped so a hand-edited file cannot poison the UI.
 * @param raw - parsed JSON, of unknown shape.
 * @returns a normalized state.
 */
export function normalize(raw: unknown): CalendarState {
  const base = emptyState()
  if (raw === null || typeof raw !== 'object') return base
  const doc = raw as Partial<CalendarState> & Record<string, unknown>
  const term: Term = { ...base.term }
  if (doc.term && typeof doc.term === 'object') {
    const t = doc.term as Partial<Term>
    if (typeof t.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.startDate)) term.startDate = t.startDate
    if (typeof t.totalWeeks === 'number' && t.totalWeeks > 0) term.totalWeeks = Math.min(60, Math.round(t.totalWeeks))
    if (Array.isArray(t.days) && t.days.length > 0) term.days = t.days.filter((d) => typeof d === 'number' && d >= 1 && d <= 7)
    if (Array.isArray(t.periods) && t.periods.length > 0) {
      term.periods = t.periods
        .filter((p) => p && typeof p.index === 'number')
        .map((p) => ({ index: p.index, start: String(p.start ?? '08:00'), end: String(p.end ?? '08:45') }))
    }
  }
  const settings: CalendarSettings = { ...base.settings, ...(typeof doc.settings === 'object' && doc.settings !== null ? doc.settings : {}) }
  settings.quietHours = { ...base.settings.quietHours, ...(settings.quietHours ?? {}) }
  return {
    version: 1,
    term,
    events: Array.isArray(doc.events) ? (doc.events as CalendarState['events']).filter((e) => e && typeof e.id === 'string') : [],
    courses: Array.isArray(doc.courses) ? (doc.courses as Course[]).filter((c) => c && typeof c.id === 'string') : [],
    plans: Array.isArray(doc.plans) ? (doc.plans as Plan[]).filter((p) => p && typeof p.id === 'string') : [],
    settings,
  }
}

/** Handle over the document, shared by every route of one plugin instance. */
export interface Store {
  /** Current document; mutate it and call {@link Store.save}. */
  readonly state: CalendarState
  /** Apply a mutation and schedule a durable write. */
  update<T>(mutator: (state: CalendarState) => T): T
  /** Flush a pending write immediately. */
  flush(): void
  /** Absolute path of the document, for diagnostics and export. */
  readonly path: string
}

/**
 * Open (or create) the document.
 * @param env - environment used to resolve the DSH home.
 * @param onError - sink for write failures; the plugin logs and keeps serving.
 * @returns the store handle.
 */
export function openStore(env: NodeJS.ProcessEnv = process.env, onError?: (error: unknown) => void): Store {
  const file = dataFile(env)
  const dir = dirname(file)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  let state = emptyState()
  if (existsSync(file)) {
    try {
      state = normalize(JSON.parse(readFileSync(file, 'utf8')))
    } catch (error) {
      // Keep the damaged file for the user; start clean instead of crashing.
      const backup = `${file}.broken-${Date.now()}`
      try {
        copyFileSync(file, backup)
      } catch {
        /* best effort */
      }
      onError?.(error)
    }
  }

  let timer: NodeJS.Timeout | undefined
  let dirty = false

  const flush = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    if (!dirty) return
    dirty = false
    const tmp = `${file}.tmp-${process.pid}`
    try {
      mkdirSync(dir, { recursive: true })
      writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
      renameSync(tmp, file)
    } catch (error) {
      dirty = true
      onError?.(error)
    }
  }

  const save = (): void => {
    dirty = true
    if (timer !== undefined) return
    timer = setTimeout(() => {
      timer = undefined
      flush()
    }, 150)
    if (typeof timer.unref === 'function') timer.unref()
  }

  return {
    get state() {
      return state
    },
    update<T>(mutator: (draft: CalendarState) => T): T {
      const result = mutator(state)
      save()
      return result
    },
    flush,
    path: file,
  }
}
