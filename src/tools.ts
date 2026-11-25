/**
 * The four model-facing tools.
 *
 * | tool              | gated | why it exists                                   |
 * |-------------------|-------|-------------------------------------------------|
 * | `calendar_add`    | yes   | write new events                                |
 * | `calendar_list`   | no    | read the calendar, including what is done       |
 * | `calendar_update` | yes   | change anything about one event, done included  |
 * | `calendar_delete` | yes   | remove events for good                          |
 *
 * `calendar_update` is the single way to change stored event information —
 * time, title, place, note, all-day flag, reminder tier and completion state.
 * Completion used to have its own tool; merging it here keeps one patch path and
 * one approval prompt instead of two tools that write the same record.
 *
 * `calendar_add` stays create-only: it requires a title and a start, so
 * overloading it with "patch by id" would push the model towards re-sending
 * whole events (and duplicating them).
 *
 * Definitions are compiled from the author DSL into the raw schema subset the
 * registry accepts; see `tool-schema.ts` for why the conversion is local.
 */

import { normalizeEventRow, type ParsedEvent } from './ai.js'
import { cleanReminderPlan, describePlan } from './remind.js'
import { outputToSchema, parametersToSchema, validateRawSchema, type AuthorSchema } from './tool-schema.js'
import type { ReminderPlan } from './types.js'

/** Name of the writing tool; the approval gate keys off it. */
export const ADD_TOOL = 'calendar_add'

/** Name of the read-only tool. */
export const LIST_TOOL = 'calendar_list'

/** Name of the field-patch tool; it also carries completion state. */
export const UPDATE_TOOL = 'calendar_update'

/** Name of the destructive tool. */
export const DELETE_TOOL = 'calendar_delete'

/** Every tool this plugin registers. */
export const TOOL_NAMES = [ADD_TOOL, LIST_TOOL, UPDATE_TOOL, DELETE_TOOL] as const

/** One event as the tools return it. */
export interface ToolEvent {
  id: string
  title: string
  start: string
  end: string
}

/** One listed event, with the state the model needs to decide what to do next. */
export interface ToolListed extends ToolEvent {
  done: boolean
  location?: string
  reminder?: string
}

/** A partial change to one stored event, addressed by id. */
export interface ToolPatch {
  id: string
  title?: string
  start?: string
  end?: string
  allDay?: boolean
  location?: string
  note?: string
  reminder?: ReminderPlan
  /** `true` marks the event done, `false` reopens it. */
  done?: boolean
}

/** What the tools do to the calendar. */
export interface ToolHandlers {
  add(events: ParsedEvent[]): ToolEvent[]
  list(from: string, to: string): ToolListed[]
  update(patches: ToolPatch[]): Array<ToolEvent & { done: boolean }>
  remove(ids: string[]): ToolEvent[]
}

/** Reminder tier accepted by `calendar_add` and `calendar_update`. */
const REMINDER_PARAMETERS: AuthorSchema = {
  type: 'object',
  additionalProperties: false,
  description:
    'Reminder tier. Omit to leave the reminder alone. short covers today (hours 0-24 plus minutes 0-60, fires once); mid covers up to 15 days ahead (days 1-15, fires once); long is for things weeks away and fires from startDays out, then every everyDays until the day itself.',
  properties: {
    kind: {
      type: 'string',
      required: true,
      enum: ['none', 'short', 'mid', 'long'],
      description: '`none` removes the reminder.',
    },
    hours: { type: 'integer', description: 'short tier: whole hours before the start, 0-24.' },
    minutes: { type: 'integer', description: 'short tier: extra minutes on top of `hours`, 0-60. "提前 10 分钟" is hours 0, minutes 10.' },
    days: { type: 'integer', description: 'mid tier: days before the start, 1-15.' },
    startDays: { type: 'integer', description: 'long tier: first nudge this many days before the start, 1-15.' },
    everyDays: { type: 'integer', enum: [1, 3, 5, 7], description: 'long tier: repeat interval in days.' },
  },
}

