/**
 * Recurrence expansion, shared by the calendar view and (later) the reminder
 * scanner so both agree on exactly which occurrences exist.
 */

import type { CalendarEvent, Repeat } from './types.js'

/** One concrete occurrence of an event. */
export interface Occurrence {
  /** Stable key: event id plus the occurrence's local start. */
  key: string
  event: CalendarEvent
  start: Date
  end: Date
}

/** Maximum occurrences one event may expand to in a single query. */
const LIMIT = 500

/** Parse `YYYY-MM-DDTHH:mm` (or date only) as a local Date. */
export function parseStamp(value: string): Date {
  const date = value.slice(0, 10)
  const time = value.length >= 16 ? value.slice(11, 16) : '00:00'
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0)
}

/** Format a Date as `YYYY-MM-DDTHH:mm`. */
export function stamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Format a Date as `YYYY-MM-DD`. */
export function dayKey(date: Date): string {
  return stamp(date).slice(0, 10)
}

/** ISO weekday, 1=Monday … 7=Sunday. */
function iso(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

/** Local midnight of a date. */
function midnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Monday of the week containing a date. */
function weekStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (iso(date) - 1))
}

/** Effective weekdays for a rule. */
function weekdaysOf(repeat: Repeat, fallback: number): number[] {
  const list = repeat.weekdays?.filter((d) => d >= 1 && d <= 7) ?? []
  return list.length > 0 ? list : [fallback]
}

/**
 * Expand one event into its occurrences inside a window.
 * @param event - the stored event.
 * @param from - window start (inclusive, local midnight).
 * @param to - window end (exclusive).
 * @returns occurrences in ascending start order.
 */
export function expandEvent(event: CalendarEvent, from: Date, to: Date): Occurrence[] {
  const start = parseStamp(event.start)
  const end = parseStamp(event.end)
  const duration = Math.max(0, end.getTime() - start.getTime())
  const repeat = event.repeat ?? { kind: 'none' as const }
  const until = repeat.until !== undefined ? parseStamp(`${repeat.until}T23:59`) : null
  const out: Occurrence[] = []

  /** Record one occurrence if it lands inside the window. */
  const push = (occurrenceStart: Date): void => {
    if (out.length >= LIMIT) return
    const occurrenceEnd = new Date(occurrenceStart.getTime() + duration)
    if (occurrenceStart >= to || occurrenceEnd < from) return
    out.push({ key: `${event.id}@${stamp(occurrenceStart)}`, event, start: occurrenceStart, end: occurrenceEnd })
  }

  if (repeat.kind === 'none') {
    push(start)
    return out
  }

  const firstDay = midnight(start)
  const cursor = midnight(from) < firstDay ? firstDay : midnight(from)
  const last = new Date(to)
  let guard = 0

  for (let day = new Date(cursor); day < last && guard < 2000; day.setDate(day.getDate() + 1), guard += 1) {
    if (until !== null && day > until) break
    const candidate = new Date(day)
    candidate.setHours(start.getHours(), start.getMinutes(), 0, 0)
    switch (repeat.kind) {
      case 'daily':
        push(candidate)
        break
      case 'weekdays':
        if (iso(day) >= 1 && iso(day) <= 5) push(candidate)
        break
      case 'weekly':
        if (weekdaysOf(repeat, iso(firstDay)).includes(iso(day))) push(candidate)
        break
      case 'biweekly': {
        if (!weekdaysOf(repeat, iso(firstDay)).includes(iso(day))) break
        const weeks = Math.round((weekStart(day).getTime() - weekStart(firstDay).getTime()) / (7 * 86_400_000))
        if (weeks % 2 === 0) push(candidate)
        break
      }
      case 'monthly':
        if (day.getDate() === firstDay.getDate()) push(candidate)
        break
      default:
        break
    }
  }
  return out
}

/**
 * Every occurrence of every event inside a window, ordered by start.
 * @param events - stored events.
 * @param from - window start.
 * @param to - window end.
 * @returns flattened occurrences.
 */
export function expandAll(events: CalendarEvent[], from: Date, to: Date): Occurrence[] {
  const out: Occurrence[] = []
  for (const event of events) out.push(...expandEvent(event, from, to))
  out.sort((a, b) => a.start.getTime() - b.start.getTime())
  return out
}
