/**
 * Host half of dsh-schedule-calendar.
 *
 * Owns the durable document and serves the browser half over one JSON route
 * family. No framework imports: the plugin is a plain cordis function plugin,
 * so it installs into any profile without a dependency tree.
 */

import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { buildToolDefinitions, parseCourses, parseEvents, registerTools, ParseError, type ParsedEvent } from './ai.js'
import { fromIcs, toIcs } from './ics.js'
import { ReminderEngine, type Notice } from './notify.js'
import { expandAll, parseStamp } from './repeat.js'
import { dataDir, normalize, openStore, type Store } from './store.js'
import type { CalendarEvent, CalendarSettings, CalendarState, Course, Milestone, Plan, Repeat, Term } from './types.js'

/** Loader row id used by cordis.patch.yml. */
export const name = 'dsh-schedule-calendar'

/** Reminder engine, exported so tests can drive it with a fake clock. */
export { ReminderEngine } from './notify.js'

/** Recurrence helpers, exported so tests can pin the expansion contract. */
export { expandAll, expandEvent, parseStamp, stamp } from './repeat.js'

/** Services this plugin needs before it can mount. */
export const inject = ['webServer'] as const

/** Route prefix owned by this plugin. */
const ROUTE = '/api/dsh-calendar'

/** Minimal shape of the cords context members used here. */
interface PluginContext {
  webServer: {
    register(route: {
      kind: 'exact' | 'prefix'
      path: string
      handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
    }): () => void
  }
  effect(callback: () => (() => void) | void, label?: string): void
  get(key: string): unknown
  logger?: { warn(...args: unknown[]): void; info?(...args: unknown[]): void }
}

/** Reply helpers. */
function send(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(body)
}