/** Event fields accepted by `calendar_add`. */
const EVENT_PARAMETERS: Record<string, AuthorSchema> = {
  title: { type: 'string', required: true, description: 'Short event title, without a leading command such as "remind me to".' },
  start: { type: 'string', required: true, description: 'Local start, exactly "YYYY-MM-DDTHH:mm".' },
  end: { type: 'string', description: 'Local end, "YYYY-MM-DDTHH:mm". Defaults to one hour after the start.' },
  allDay: { type: 'boolean', description: 'True for an all-day event.' },
  location: { type: 'string', description: 'Place, optional.' },
  note: { type: 'string', description: 'Free-form note, optional.' },
  reminder: REMINDER_PARAMETERS,
  repeat: {
    type: 'object',
    additionalProperties: false,
    description: 'Recurrence. Omit for a single event.',
    properties: {
      kind: {
        type: 'string',
        required: true,
        enum: ['none', 'daily', 'weekly', 'monthly', 'weekdays', 'biweekly'],
        description: '`weekdays` is Monday through Friday.',
      },
      weekdays: {
        type: 'array',
        items: { type: 'integer', description: 'ISO weekday, 1=Monday … 7=Sunday.' },
        description: 'Required for `weekly` and `biweekly`.',
      },
      until: { type: 'string', description: 'Last day the repeat may produce, "YYYY-MM-DD".' },
    },
  },
}

/** Event fields accepted by `calendar_update`; all optional but the id. */
const PATCH_PARAMETERS: Record<string, AuthorSchema> = {
  id: { type: 'string', required: true, description: 'The event id from calendar_list.' },
  title: { type: 'string', description: 'New title.' },
  start: { type: 'string', description: 'New local start, "YYYY-MM-DDTHH:mm". Re-send `end` when the event keeps its length.' },
  end: { type: 'string', description: 'New local end, "YYYY-MM-DDTHH:mm".' },
  allDay: { type: 'boolean', description: 'Switch the event to or from all-day.' },
  location: { type: 'string', description: 'New place; an empty string clears it.' },
  note: { type: 'string', description: 'New note; an empty string clears it.' },
  reminder: REMINDER_PARAMETERS,
  done: {
    type: 'boolean',
    description: 'true marks the event done, false reopens it. Omit to leave the state alone.',
  },
}

/** The created-event shape returned by `calendar_add`. */
const ADD_OUTPUT: AuthorSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    created: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', required: true },
          title: { type: 'string', required: true },
          start: { type: 'string', required: true },
          end: { type: 'string', required: true },
        },
      },
    },
  },
}

/** The event list returned by `calendar_list`; ids feed every other tool. */
const LIST_OUTPUT: AuthorSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    events: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', required: true },
          title: { type: 'string', required: true },
          start: { type: 'string', required: true },
          end: { type: 'string', required: true },
          done: { type: 'boolean', required: true, description: 'True once the user marked it done.' },
          location: { type: 'string' },
          reminder: { type: 'string', description: 'Human summary of the reminder tier, e.g. "lead 2 hours".' },
        },
      },
    },
  },
}

/** The changed-event shape returned by `calendar_update`. */
const UPDATE_OUTPUT: AuthorSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    updated: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', required: true },
          title: { type: 'string', required: true },
          start: { type: 'string', required: true },
          end: { type: 'string', required: true },
          changed: {
            type: 'array',
            required: true,
            items: { type: 'string', description: 'A field name that changed: title, time, all-day, place, note, reminder, done.' },
          },
          done: { type: 'boolean', required: true, description: 'The completion state after the patch.' },
        },
      },
    },
  },
}

/** The removed-event shape returned by `calendar_delete`. */
const DELETE_OUTPUT: AuthorSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    deleted: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', required: true },
          title: { type: 'string', required: true },
          start: { type: 'string', required: true },
          end: { type: 'string', required: true },
        },
      },
    },
  },
}

