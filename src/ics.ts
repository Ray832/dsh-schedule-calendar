/**
 * Minimal iCalendar (RFC 5545) support.
 *
 * Only what a student calendar needs: VEVENT with a floating local time, a
 * summary, a location, a description and the five recurrence rules this plugin
 * offers. Unknown properties are ignored on import and never produced on
 * export, so a Google Calendar round-trip loses only exotic features.
 */

import type { CalendarEvent, Repeat, RepeatKind } from './types.js'

/** Weekday codes used by RRULE BYDAY. */
const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

/** Escape a text property value. */
function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Unescape a text property value. */
function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

/** `YYYY-MM-DDTHH:mm` to `YYYYMMDDTHHmm00`. */
function toIcsStamp(local: string, allDay: boolean): string {
  const date = local.slice(0, 10).replace(/-/g, '')
  if (allDay) return date
  const time = (local.length >= 16 ? local.slice(11, 16) : '00:00').replace(':', '')
  return `${date}T${time}00`
}

/** `YYYYMMDDTHHmmss` (or `YYYYMMDD`) to `YYYY-MM-DDTHH:mm`. */
function fromIcsStamp(value: string, fallbackAllDay: boolean): { stamp: string; allDay: boolean } | null {
  const clean = value.replace(/^[^:]*:/, '').trim()
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(clean)
  if (dateOnly !== null) {
    return { stamp: `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T00:00`, allDay: true }
  }
  const full = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z?$/.exec(clean)
  if (full !== null) {
    return { stamp: `${full[1]}-${full[2]}-${full[3]}T${full[4]}:${full[5]}`, allDay: fallbackAllDay }
  }
  return null
}

/** Build an RRULE line, or undefined when the event does not repeat. */
function toRrule(repeat: Repeat | undefined): string | undefined {
  if (repeat === undefined || repeat.kind === 'none') return undefined
  const days = (repeat.weekdays ?? []).map((day) => BYDAY[day - 1]).filter(Boolean)
  const parts: string[] = []
  switch (repeat.kind) {
    case 'daily':
      parts.push('FREQ=DAILY')
      break
    case 'weekdays':
      parts.push('FREQ=WEEKLY', 'BYDAY=MO,TU,WE,TH,FR')
      break
    case 'weekly':
      parts.push('FREQ=WEEKLY')
      if (days.length > 0) parts.push(`BYDAY=${days.join(',')}`)
      break
    case 'biweekly':
      parts.push('FREQ=WEEKLY', 'INTERVAL=2')
      if (days.length > 0) parts.push(`BYDAY=${days.join(',')}`)
      break
    case 'monthly':
      parts.push('FREQ=MONTHLY')
      break
    default:
      return undefined
  }
  if (repeat.until !== undefined) parts.push(`UNTIL=${repeat.until.replace(/-/g, '')}T235900`)
  return parts.join(';')
}

/** Fold a content line at 73 octets, as the format requires. */
function fold(line: string): string {
  if (line.length <= 72) return line
  const chunks: string[] = []
  let rest = line
  while (rest.length > 72) {
    chunks.push(rest.slice(0, 72))
    rest = ` ${rest.slice(72)}`
  }
  chunks.push(rest)
  return chunks.join('\r\n')
}

/**
 * Serialize events to an iCalendar document.
 * @param events - stored events.
 * @param name - calendar display name.
 * @returns the document text.
 */
export function toIcs(events: CalendarEvent[], name = 'DSH Schedule'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//dsh-schedule-calendar//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(name)}`,
  ]
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  for (const event of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.id}@dsh-schedule-calendar`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`DTSTART:${toIcsStamp(event.start, event.allDay)}`)
    lines.push(`DTEND:${toIcsStamp(event.end, event.allDay)}`)
    lines.push(fold(`SUMMARY:${escapeText(event.title)}`))
    if (event.location !== undefined) lines.push(fold(`LOCATION:${escapeText(event.location)}`))
    if (event.note !== undefined) lines.push(fold(`DESCRIPTION:${escapeText(event.note)}`))
    const rrule = toRrule(event.repeat)
    if (rrule !== undefined) lines.push(`RRULE:${rrule}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}

