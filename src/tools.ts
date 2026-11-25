/**
 * The three model-facing tools.
 *
 * `calendar_add` writes events and `calendar_delete` removes them; both are
 * gated by a `tools/pre-execute` approval request, so a call pauses for the user
 * in whatever session the model is holding before anything reaches the
 * document. `calendar_list` is read-only and ungated, and it is also the only
 * way to learn the ids `calendar_delete` needs.
 *
 * Definitions are compiled from the author DSL into the raw schema subset the
 * registry accepts; see `tool-schema.ts` for why the conversion is local.
 */

import { normalizeEventRow, type ParsedEvent } from './ai.js'
import { outputToSchema, parametersToSchema, validateRawSchema, type AuthorSchema } from './tool-schema.js'

/** Name of the writing tool; the approval gate keys off it. */
export const ADD_TOOL = 'calendar_add'

/** Name of the read-only tool. */
export const LIST_TOOL = 'calendar_list'

/** Name of the destructive tool; the approval gate keys off it too. */
export const DELETE_TOOL = 'calendar_delete'

/** One event as the tools return it. */
export interface ToolEvent {
  id: string
  title: string
  start: string
  end: string
}

/** What the tools do to the calendar. */
export interface ToolHandlers {
  add(events: ParsedEvent[]): ToolEvent[]
  list(from: string, to: string): Array<{ id: string; title: string; start: string; end: string; location?: string }>
  remove(ids: string[]): ToolEvent[]
}

/** Event fields accepted by `calendar_add`. */
const EVENT_PARAMETERS: Record<string, AuthorSchema> = {
  title: { type: 'string', required: true, description: 'Short event title, without a leading command such as "remind me to".' },
  start: { type: 'string', required: true, description: 'Local start, exactly "YYYY-MM-DDTHH:mm".' },
  end: { type: 'string', description: 'Local end, "YYYY-MM-DDTHH:mm". Defaults to one hour after the start.' },
  allDay: { type: 'boolean', description: 'True for an all-day event.' },
  location: { type: 'string', description: 'Place, optional.' },
  note: { type: 'string', description: 'Free-form note, optional.' },
  remindBefore: {
    type: 'array',
    items: { type: 'number', description: 'Minutes before the start.' },
    description: 'Lead times in minutes. `[10]` means remind ten minutes before the start.',
  },
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

/** The event list returned by `calendar_list`; ids feed `calendar_delete`. */
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
          location: { type: 'string' },
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
        'Add one or more events to the user\'s DSH calendar. Call it only after the user has agreed to the events in conversation; every call also pauses for an explicit approval before anything is written. Times are local wall-clock "YYYY-MM-DDTHH:mm"; resolve "tomorrow", "next Wednesday" and similar against the current date before calling.',
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
        'List the user\'s calendar events between two local dates, inclusive, with every occurrence of repeating events. Call it whenever the answer depends on what the user already has scheduled — "what is coming up", "what\'s on next week", "am I free on Thursday", or any question about their plans — instead of answering from memory. It is also the only way to obtain the ids that calendar_delete needs.',
      parameters: listParameters,
      output: {
        schema: listSchema,
        render: (_args: unknown, value: { events: Array<{ id: string; title: string; start: string; location?: string }> }) => [
          {
            type: 'text',
            text:
              value.events.length === 0
                ? 'No events in that range.'
                : value.events
                    .map((event) => `${human(event.start)} ${event.title}${event.location === undefined ? '' : ` @ ${event.location}`} [id: ${event.id}]`)
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
      name: DELETE_TOOL,
      description:
        'Delete events from the user\'s DSH calendar by id. Call calendar_list first and copy its ids; never guess one. Deleting removes the whole stored event — for a repeating event that means every occurrence — and cannot be undone, so confirm the titles with the user before calling; every call also pauses for an explicit approval.',
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

/**
 * Describe an `ids` payload for the prompt.
 * @param args - raw call arguments.
 * @param lookup - resolves stored events so the prompt names what disappears.
 * @returns the summary, or null when nothing is parseable.
 */
function summarizeDelete(args: unknown, lookup?: (ids: string[]) => Array<{ title: string; start: string; end: string }>): Summary | null {
  const ids = (args as { ids?: unknown } | undefined)?.ids
  if (!Array.isArray(ids) || ids.length === 0) return null
  const known = lookup?.(ids.map((id) => String(id))) ?? []
  if (known.length === 0) {
    return { count: ids.length, lines: ids.slice(0, 5).map((id) => `· ${String(id)}`) }
  }
  const lines = known.slice(0, 5).map((event) => `· ${event.title} — ${human(event.start)}`)
  if (known.length > 5) lines.push(`· …${known.length - 5} more`)
  return { count: known.length, lines }
}

/** What the gate needs from the document to describe a destructive call. */
export interface ApprovalOptions {
  /** Resolve stored events by id so a delete prompt can name them. */
  lookup?(ids: string[]): Array<{ title: string; start: string; end: string }>
}

/**
 * Pause every write and delete for the user's decision.
 *
 * The seam is DSH's approval service: `ask` routes the request to whatever
 * answerer the session has, and a deployment without one denies the call rather
 * than writing silently.
 * @param ctx - plugin context.
 * @param options - event lookup used to describe a delete.
 */
export function installApprovalGate(ctx: ToolContext, options: ApprovalOptions = {}): void {
  if (typeof ctx.on !== 'function') return
  try {
    ctx.on('tools/pre-execute', ((exec: { name?: string; arguments?: unknown }, next: () => unknown) => {
      const name = exec?.name
      if (name !== ADD_TOOL && name !== DELETE_TOOL) return next()

      const deleting = name === DELETE_TOOL
      const summary = deleting ? summarizeDelete(exec.arguments, options.lookup) : summarizeAdd(exec.arguments)
      // The host has no locale of its own; the prompt is bilingual so it reads
      // correctly whatever language the session runs in.
      const label = deleting ? '删除日程 / Delete from calendar' : '写入日程 / Add to calendar'
      const verb = deleting ? 'Delete' : 'Add'
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