/** `YYYY-MM-DDTHH:mm` → `YYYY-MM-DD HH:mm` for readable output. */
function human(stamp: string): string {
  return stamp.replace('T', ' ')
}

/** Read one reminder plan out of untrusted tool arguments. */
function readReminder(value: unknown): ReminderPlan | undefined {
  if (value === undefined) return undefined
  return cleanReminderPlan(value)
}

/**
 * Turn one raw `calendar_update` row into a patch.
 * @param raw - untrusted row.
 * @returns the patch, or null when it has no id.
 */
function readPatch(raw: unknown): ToolPatch | null {
  if (raw === null || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const id = typeof row.id === 'string' ? row.id.trim() : ''
  if (id === '') return null
  const patch: ToolPatch = { id }
  if (typeof row.title === 'string' && row.title.trim() !== '') patch.title = row.title.trim()
  if (typeof row.start === 'string') patch.start = row.start.trim().replace(' ', 'T')
  if (typeof row.end === 'string') patch.end = row.end.trim().replace(' ', 'T')
  if (row.allDay === true || row.allDay === false) patch.allDay = row.allDay
  // An empty string is how the model clears a field; keep it as '' rather than
  // dropping it, so `cleanEvent` can decide.
  if (typeof row.location === 'string') patch.location = row.location.trim()
  if (typeof row.note === 'string') patch.note = row.note
  const reminder = readReminder(row.reminder)
  if (reminder !== undefined) patch.reminder = reminder
  if (row.done === true || row.done === false) patch.done = row.done
  return patch
}

/** Field names a patch touches, for the result text. */
function changedFields(patch: ToolPatch): string[] {
  const out: string[] = []
  if (patch.title !== undefined) out.push('title')
  if (patch.start !== undefined || patch.end !== undefined) out.push('time')
  if (patch.allDay !== undefined) out.push('all-day')
  if (patch.location !== undefined) out.push('place')
  if (patch.note !== undefined) out.push('note')
  if (patch.reminder !== undefined) out.push('reminder')
  if (patch.done !== undefined) out.push('done')
  return out
}

/**
 * Build the tool definitions.
 * @param handlers - what the tools do to the document.
 * @returns registry-ready definitions.
 */
export function calendarToolDefinitions(handlers: ToolHandlers): unknown[] {
  const addParameters = parametersToSchema({
    events: {
      type: 'array',
      required: true,
      items: { type: 'object', additionalProperties: false, properties: EVENT_PARAMETERS },
      description: 'Events to create.',
    },
  })
  const addSchema = outputToSchema(ADD_OUTPUT)

  const listParameters = parametersToSchema({
    from: { type: 'string', required: true, description: 'First day, "YYYY-MM-DD", inclusive. Use today for "upcoming" questions.' },
    to: { type: 'string', required: true, description: 'Last day, "YYYY-MM-DD", inclusive. About 30 days ahead covers "what is coming up".' },
  })
  const listSchema = outputToSchema(LIST_OUTPUT)

  const updateParameters = parametersToSchema({
    events: {
      type: 'array',
      required: true,
      items: { type: 'object', additionalProperties: false, properties: PATCH_PARAMETERS },
      description: 'Changes to apply. Send only the fields that change; everything else is left as it is.',
    },
  })
  const updateSchema = outputToSchema(UPDATE_OUTPUT)

  const deleteParameters = parametersToSchema({
    ids: {
      type: 'array',
      required: true,
      items: { type: 'string', description: 'An id returned by calendar_list.' },
      description: 'Events to delete. The whole stored event goes, including every occurrence of a repeating one.',
    },
  })
  const deleteSchema = outputToSchema(DELETE_OUTPUT)

  for (const [label, schema] of [
    ['calendar_add.parameters', addParameters],
    ['calendar_add.output', addSchema],
    ['calendar_list.parameters', listParameters],
    ['calendar_list.output', listSchema],
    ['calendar_update.parameters', updateParameters],
    ['calendar_update.output', updateSchema],
    ['calendar_delete.parameters', deleteParameters],
    ['calendar_delete.output', deleteSchema],
  ] as const) {
    const violations = validateRawSchema(schema)
    if (violations.length > 0) throw new Error(`${label}: ${violations.join('; ')}`)
  }

  return [
    {
      name: ADD_TOOL,
      description:
        "Add one or more events to the user's DSH calendar. Call it only after the user has agreed to the events in conversation; every call also pauses for an explicit approval before anything is written. Times are local wall-clock \"YYYY-MM-DDTHH:mm\"; resolve \"tomorrow\", \"next Wednesday\" and similar against the current date before calling. Pick a reminder tier from how far away the event is: short for today, mid for a week or two, long for anything further out.",
      parameters: addParameters,
      output: {
        schema: addSchema,
        render: (_args: unknown, value: { created: ToolEvent[] }) => [
          {
            type: 'text',
            text:
              value.created.length === 0
                ? 'No event was created.'
                : value.created.map((event) => `Added: ${event.title} — ${human(event.start)} to ${human(event.end)}`).join('\n'),
          },
        ],
      },
      execute: (args: { events?: unknown[] }) => {
        if (args === null || typeof args !== 'object' || !Array.isArray(args.events)) {
          throw new Error('events must be an array of event objects')
        }
        const parsed: ParsedEvent[] = []
        for (const [index, row] of args.events.entries()) {
          const event = normalizeEventRow(row)
          if (event === null) throw new Error(`events[${index}] needs at least a title and a start of the form YYYY-MM-DDTHH:mm`)
          parsed.push(event)
        }
        return { created: handlers.add(parsed) }
      },
      isConcurrencySafe: () => false,
    },
    {
      name: LIST_TOOL,
      description:
        "List the user's calendar events between two local dates, inclusive, with every occurrence of repeating events and whether each one is already done. Call it whenever the answer depends on what the user already has scheduled — \"what is coming up\", \"what's on next week\", \"am I free on Thursday\", \"what is still open\", or any question about their plans — instead of answering from memory. It is also the only way to obtain the ids that calendar_update and calendar_delete need.",
      parameters: listParameters,
      output: {
        schema: listSchema,
        render: (_args: unknown, value: { events: ToolListed[] }) => [
          {
            type: 'text',
            text:
              value.events.length === 0
                ? 'No events in that range.'
                : value.events
                    .map((event) => {
                      const marks = [event.done ? '✓ done' : '☐ open']
                      if (event.location !== undefined) marks.push(`@ ${event.location}`)
                      if (event.reminder !== undefined) marks.push(event.reminder)
                      return `${human(event.start)} ${event.title} (${marks.join(' · ')}) [id: ${event.id}]`
                    })
                    .join('\n'),
          },
        ],
      },
      execute: (args: { from?: unknown; to?: unknown }) => {
        const from = typeof args?.from === 'string' ? args.from : ''
        const to = typeof args?.to === 'string' ? args.to : ''
        if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
          throw new Error('from and to must be dates of the form YYYY-MM-DD')
        }
        return { events: handlers.list(from, to) }
      },
      isConcurrencySafe: () => true,
    },
    {
      name: UPDATE_TOOL,
      description:
        "Change an existing event in the user's DSH calendar by id: time, title, place, note, all-day flag, reminder tier, or completion state. Use it whenever the user says a plan is finished, handed in, attended or done — with done: true — or wants it reopened — done: false; also for any correction to what was scheduled. Call calendar_list first and copy its ids; never guess one. Send only the fields that change: a field you leave out keeps its value, and an empty string clears a place or note. Every call pauses for an explicit approval that shows the old and new values.",
      parameters: updateParameters,
      output: {
        schema: updateSchema,
        render: (_args: unknown, value: { updated: Array<ToolEvent & { changed: string[]; done: boolean }> }) => [
          {
            type: 'text',
            text:
              value.updated.length === 0
                ? 'Nothing was updated.'
                : value.updated
                    .map((event) => {
                      // A completion reads as an action, not as a field diff.
                      if (event.changed.length === 1 && event.changed[0] === 'done') {
                        return `${event.done ? 'Marked done' : 'Reopened'}: ${event.title} — ${human(event.start)}`
                      }
                      const fields = event.changed.length === 0 ? 'no field changed' : event.changed.join(', ')
                      return `Updated: ${event.title} — ${human(event.start)} (${fields})`
                    })
                    .join('\n'),
          },
        ],
      },
      execute: (args: { events?: unknown[] }) => {
        if (args === null || typeof args !== 'object' || !Array.isArray(args.events) || args.events.length === 0) {
          throw new Error('events must be a non-empty array of patch objects, each with an id')
        }
        const patches: ToolPatch[] = []
        for (const [index, row] of args.events.entries()) {
          const patch = readPatch(row)
          if (patch === null) throw new Error(`events[${index}] needs an id from calendar_list`)
          if (changedFields(patch).length === 0) throw new Error(`events[${index}] changes nothing; send at least one field`)
          patches.push(patch)
        }
        const updated = handlers.update(patches)
        return {
          updated: updated.map((event, index) => ({
            ...event,
            changed: changedFields(patches[index] as ToolPatch),
          })),
        }
      },
      isConcurrencySafe: () => false,
    },
    {
      name: DELETE_TOOL,
      description:
        "Delete events from the user's DSH calendar by id. Call calendar_list first and copy its ids; never guess one. Deleting removes the whole stored event — for a repeating event that means every occurrence — and cannot be undone, so confirm the titles with the user before calling; every call also pauses for an explicit approval.",
      parameters: deleteParameters,
      output: {
        schema: deleteSchema,
        render: (_args: unknown, value: { deleted: ToolEvent[] }) => [
          {
            type: 'text',
            text:
              value.deleted.length === 0
                ? 'Nothing was deleted.'
                : value.deleted.map((event) => `Deleted: ${event.title} — ${human(event.start)}`).join('\n'),
          },
        ],
      },
      execute: (args: { ids?: unknown }) => {
        if (args === null || typeof args !== 'object' || !Array.isArray(args.ids) || args.ids.length === 0) {
          throw new Error('ids must be a non-empty array of event ids from calendar_list')
        }
        const ids = args.ids.map((id) => String(id)).filter((id) => id !== '')
        if (ids.length === 0) throw new Error('ids must be a non-empty array of event ids from calendar_list')
        return { deleted: handlers.remove(ids) }
      },
      isConcurrencySafe: () => false,
    },
  ]
}

