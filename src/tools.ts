/**
 * The two model-facing tools.
 *
 * `calendar_add` writes events and is gated by a `tools/pre-execute` approval
 * request, so a call pauses for the user in whatever session the model is
 * holding before anything reaches the document. `calendar_list` is read-only
 * and ungated.
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
  list(from: string, to: string): Array<{ title: string; start: string; end: string; location?: string }>
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

/** The event list returned by `calendar_list`. */
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
          title: { type: 'string', required: true },
          start: { type: 'string', required: true },
          end: { type: 'string', required: true },
          location: { type: 'string' },
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
 * Build the two tool definitions.
 * @param handlers - what the tools do to the document.
 * @returns registry-ready definitions.
 */
export function calendarToolDefinitions(handlers: ToolHandlers): unknown[] {
  const addParameters = parametersToSchema({ events: { type: 'array', required: true, items: { type: 'object', additionalProperties: false, properties: EVENT_PARAMETERS }, description: 'Events to create.' } })
  const addSchema = outputToSchema(ADD_OUTPUT)
  const listParameters = parametersToSchema({
    from: { type: 'string', required: true, description: 'First day, "YYYY-MM-DD", inclusive.' },
    to: { type: 'string', required: true, description: 'Last day, "YYYY-MM-DD", inclusive.' },
  })
  const listSchema = outputToSchema(LIST_OUTPUT)

  for (const [label, schema] of [
    ['calendar_add.parameters', addParameters],
    ['calendar_add.output', addSchema],
    ['calendar_list.parameters', listParameters],
    ['calendar_list.output', listSchema],
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
        'List the user\'s calendar events between two local dates, inclusive — including occurrences of repeating events. Use it before answering questions about what is scheduled.',
      parameters: listParameters,
      output: {
        schema: listSchema,
        render: (_args: unknown, value: { events: Array<{ title: string; start: string }> }) => [
          {
            type: 'text',
            text:
              value.events.length === 0
                ? 'No events in that range.'
                : value.events.map((event) => `${human(event.start)} ${event.title}`).join('\n'),
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
  ]
}

/** Minimal ctx surface used for registration and the approval gate. */
interface ToolContext {
  inject?(deps: string[], callback: (scope: { tools?: { register(definition: unknown): () => void } }) => void): void
  on?(event: string, listener: (...args: never[]) => unknown): () => void
  logger?: { warn(...args: unknown[]): void; error?(...args: unknown[]): void; info?(...args: unknown[]): void }
}

/**
 * Register both tools in the global tool layer, where every agent inherits them.
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

/**
 * Summarize a call for the approval prompt.
 * @param args - raw call arguments.
 * @returns a short multi-line description, or null when nothing is parseable.
 */
export function describeApproval(args: unknown): string | null {
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
  return lines.join('\n')
}

/**
 * Pause every `calendar_add` call for the user's decision.
 *
 * The seam is DSH's approval service: `ask` routes the request to whatever
 * answerer the session has, and a deployment without one denies the call rather
 * than writing silently.
 * @param ctx - plugin context.
 */
export function installApprovalGate(ctx: ToolContext): void {
  if (typeof ctx.on !== 'function') return
  try {
    ctx.on('tools/pre-execute', ((exec: { name?: string; arguments?: unknown }, next: () => unknown) => {
      if (exec?.name !== ADD_TOOL) return next()
      const summary = describeApproval(exec.arguments)
      const events = (exec.arguments as { events?: unknown[] })?.events
      const count = Array.isArray(events) ? events.length : 0
      // The host has no locale of its own; the prompt is bilingual so it reads
      // correctly whatever language the session runs in.
      return {
        kind: 'ask',
        reason: summary === null ? 'Add events to the DSH calendar' : `Add ${count} event(s) to the DSH calendar:\n${summary}`,
        displayReason:
          summary === null
            ? '写入日程 / Add to calendar'
            : `写入日程 / Add to calendar (${count}):\n${summary}`,
      }
    }) as never)
  } catch (error) {
    ctx.logger?.warn('[dsh-schedule-calendar] approval gate not installed:', error)
  }
}