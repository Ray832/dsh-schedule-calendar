/** CSV import for timetables exported by teaching systems. */

import type { Course, Parity } from '../types.js'

/** Weekday labels accepted in the weekday column. */
const WEEKDAY_WORDS: Record<string, number> = {
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7,
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7,
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7,
}

/** Parse a weekday cell: `3`, `周三`, `星期三`, `Wed`. */
export function parseWeekday(value: string): number | null {
  const text = value.trim().toLowerCase().replace(/^周|^星期|^礼拜/, '')
  if (text === '') return null
  return WEEKDAY_WORDS[text] ?? WEEKDAY_WORDS[text.slice(0, 3)] ?? null
}

/** Parse a parity cell. */
export function parseParity(value: string): Parity {
  const text = value.trim().toLowerCase()
  if (text === '' || text === 'all' || text === '每周' || text === '全') return 'all'
  if (text.includes('单') || text === 'odd') return 'odd'
  if (text.includes('双') || text === 'even') return 'even'
  return 'all'
}

/** Split one CSV line, honoring double quotes. */
function splitLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if ((char === ',' || char === '\t') && !quoted) {
      out.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  out.push(current.trim())
  return out
}

/** One parsed row, before the host validates it. */
export type ParsedCourse = Omit<Course, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Parse a course table.
 *
 * Columns: 名称, 教师, 地点, 星期, 开始节, 结束节, 起始周, 结束周, 单双周
 * A header row is detected and skipped; missing optional columns may be empty.
 * @param text - the whole file.
 * @returns parsed courses and the rows that could not be read.
 */
export function parseCourseCsv(text: string): { courses: ParsedCourse[]; skipped: string[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  const courses: ParsedCourse[] = []
  const skipped: string[] = []

  for (const [index, line] of lines.entries()) {
    const cells = splitLine(line)
    if (index === 0 && /名称|course|课程/i.test(cells[0] ?? '')) continue
    if (cells.length < 4) {
      skipped.push(line)
      continue
    }
    const [name = '', teacher = '', location = '', weekdayCell = '', startCell = '', endCell = '', fromCell = '', toCell = '', parityCell = ''] = cells
    const weekday = parseWeekday(weekdayCell)
    const startPeriod = Number.parseInt(startCell, 10)
    const endPeriod = Number.parseInt(endCell === '' ? startCell : endCell, 10)
    const from = fromCell === '' ? 1 : Number.parseInt(fromCell, 10)
    const to = toCell === '' ? 20 : Number.parseInt(toCell, 10)
    if (name === '' || weekday === null || !Number.isInteger(startPeriod) || !Number.isInteger(endPeriod)) {
      skipped.push(line)
      continue
    }
    const periods: number[] = []
    for (let p = Math.min(startPeriod, endPeriod); p <= Math.max(startPeriod, endPeriod); p += 1) periods.push(p)
    courses.push({
      name,
      teacher: teacher === '' ? undefined : teacher,
      location: location === '' ? undefined : location,
      weekday,
      periods,
      weeks: { from: Number.isInteger(from) && from > 0 ? from : 1, to: Number.isInteger(to) && to > 0 ? to : 20 },
      parity: parseParity(parityCell),
    })
  }
  return { courses, skipped }
}

/** Template shown to the user, doubling as documentation. */
export const CSV_TEMPLATE = `课程名称,教师,地点,星期,开始节,结束节,起始周,结束周,单双周
高等数学,张老师,教三-401,周一,1,2,1,16,每周
大学物理,李老师,理科楼-205,周三,3,4,1,16,单周
`