/** Minimal ctx surface used for registration and the approval gate. */
interface ToolContext {
  inject?(deps: string[], callback: (scope: { tools?: { register(definition: unknown): () => void } }) => void): void
  on?(event: string, listener: (...args: never[]) => unknown): () => void
  logger?: { warn(...args: unknown[]): void; error?(...args: unknown[]): void; info?(...args: unknown[]): void }
}

/**
 * Register the tools in the global tool layer, where every agent inherits them.
 * @param ctx - plugin context.
 * @param handlers - document operations.
 */
export function registerCalendarTools(ctx: ToolContext, handlers: ToolHandlers): void {
  if (typeof ctx.inject !== 'function') return
  try {
    ctx.inject(['tools'], (scope) => {
      const tools = scope.tools
      if (tools === undefined || typeof tools.register !== 'function') return
      const names: string[] = []
      for (const definition of calendarToolDefinitions(handlers)) {
        try {
          tools.register(definition)
          names.push((definition as { name: string }).name)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          ctx.logger?.error?.(`[dsh-schedule-calendar] tool registration failed: ${message}`)
        }
      }
      if (names.length > 0) {
        // Proves the registry accepted the definitions in this composition, and
        // gives support a line to ask for when a tool does not show up.
        ctx.logger?.info?.(`[dsh-schedule-calendar] tools registered: ${names.join(', ')}`)
      }
    })
  } catch (error) {
    ctx.logger?.warn('[dsh-schedule-calendar] no tool registry in this composition:', error)
  }
}