/** Read a JSON request body, capped so a stray upload cannot exhaust memory. */
async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buf = chunk as Buffer
    size += buf.length
    if (size > 4 * 1024 * 1024) throw new Error('payload too large')
    chunks.push(buf)
  }
  if (size === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

/** One rejected call, carrying the code the browser half renders. */
class InputError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

/** `YYYY-MM-DDTHH:mm` shape check. */
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

/** Reject anything that is not a stored local timestamp. */
function requireStamp(value: unknown, field: string): string {
  if (typeof value !== 'string' || !STAMP.test(value)) throw new InputError('invalid-time', `${field} must look like 2026-11-04T15:30`)
  return value
}

/** Normalize a repeat rule, dropping fields the kind does not use. */
function cleanRepeat(input: unknown): Repeat {
  const raw = (input ?? {}) as Partial<Repeat>
  const kind = raw.kind
  if (kind === undefined || kind === 'none') return { kind: 'none' }
  if (!['daily', 'weekly', 'monthly', 'weekdays', 'biweekly'].includes(String(kind))) {
    throw new InputError('invalid-repeat', `unknown repeat kind: ${String(kind)}`)
  }
  const repeat: Repeat = { kind: kind as Repeat['kind'] }
  if (Array.isArray(raw.weekdays)) {
    const days = [...new Set(raw.weekdays.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b)
    if (days.length > 0) repeat.weekdays = days
  }
  if (typeof raw.until === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.until)) repeat.until = raw.until
  return repeat
}

/**
 * Validate and normalize one event payload.
 * @param input - untrusted request body.
 * @param existing - the stored event when updating.
 * @returns a complete event ready to store.
 */
function cleanEvent(input: unknown, existing?: CalendarEvent): CalendarEvent {
  const raw = (input ?? {}) as Partial<CalendarEvent>
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (title === '') throw new InputError('invalid-title', 'an event needs a title')
  if (title.length > 200) throw new InputError('invalid-title', 'the title is too long')
  const start = requireStamp(raw.start, 'start')
  const end = requireStamp(raw.end ?? raw.start, 'end')
  if (end < start) throw new InputError('invalid-time', 'the end must not be before the start')
  const now = Date.now()
  const remindBefore = Array.isArray(raw.remindBefore)
    ? [...new Set(raw.remindBefore.filter((m) => Number.isFinite(m) && m >= 0 && m <= 60 * 24 * 30))].sort((a, b) => a - b)
    : []
  return {
    id: existing?.id ?? (typeof raw.id === 'string' && raw.id !== '' ? raw.id : randomUUID()),
    title,
    start,
    end,
    allDay: raw.allDay === true,
    location: typeof raw.location === 'string' ? raw.location.slice(0, 200) : undefined,
    note: typeof raw.note === 'string' ? raw.note.slice(0, 2000) : undefined,
    color: typeof raw.color === 'string' ? raw.color.slice(0, 24) : undefined,
    remindBefore,
    repeat: cleanRepeat(raw.repeat),
    done: raw.done === true,
    source: existing?.source ?? (raw.source === 'ai' || raw.source === 'import' || raw.source === 'course' ? raw.source : 'manual'),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

/** Validate and normalize one plan payload. */
function cleanPlan(input: unknown, existing: Plan[]): Plan {
  const raw = (input ?? {}) as Partial<Plan>
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (title === '') throw new InputError('invalid-title', 'a plan needs a title')
  const id = typeof raw.id === 'string' && raw.id !== '' ? raw.id : randomUUID()
  const previous = existing.find((plan) => plan.id === id)
  const now = Date.now()
  const milestones = (Array.isArray(raw.milestones) ? raw.milestones : []).map((item) => {
    const milestone = item as Partial<Milestone>
    const milestoneTitle = typeof milestone.title === 'string' ? milestone.title.trim() : ''
    if (milestoneTitle === '') throw new InputError('invalid-milestone', 'a milestone needs a title')
    return {
      id: typeof milestone.id === 'string' && milestone.id !== '' ? milestone.id : randomUUID(),
      title: milestoneTitle.slice(0, 200),
      due: typeof milestone.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(milestone.due) ? milestone.due : undefined,
      done: milestone.done === true,
      note: typeof milestone.note === 'string' ? milestone.note.slice(0, 500) : undefined,
    }
  })
  const allDone = milestones.length > 0 && milestones.every((milestone) => milestone.done)
  return {
    id,
    title: title.slice(0, 200),
    goal: typeof raw.goal === 'string' ? raw.goal.slice(0, 2000) : undefined,
    due: typeof raw.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.due) ? raw.due : undefined,
    priority: raw.priority === 'low' || raw.priority === 'high' ? raw.priority : 'normal',
    milestones,
    status: allDone ? 'done' : raw.status === 'paused' ? 'paused' : 'active',
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  }
}

/** Methods the browser half may call, keyed by the trailing path segment. */
interface Router {
  [method: string]: (body: any) => unknown | Promise<unknown>
}

/** Validate and normalize one course payload. */
function cleanCourse(input: unknown, existing?: Course): Course {
  const raw = (input ?? {}) as Partial<Course>
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (name === '') throw new InputError('invalid-name', 'a course needs a name')
  const weekday = Number(raw.weekday)
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) throw new InputError('invalid-weekday', 'weekday must be 1 to 7')
  const periods = Array.isArray(raw.periods)
    ? [...new Set(raw.periods.map((p) => Number(p)).filter((p) => Number.isInteger(p) && p >= 1 && p <= 24))].sort((a, b) => a - b)
    : []
  if (periods.length === 0) throw new InputError('invalid-periods', 'a course needs at least one period')
  const weeks = raw.weeks ?? { from: 1, to: 20 }
  const from = Number(weeks.from)
  const to = Number(weeks.to)
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
    throw new InputError('invalid-weeks', 'the week range must be positive and ordered')
  }
  const parityRaw = raw.parity
  const parity = parityRaw === 'odd' || parityRaw === 'even' ? parityRaw : 'all'
  const now = Date.now()
  return {
    id: existing?.id ?? (typeof raw.id === 'string' && raw.id !== '' ? raw.id : randomUUID()),
    name,
    teacher: typeof raw.teacher === 'string' && raw.teacher.trim() !== '' ? raw.teacher.trim().slice(0, 100) : undefined,
    location: typeof raw.location === 'string' && raw.location.trim() !== '' ? raw.location.trim().slice(0, 100) : undefined,
    weekday,
    periods,
    weeks: { from, to: Math.min(60, to) },
    parity,
    color: typeof raw.color === 'string' ? raw.color.slice(0, 24) : undefined,
    note: typeof raw.note === 'string' ? raw.note.slice(0, 500) : undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

/**
 * Build the route table over one store.
 * @param store - the opened document.
 * @param engine - the reminder engine.
 * @param context - plugin context, for lazily resolving host services.
 * @returns callable methods.
 */
function createRouter(store: Store, engine: ReminderEngine, context: PluginContext): Router {
  /** Find an event or fail with a code the UI can explain. */
  const findEvent = (id: unknown): CalendarEvent => {
    if (typeof id !== 'string') throw new InputError('invalid-id', 'missing event id')
    const found = store.state.events.find((event) => event.id === id)
    if (found === undefined) throw new InputError('not-found', 'that event no longer exists')
    return found
  }

  return {
    /** Whole document, for the first paint and after a reload. */
    'state.get': (): CalendarState => store.state,

    /** Liveness probe used by the browser half's error state. */
    ping: () => ({ ok: true, path: store.path }),

    /** Create or replace one event; answers the whole document. */
    'event.save': (body: { event?: unknown }): CalendarState =>
      store.update((state) => {
        const raw = (body?.event ?? {}) as Partial<CalendarEvent>
        const existing = typeof raw.id === 'string' ? state.events.find((event) => event.id === raw.id) : undefined
        const event = cleanEvent(raw, existing)
        const index = state.events.findIndex((candidate) => candidate.id === event.id)
        if (index >= 0) state.events[index] = event
        else state.events.push(event)
        return state
      }),

    /** Remove one event. */
    'event.delete': (body: { id?: unknown }): CalendarState =>
      store.update((state) => {
        const event = findEvent(body?.id)
        state.events = state.events.filter((candidate) => candidate.id !== event.id)
        return state
      }),

    /** Tick or untick one event. */
    'event.setDone': (body: { id?: unknown; done?: unknown }): CalendarState =>
      store.update((state) => {
        const event = findEvent(body?.id)
        event.done = body?.done === true
        event.updatedAt = Date.now()
        return state
      }),

    /** Merge a settings patch. */
    'settings.update': (body: { patch?: unknown }): CalendarState =>
      store.update((state) => {
        const patch = (body?.patch ?? {}) as Partial<CalendarSettings>
        const next: CalendarSettings = { ...state.settings, ...patch }
        next.quietHours = { ...state.settings.quietHours, ...(patch.quietHours ?? {}) }
        state.settings = next
        return state
      }),

    /** Replace the term configuration. */
    'term.update': (body: { term?: unknown }): CalendarState =>      store.update((state) => {
        const term = (body?.term ?? {}) as Partial<Term>
        if (typeof term.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(term.startDate)) state.term.startDate = term.startDate
        if (Number.isInteger(term.totalWeeks) && (term.totalWeeks as number) > 0) {
          state.term.totalWeeks = Math.min(60, term.totalWeeks as number)
        }
        if (Array.isArray(term.days) && term.days.length > 0) {
          state.term.days = term.days.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7)
        }
        if (Array.isArray(term.periods) && term.periods.length > 0) {
          state.term.periods = term.periods
            .filter((p) => p && Number.isInteger(p.index))
            .map((p) => ({ index: p.index, start: String(p.start ?? '08:00'), end: String(p.end ?? '08:45') }))
            .sort((a, b) => a.index - b.index)
        }
        return state
      }),

    /** Drain the reminders that are due; the page renders them and calls back. */
    'notify.pending': (): Notice[] => engine.pending(),

    /** Snooze one reminder. */
    'notify.snooze': (body: { id?: unknown; minutes?: unknown }): { ok: boolean } => {
      if (typeof body?.id !== 'string') throw new InputError('invalid-id', 'missing notice id')
      const minutes = Number(body?.minutes ?? 5)
      return { ok: engine.snooze(body.id, Number.isFinite(minutes) ? minutes : 5) !== undefined }
    },

    /** Dismiss one reminder for good. */
    'notify.ack': (body: { id?: unknown }): { ok: boolean } => {
      if (typeof body?.id !== 'string') throw new InputError('invalid-id', 'missing notice id')
      engine.ack(body.id)
      return { ok: true }
    },

    /** Tick an event straight from its reminder, without opening the editor. */
    'notify.complete': (body: { eventId?: unknown }): CalendarState =>
      store.update((state) => {
        const event = findEvent(body?.eventId)
        event.done = true
        event.updatedAt = Date.now()
        return state
      }),

    /** Create or replace one timetable course. */
    'course.save': (body: { course?: unknown }): CalendarState =>
      store.update((state) => {
        const raw = (body?.course ?? {}) as Partial<Course>
        const existing = typeof raw.id === 'string' ? state.courses.find((course) => course.id === raw.id) : undefined
        const course = cleanCourse(raw, existing)
        const index = state.courses.findIndex((candidate) => candidate.id === course.id)
        if (index >= 0) state.courses[index] = course
        else state.courses.push(course)
        return state
      }),

    /** Remove one course. */
    'course.delete': (body: { id?: unknown }): CalendarState =>
      store.update((state) => {
        const id = typeof body?.id === 'string' ? body.id : ''
        if (id === '') throw new InputError('invalid-id', 'missing course id')
        state.courses = state.courses.filter((course) => course.id !== id)
        return state
      }),

    /** Import many courses at once; `replace` drops the existing table first. */
    'course.import': (body: { courses?: unknown; replace?: unknown }): CalendarState =>
      store.update((state) => {
        const list = Array.isArray(body?.courses) ? body.courses : []
        const cleaned = list.map((item) => cleanCourse(item))
        state.courses = body?.replace === true ? cleaned : [...state.courses, ...cleaned]
        return state
      }),

    /** Create or replace one long-term plan. */
    'plan.save': (body: { plan?: unknown }): CalendarState =>
      store.update((state) => {
        const plan = cleanPlan(body?.plan, state.plans)
        const index = state.plans.findIndex((candidate) => candidate.id === plan.id)
        if (index >= 0) state.plans[index] = plan
        else state.plans.push(plan)
        return state
      }),

    /** Remove one plan. */
    'plan.delete': (body: { id?: unknown }): CalendarState =>
      store.update((state) => {
        const id = typeof body?.id === 'string' ? body.id : ''
        if (id === '') throw new InputError('invalid-id', 'missing plan id')
        state.plans = state.plans.filter((plan) => plan.id !== id)
        return state
      }),

    /** Tick or untick one milestone. */
    'plan.milestone': (body: { planId?: unknown; milestoneId?: unknown; done?: unknown }): CalendarState =>
      store.update((state) => {
        const plan = state.plans.find((candidate) => candidate.id === body?.planId)
        if (plan === undefined) throw new InputError('not-found', 'that plan no longer exists')
        const milestone = plan.milestones.find((candidate) => candidate.id === body?.milestoneId)
        if (milestone === undefined) throw new InputError('not-found', 'that milestone no longer exists')
        milestone.done = body?.done === true
        plan.updatedAt = Date.now()
        if (plan.milestones.length > 0 && plan.milestones.every((item) => item.done)) plan.status = 'done'
        else if (plan.status === 'done') plan.status = 'active'
        return state
      }),

    /** Create many events at once (quick add confirmation, ICS import). */
    'event.import': (body: { events?: unknown }): CalendarState =>
      store.update((state) => {
        const list = Array.isArray(body?.events) ? body.events : []
        for (const item of list) state.events.push(cleanEvent(item))
        return state
      }),

    /** One sentence in, candidate events out; nothing is stored yet. */
    'parse.events': async (body: { text?: unknown }): Promise<{ events: CalendarEvent[]; model: string }> => {
      const text = String(body?.text ?? '').trim()
      if (text === '') throw new InputError('empty-text', 'write a sentence first')
      const llm = requireLlm(context)
      const route = modelRoute(context, llm)
      const events = await parseEvents(llm, route, text)
      return {
        events: events.map((row) => cleanEvent({ ...row, source: 'ai' })),
        model: `${route.provider}/${route.model}`,
      }
    },

    /** A pasted timetable in, candidate courses out; nothing is stored yet. */
    'parse.timetable': async (body: { text?: unknown }): Promise<{ courses: Course[]; model: string }> => {
      const text = String(body?.text ?? '').trim()
      if (text === '') throw new InputError('empty-text', 'paste a timetable first')
      const llm = requireLlm(context)
      const route = modelRoute(context, llm)
      const rows = await parseCourses(llm, route, text)
      return {
        courses: rows.map((row) => cleanCourse(row)),
        model: `${route.provider}/${route.model}`,
      }
    },

    /** The whole calendar as an iCalendar document. */
    'io.export.ics': (): { text: string; count: number } => ({
      text: toIcs(store.state.events),
      count: store.state.events.length,
    }),

    /** Merge events from an iCalendar document. */
    'io.import.ics': (body: { text?: unknown }): { state: CalendarState; added: number; skipped: number } => {
      const text = String(body?.text ?? '')
      if (text.trim() === '') throw new InputError('empty-text', 'the file is empty')
      const parsed = fromIcs(text)
      const state = store.update((current) => {
        for (const draft of parsed.events) current.events.push(cleanEvent(draft))
        return current
      })
      return { state, added: parsed.events.length, skipped: parsed.skipped }
    },

    /** A complete JSON backup of the document. */
    'io.backup': (): { json: string; path: string } => ({
      json: JSON.stringify(store.state, null, 2),
      path: store.path,
    }),

    /** Replace the whole document from a JSON backup. */
    'io.restore': (body: { json?: unknown }): { state: CalendarState } => {
      const raw = String(body?.json ?? '')
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        throw new InputError('invalid-json', 'that file is not valid JSON')
      }
      const next = normalize(parsed)
      const state = store.update((current) => {
        current.term = next.term
        current.events = next.events
        current.courses = next.courses
        current.plans = next.plans
        current.settings = next.settings
        return current
      })
      return { state }
    },
  }
}

