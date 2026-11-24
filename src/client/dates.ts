/** Small local-date helpers shared by the three pages. */

/** Zero-pad to two digits. */
export function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Format a Date as `YYYY-MM-DD` in local time. */
export function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Format a Date as `YYYY-MM-DDTHH:mm` in local time. */
export function ymdhm(date: Date): string {
  return `${ymd(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Parse `YYYY-MM-DD` (or a full local timestamp) into a local Date. */
export function parseLocal(value: string): Date {
  const text = value.length > 10 ? value.slice(0, 10) : value
  const [y, m, d] = text.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

/** Add whole days, keeping local midnight. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

/** ISO weekday of a date, 1=Monday … 7=Sunday. */
export function isoWeekday(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

/** Whether two dates are the same local day. */
export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Weeks (arrays of 7 days) covering the month, starting on `weekStart`. */
export function monthMatrix(year: number, month: number, weekStart: 1 | 7): Date[][] {
  const first = new Date(year, month, 1)
  const offset = weekStart === 1 ? isoWeekday(first) - 1 : first.getDay()
  const start = addDays(first, -offset)
  const weeks: Date[][] = []
  for (let row = 0; row < 6; row += 1) {
    const week: Date[] = []
    for (let col = 0; col < 7; col += 1) week.push(addDays(start, row * 7 + col))
    weeks.push(week)
  }
  return weeks
}

/** Weekday labels in display order. */
export function weekdayLabels(weekStart: 1 | 7, locale: string): string[] {
  const monday = new Date(2024, 0, 1) // a Monday
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, weekStart === 1 ? i : (i + 6) % 7)
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)
  })
}

/** `YYYY年M月` / `Month YYYY` heading. */
export function monthTitle(year: number, month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(year, month, 1))
}

/** `HH:mm` of a stored local timestamp. */
export function clockOf(value: string): string {
  return value.length >= 16 ? value.slice(11, 16) : ''
}