/** One approval prompt's worth of detail. */
interface Summary {
  count: number
  lines: string[]
}

/** The stored event an approval prompt compares a patch against. */
export interface KnownEvent {
  id?: string
  title: string
  start: string
  end: string
  allDay?: boolean
  location?: string
  note?: string
  reminder?: ReminderPlan
  done?: boolean
}

/** Describe an `events` payload for the prompt. */
function summarizeAdd(args: unknown): Summary | null {
  const events = (args as { events?: unknown[] } | undefined)?.events
  if (!Array.isArray(events) || events.length === 0) return null
  const lines: string[] = []
  for (const row of events.slice(0, 5)) {
    const event = row as { title?: unknown; start?: unknown; end?: unknown }
    const title = typeof event.title === 'string' && event.title.trim() !== '' ? event.title.trim() : '(untitled)'
    const start = typeof event.start === 'string' ? human(event.start) : '?'
    const end = typeof event.end === 'string' ? `–${human(event.end).slice(11)}` : ''
    lines.push(`· ${title} — ${start}${end}`)
  }
  if (events.length > 5) lines.push(`· …${events.length - 5} more`)
  return { count: events.length, lines }
}

/** Resolve ids through the lookup, keeping the call order. */
function resolve(ids: unknown[], lookup?: (ids: string[]) => KnownEvent[]): KnownEvent[] {
  const known = lookup?.(ids.map((id) => String(id))) ?? []
  return known
}