/** Split a document into unfolded content lines. */
function unfold(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .reduce<string[]>((lines, line) => {
      if (/^[ \t]/.test(line) && lines.length > 0) lines[lines.length - 1] += line.slice(1)
      else lines.push(line)
      return lines
    }, [])
    .filter((line) => line.trim() !== '')
}

/** Map an RRULE line back to a repeat rule. */
function fromRrule(value: string): Repeat {
  const fields = new Map<string, string>()
  for (const part of value.split(';')) {
    const [key, raw] = part.split('=')
    if (key !== undefined && raw !== undefined) fields.set(key.trim().toUpperCase(), raw.trim())
  }
  const freq = fields.get('FREQ')?.toUpperCase() ?? ''
  const interval = Number(fields.get('INTERVAL') ?? '1')
  const byday = (fields.get('BYDAY') ?? '')
    .split(',')
    .map((code) => BYDAY.indexOf(code.trim().slice(-2).toUpperCase()) + 1)
    .filter((day) => day >= 1 && day <= 7)
  let kind: RepeatKind = 'none'
  if (freq === 'DAILY') kind = 'daily'
  else if (freq === 'WEEKLY') {
    const weekdays = byday.length > 0 ? [...byday].sort((a, b) => a - b) : undefined
    const isWorkdays = weekdays?.length === 5 && weekdays.every((day, index) => day === index + 1)
    if (isWorkdays) kind = 'weekdays'
    else kind = interval >= 2 ? 'biweekly' : 'weekly'
  } else if (freq === 'MONTHLY') kind = 'monthly'
  const repeat: Repeat = { kind }
  if ((kind === 'weekly' || kind === 'biweekly') && byday.length > 0) {
    repeat.weekdays = [...byday].sort((a, b) => a - b)
  }
  const until = fields.get('UNTIL')
  if (until !== undefined && /^\d{8}/.test(until)) repeat.until = `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}`
  return repeat
}

/**
 * Parse an iCalendar document into event drafts.
 * @param text - the document text.
 * @returns drafts ready for the host's validator, and the blocks it skipped.
 */
export function fromIcs(text: string): { events: Array<Partial<CalendarEvent>>; skipped: number } {
  const lines = unfold(text)
  const events: Array<Partial<CalendarEvent>> = []
  let current: Record<string, string> | null = null
  let skipped = 0

  for (const line of lines) {
    const upper = line.toUpperCase()
    if (upper === 'BEGIN:VEVENT') {
      current = {}
      continue
    }
    if (upper === 'END:VEVENT') {
      if (current !== null) {
        const start = current.DTSTART !== undefined ? fromIcsStamp(current.DTSTART, false) : null
        if (current.SUMMARY === undefined || start === null) {
          skipped += 1
        } else {
          const allDay = current.DTSTART?.startsWith('VALUE=DATE') === true || start.allDay
          const end = current.DTEND !== undefined ? fromIcsStamp(current.DTEND, allDay) : null
          events.push({
            title: unescapeText(current.SUMMARY),
            start: start.stamp,
            end: end?.stamp ?? start.stamp,
            allDay,
            ...(current.LOCATION !== undefined ? { location: unescapeText(current.LOCATION) } : {}),
            ...(current.DESCRIPTION !== undefined ? { note: unescapeText(current.DESCRIPTION) } : {}),
            ...(current.RRULE !== undefined ? { repeat: fromRrule(current.RRULE) } : {}),
            remindBefore: [],
            source: 'import' as const,
          })
        }
      }
      current = null
      continue
    }
    if (current === null) continue
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const key = line.slice(0, colon).split(';')[0]?.toUpperCase() ?? ''
    const value = line.slice(colon + 1)
    if (key !== '') current[key] = value
  }
  return { events, skipped }
}
