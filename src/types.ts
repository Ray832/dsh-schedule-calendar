/**
 * Shared data model between the host half and the browser half.
 *
 * Everything here is plain JSON so the host can hand it straight to the client
 * and the client can hand it straight back.
 */

/** How a calendar event repeats. `none` is a single occurrence. */
export type RepeatKind = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'biweekly'

/** Recurrence rule attached to an event. */
export interface Repeat {
  kind: RepeatKind
  /** Weekdays for `weekly`/`biweekly`, ISO 1=Monday … 7=Sunday. */
  weekdays?: number[]
  /** Optional last day the rule may produce an occurrence, `YYYY-MM-DD`. */
  until?: string
}

/** Which reminder tier an event carries. */
export type ReminderKind = 'none' | 'short' | 'mid' | 'long'

/**
 * Reminder tier attached to an event.
 *
 * Three tiers cover the three horizons a user actually plans on:
 * `short` for the same day (hours + minutes), `mid` for a week or two
 * (`days`), and `long` for something weeks away, where the point is to be
 * nudged repeatedly (`startDays` then every `everyDays`).
 * The stored lead times are derived from this by `reminderLeads`.
 */
export interface ReminderPlan {
  kind: ReminderKind
  /** short tier: whole hours before the start, 0–24. */
  hours?: number
  /** short tier: extra minutes on top of `hours`, 0–60. */
  minutes?: number
  /** mid tier: days before the start, 1–15. */
  days?: number
  /** long tier: first nudge this many days before, 1–15. */
  startDays?: number
  /** long tier: repeat interval in days, one of 1, 3, 5, 7. */
  everyDays?: number
}

/** One calendar entry. Times are local wall-clock `YYYY-MM-DDTHH:mm` strings. */
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  location?: string
  note?: string
  /** Palette key, e.g. `blue`, `green`, `amber`, `rose`, `violet`, `slate`. */
  color?: string
  /** The reminder tier the user picked. */
  reminder?: ReminderPlan
  /**
   * Lead times in minutes, ascending, derived from `reminder` on every save.
   * Kept for ICS export and for documents written before tiers existed; never
   * edit it by hand.
   */
  remindBefore?: number[]
  repeat?: Repeat
  done?: boolean
  /** Where the entry came from. */
  source: 'manual' | 'ai' | 'course' | 'import'
  createdAt: number
  updatedAt: number
}

/** Week parity a course runs on. */
export type Parity = 'all' | 'odd' | 'even'

/** One weekly class in the timetable. */
export interface Course {
  id: string
  name: string
  teacher?: string
  location?: string
  /** ISO weekday of the class, 1=Monday … 7=Sunday. */
  weekday: number
  /** 1-based period indexes the class occupies, ascending. */
  periods: number[]
  /** First and last teaching week, inclusive. */
  weeks: { from: number; to: number }
  parity: Parity
  color?: string
  note?: string
  createdAt: number
  updatedAt: number
}

/** One period of the day: which bell it starts and ends with. */
export interface Period {
  index: number
  start: string
  end: string
}

/** Term configuration driving the timetable grid. */
export interface Term {
  /** Monday of week 1, `YYYY-MM-DD`. */
  startDate: string
  totalWeeks: number
  /** ISO weekdays shown in the grid, ascending. Defaults to 1..7. */
  days: number[]
  periods: Period[]
}

/** A milestone inside a long-term plan. */
export interface Milestone {
  id: string
  title: string
  due?: string
  done: boolean
  note?: string
}

/** A long-term plan: a goal broken into milestones. */
export interface Plan {
  id: string
  title: string
  goal?: string
  due?: string
  priority: 'low' | 'normal' | 'high'
  milestones: Milestone[]
  status: 'active' | 'done' | 'paused'
  createdAt: number
  updatedAt: number
}

/** User-facing plugin settings persisted with the data. */
export interface CalendarSettings {
  /** Whether the timetable page and its data are enabled at all. */
  timetableEnabled: boolean
  /** Reminder tier applied to a new event. */
  defaultReminder: ReminderPlan
  /**
   * Legacy single default lead in minutes. Derived from `defaultReminder` on
   * every settings write so an older build still finds a number.
   */
  defaultRemindBefore: number
  /** Minutes kept quiet: no popup or sound between these, 24h clock. */
  quietHours: { enabled: boolean; from: string; to: string }
  /** Play a sound with a due reminder. */
  soundEnabled: boolean
  /** Also raise an operating-system notification when one is available. */
  systemNotification: boolean
  /** Week starts on Monday unless switched. */
  weekStart: 1 | 7
  /** First day of the week shown in the month grid. */
  timeFormat: '24h' | '12h'
}

/** Whole persisted document. */
export interface CalendarState {
  version: 1
  term: Term
  events: CalendarEvent[]
  courses: Course[]
  plans: Plan[]
  settings: CalendarSettings
}

/** A due reminder pushed from the host to an open page. */
export interface DueNotice {
  eventId: string
  title: string
  start: string
  location?: string
  /** How many minutes before the start this notice fires. */
  leadMinutes: number
}