/** Describe an `ids` payload for the prompt. */
function summarizeDelete(args: unknown, lookup?: (ids: string[]) => KnownEvent[]): Summary | null {
  const ids = (args as { ids?: unknown } | undefined)?.ids
  if (!Array.isArray(ids) || ids.length === 0) return null
  const known = resolve(ids, lookup)
  if (known.length === 0) {
    return { count: ids.length, lines: ids.slice(0, 5).map((id) => `· ${String(id)}`) }
  }
  const lines = known.slice(0, 5).map((event) => `· ${event.title} — ${human(event.start)}`)
  if (known.length > 5) lines.push(`· …${known.length - 5} more`)
  return { count: known.length, lines }
}

/** `时间 2026-12-02 10:00 → 2026-12-03 14:00` for one changed field. */
function diffLine(field: string, before: string, after: string): string {
  return `${field} ${before === '' ? '∅' : before} → ${after === '' ? '∅' : after}`
}

/** Describe the difference between a patch and the stored event. */
function summarizeUpdate(args: unknown, lookup?: (ids: string[]) => KnownEvent[]): Summary | null {
  const rows = (args as { events?: unknown[] } | undefined)?.events
  if (!Array.isArray(rows) || rows.length === 0) return null
  const patches = rows.map((row) => readPatch(row)).filter((patch): patch is ToolPatch => patch !== null)
  const known = lookup?.(patches.map((patch) => patch.id)) ?? []
  const knownById = new Map(known.map((event) => [event.id ?? '', event]))
  const lines: string[] = []
  for (const patch of patches.slice(0, 5)) {
    const before = knownById.get(patch.id)
    const head = before === undefined ? patch.id : `${before.title}`
    const changes: string[] = []
    if (patch.title !== undefined) changes.push(diffLine('标题/title', before?.title ?? '?', patch.title))
    if (patch.start !== undefined || patch.end !== undefined) {
      const from = before === undefined ? '?' : `${human(before.start)}–${before.end.slice(11)}`
      const to = `${human(patch.start ?? before?.start ?? '?')}–${(patch.end ?? before?.end ?? '?').slice(11)}`
      changes.push(diffLine('时间/time', from, to))
    }
    if (patch.location !== undefined) changes.push(diffLine('地点/place', before?.location ?? '', patch.location))
    if (patch.note !== undefined) changes.push(diffLine('备注/note', before?.note ?? '', patch.note))
    if (patch.allDay !== undefined) {
      changes.push(diffLine('全天/all-day', before === undefined ? '?' : String(before.allDay === true), String(patch.allDay)))
    }
    if (patch.reminder !== undefined) {
      changes.push(diffLine('提醒/remind', describePlan(before?.reminder, 'zh'), describePlan(patch.reminder, 'zh')))
    }
    if (patch.done !== undefined) {
      const mark = (value: boolean | undefined): string => (value === true ? '✓ 完成' : '☐ 未完成')
      changes.push(diffLine('状态/done', before === undefined ? '?' : mark(before.done), mark(patch.done)))
    }
    lines.push(`· ${head} — ${changes.length === 0 ? 'no field' : changes.join('；')}`)
  }
  if (rows.length > 5) lines.push(`· …${rows.length - 5} more`)
  return { count: rows.length, lines }
}