/** The model service, or a friendly refusal. */
function requireLlm(context: PluginContext): {
  stream(options: Record<string, unknown>): AsyncIterable<{ type: string; text?: string }>
  listProviders?(): Array<{ name: string; models?: Array<{ id: string }> }>
} {
  const llm = context.get('llm') as
    | { stream(options: Record<string, unknown>): AsyncIterable<{ type: string; text?: string }>; listProviders?(): Array<{ name: string; models?: Array<{ id: string }> }> }
    | undefined
  if (llm === undefined || typeof llm.stream !== 'function') {
    throw new InputError('no-model', 'this DSH composition exposes no model service')
  }
  return llm
}

/** Resolve the provider/model to call, preferring the user's own default. */
function modelRoute(
  context: PluginContext,
  llm: { listProviders?(): Array<{ name: string; models?: Array<{ id: string }> }> },
): { provider: string; model: string } {
  const defaults = context.get('agentDefaultModel') as { currentSelection?(): { provider?: string; model?: string } | undefined } | undefined
  const selection = defaults?.currentSelection?.()
  if (selection?.provider !== undefined && selection?.model !== undefined) {
    return { provider: selection.provider, model: selection.model }
  }
  for (const provider of llm.listProviders?.() ?? []) {
    const first = provider.models?.[0]
    if (first !== undefined) return { provider: provider.name, model: first.id }
  }
  throw new InputError('no-model', 'no model is configured in this DSH profile')
}

/** Events inside a local date range, for the model-facing list tool. */
function eventsInRange(state: CalendarState, from: string, to: string): Array<{ title: string; start: string; end: string; location?: string }> {
  const start = parseStamp(`${from}T00:00`)
  const end = parseStamp(`${to}T23:59`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
  return expandAll(state.events, start, end).map((occurrence) => ({
    title: occurrence.event.title,
    start: `${occurrence.start.getFullYear()}-${String(occurrence.start.getMonth() + 1).padStart(2, '0')}-${String(occurrence.start.getDate()).padStart(2, '0')}T${String(occurrence.start.getHours()).padStart(2, '0')}:${String(occurrence.start.getMinutes()).padStart(2, '0')}`,
    end: `${occurrence.end.getFullYear()}-${String(occurrence.end.getMonth() + 1).padStart(2, '0')}-${String(occurrence.end.getDate()).padStart(2, '0')}T${String(occurrence.end.getHours()).padStart(2, '0')}:${String(occurrence.end.getMinutes()).padStart(2, '0')}`,
    ...(occurrence.event.location !== undefined ? { location: occurrence.event.location } : {}),
  }))
}

/**
 * Mount the plugin.
 * @param ctx - cords context.
 */
export function apply(ctx: PluginContext): void {
  const store = openStore(process.env, (error) => {
    ctx.logger?.warn('[dsh-schedule-calendar] storage error:', error)
  })
  const engine = new ReminderEngine({
    state: () => store.state,
    logPath: join(dataDir(process.env), 'notifications.json'),
    onError: (error) => ctx.logger?.warn('[dsh-schedule-calendar] reminder log error:', error),
  })
  const router = createRouter(store, engine, ctx)

  registerTools(ctx, (tools) => {
    const registry = tools as { register(definition: unknown): void }
    for (const definition of buildToolDefinitions({
      add: (events: ParsedEvent[]) =>
        store.update((state) => {
          const created: CalendarEvent[] = []
          for (const row of events) {
            const event = cleanEvent({ ...row, source: 'ai' })
            state.events.push(event)
            created.push(event)
          }
          return created.map((event) => ({ id: event.id, title: event.title, start: event.start, end: event.end }))
        }),
      list: (from: string, to: string) => eventsInRange(store.state, from, to),
    })) {
      try {
        registry.register(definition)
      } catch (error) {
        ctx.logger?.warn('[dsh-schedule-calendar] tool registration skipped:', error)
      }
    }
  })

  ctx.effect(() => engine.start(), 'dsh-schedule-calendar: reminder scan')

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'prefix',
        path: ROUTE,
        handler: async (req, res) => {
          const connection = ctx.get('connection') as { requestRejection?: (req: IncomingMessage) => unknown } | undefined
          if (connection?.requestRejection && connection.requestRejection(req) !== undefined) {
            send(res, 403, { ok: false, error: { code: 'forbidden', message: 'request rejected' } })
            return
          }
          const url = new URL(req.url ?? '/', 'http://dsh.internal')
          const method = url.pathname.slice(ROUTE.length).replace(/^\/+/, '')
          const handler = router[method]
          if (handler === undefined) {
            send(res, 404, { ok: false, error: { code: 'unknown-method', message: method } })
            return
          }
          if (req.method !== 'POST' && req.method !== 'GET') {
            send(res, 405, { ok: false, error: { code: 'method-not-allowed' } })
            return
          }
          try {
            const body = req.method === 'POST' ? await readJson(req) : Object.fromEntries(url.searchParams)
            const value = await handler(body)
            send(res, 200, { ok: true, value })
          } catch (error) {
            const code =
              error instanceof InputError ? error.code : error instanceof ParseError ? error.code : 'internal'
            const message = error instanceof Error ? error.message : String(error)
            send(res, 200, { ok: false, error: { code, message } })
          }
        },
      }),
    'dsh-schedule-calendar: route family',
  )

  ctx.effect(() => () => store.flush(), 'dsh-schedule-calendar: flush on dispose')
}