/** What the gate needs from the document to describe a call. */
export interface ApprovalOptions {
  /** Resolve stored events by id so a prompt can name and compare them. */
  lookup?(ids: string[]): KnownEvent[]
}

/**
 * Pause every write for the user's decision.
 *
 * The seam is DSH's approval service: `ask` routes the request to whatever
 * answerer the session has, and a deployment without one denies the call rather
 * than writing silently.
 * @param ctx - plugin context.
 * @param options - event lookup used to describe the call.
 */
export function installApprovalGate(ctx: ToolContext, options: ApprovalOptions = {}): void {
  if (typeof ctx.on !== 'function') return
  try {
    ctx.on('tools/pre-execute', ((exec: { name?: string; arguments?: unknown }, next: () => unknown) => {
      const name = exec?.name
      if (name !== ADD_TOOL && name !== UPDATE_TOOL && name !== DELETE_TOOL) return next()

      let summary: Summary | null = null
      let label = ''
      let verb = ''
      if (name === ADD_TOOL) {
        summary = summarizeAdd(exec.arguments)
        label = '写入日程 / Add to calendar'
        verb = 'Add'
      } else if (name === UPDATE_TOOL) {
        summary = summarizeUpdate(exec.arguments, options.lookup)
        // A patch that only flips completion is a completion, and the prompt
        // should say so instead of the generic "update".
        const rows = (exec.arguments as { events?: unknown[] } | undefined)?.events
        const patches = (Array.isArray(rows) ? rows : []).map((row) => readPatch(row)).filter((patch): patch is ToolPatch => patch !== null)
        const completionOnly = patches.length > 0 && patches.every((patch) => changedFields(patch).join() === 'done')
        const reopening = completionOnly && patches.every((patch) => patch.done === false)
        if (completionOnly) {
          label = reopening ? '取消完成 / Reopen' : '标记完成 / Mark done'
          verb = reopening ? 'Reopen' : 'Mark done'
        } else {
          label = '修改日程 / Update calendar'
          verb = 'Update'
        }
      } else {
        summary = summarizeDelete(exec.arguments, options.lookup)
        label = '删除日程 / Delete from calendar'
        verb = 'Delete'
      }

      return {
        kind: 'ask',
        reason:
          summary === null
            ? `${verb} events in the DSH calendar`
            : `${verb} ${summary.count} event(s) in the DSH calendar:\n${summary.lines.join('\n')}`,
        displayReason: summary === null ? label : `${label} (${summary.count}):\n${summary.lines.join('\n')}`,
      }
    }) as never)
  } catch (error) {
    ctx.logger?.warn('[dsh-schedule-calendar] approval gate not installed:', error)
  }
}