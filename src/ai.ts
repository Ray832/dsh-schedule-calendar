/**
 * Model-backed parsing.
 *
 * Two jobs share one prompt shape: turn a sentence into calendar events, and
 * turn a pasted timetable into courses. Both ask the configured DSH model for
 * strict JSON and validate the answer with the same rules the manual forms use,
 * so a model can never write something the UI could not.
 */

import type { Parity, ReminderPlan, Repeat, RepeatKind } from './types.js'
import { cleanReminderPlan, planFromLeads, reminderLeads } from './remind.js'

/** The subset of the DSH model service this plugin uses. */
interface LlmService {
  stream(options: Record<string, unknown>): AsyncIterable<{ type: string; text?: string }>
  listProviders?(): Array<{ name: string; models?: Array<{ id: string }> }>
}

/** The default-model service, when the profile mounts one. */
interface DefaultModelService {
  currentSelection?(): { provider?: string; model?: string } | undefined
}

/** A parsed event, before validation by the host's event cleaner. */
export interface ParsedEvent {
  title: string
  start: string
  end: string
  allDay: boolean
  location?: string
  /** Tier the model picked; the lead list below is derived from it. */
  reminder: ReminderPlan
  remindBefore: number[]
  repeat: Repeat
}

/** A parsed course row. */
export interface ParsedCourseRow {
  name: string
  teacher?: string
  location?: string
  weekday: number
  periods: number[]
  weeks: { from: number; to: number }
  parity: Parity
}

/** One model call that produced nothing usable. */
export class ParseError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

/** Local wall clock facts the prompt needs. */
function nowFacts(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  return `现在是 ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}（星期${weekday}），时区 ${Intl.DateTimeFormat().resolvedOptions().timeZone}。`
}

/** Strip a markdown fence and isolate the outermost JSON value. */
function extractJson(text: string): string {
  let body = text.trim()
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(body)
  if (fence?.[1] !== undefined) body = fence[1].trim()
  const firstArray = body.indexOf('[')
  const firstObject = body.indexOf('{')
  const start = firstArray < 0 ? firstObject : firstObject < 0 ? firstArray : Math.min(firstArray, firstObject)
  if (start < 0) throw new ParseError('parse-failed', '模型没有返回可解析的内容')
  const open = body[start]
  const close = open === '[' ? body.lastIndexOf(']') : body.lastIndexOf('}')
  if (close < start) throw new ParseError('parse-failed', '模型返回的 JSON 不完整')
  return body.slice(start, close + 1)
}

/** Ask the model one question and return its text answer. */
async function ask(
  llm: LlmService,
  route: { provider: string; model: string },
  system: string,
  user: string,
  signal?: AbortSignal,
): Promise<string> {
  let text = ''
  const stream = llm.stream({
    provider: route.provider,
    model: route.model,
    system,
    messages: [{ role: 'user', content: [{ type: 'text', text: user }] }],
    maxTokens: 1200,
    temperature: 0.1,
    ...(signal !== undefined ? { signal } : {}),
  })
  for await (const chunk of stream) {
    if (chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
  }
  if (text.trim() === '') throw new ParseError('empty-answer', '模型没有返回内容')
  return text
}

/** Clamp a value into a closed range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Accept `YYYY-MM-DDTHH:mm`, `YYYY-MM-DD HH:mm` or a date. */
function normalizeStamp(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim().replace(' ', 'T')
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(text)
  if (match === null) return null
  const [, y, m, d, hh, mm] = match
  return `${y}-${m}-${d}T${hh ?? '00'}:${mm ?? '00'}`
}

/** Normalize one model event row; returns null when unusable. */
export function normalizeEventRow(raw: unknown): ParsedEvent | null {
  if (raw === null || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const title = typeof row.title === 'string' ? row.title.trim() : ''
  const start = normalizeStamp(row.start)
  if (title === '' || start === null) return null
  const end = normalizeStamp(row.end) ?? start
  const allDay = row.allDay === true || start.endsWith('T00:00')
  // A tier is preferred; older prompts and callers still send a lead list.
  const reminder =
    row.reminder === undefined
      ? planFromLeads(Array.isArray(row.remindBefore) ? row.remindBefore.map((v) => Number(v)) : [])
      : cleanReminderPlan(row.reminder)
  const rawRepeat = (row.repeat ?? {}) as Record<string, unknown>
  const kind = String(rawRepeat.kind ?? 'none')
  const allowed: RepeatKind[] = ['none', 'daily', 'weekly', 'monthly', 'weekdays', 'biweekly']
  const repeat: Repeat = { kind: allowed.includes(kind as RepeatKind) ? (kind as RepeatKind) : 'none' }
  if (Array.isArray(rawRepeat.weekdays)) {
    const days = rawRepeat.weekdays.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v >= 1 && v <= 7)
    if (days.length > 0) repeat.weekdays = [...new Set(days)].sort((a, b) => a - b)
  }
  if (typeof rawRepeat.until === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawRepeat.until)) repeat.until = rawRepeat.until
  return {
    title: title.slice(0, 200),
    start,
    end: end < start ? start : end,
    allDay,
    ...(typeof row.location === 'string' && row.location.trim() !== '' ? { location: row.location.trim().slice(0, 200) } : {}),
    reminder,
    remindBefore: [...reminderLeads(reminder)].sort((a, b) => a - b),
    repeat,
  }
}

/** Prompt describing the event contract. */
const EVENT_SYSTEM = `你是一个日历解析器，只输出 JSON，不要任何解释、markdown 或代码块标记。
把用户的一句话解析成零到多条日程，输出一个 JSON 数组。每条对象的字段：
- title: 字符串，日程标题，去掉「提醒我」「帮我加」这类祈使句
- start: "YYYY-MM-DDTHH:mm"，本地时间
- end: "YYYY-MM-DDTHH:mm"，缺省时按 1 小时
- allDay: 布尔，只有「全天」「一整天」才为 true
- location: 字符串，可选，没有就不写
- reminder: 提醒档位对象，按日程远近选一档：
  · 短期（当天）：{"kind":"short","hours":小时0-24,"minutes":分钟0-60}，「提前半小时」= hours 0, minutes 30
  · 中期（一两周内）：{"kind":"mid","days":天数1-15}，「提前三天」= days 3
  · 长期（更远）：{"kind":"long","startDays":起点天数1-15,"everyDays":间隔1/3/5/7}，
    「从现在起每三天提醒一次」= startDays 15, everyDays 3
  · 用户说不用提醒：{"kind":"none"}；没说就按短期 {"kind":"short","hours":0,"minutes":10}
- repeat: 对象，{"kind":"none"}；每天用 daily，每周用 weekly 并给 weekdays（1=周一…7=周日），
  工作日用 weekdays，每月用 monthly，每两周用 biweekly
规则：相对时间（明天、下周三、今晚）都要换算成绝对日期；不确定就取最接近的未来时间；没有时间就取次日 09:00。`

/** Prompt describing the timetable contract. */
const COURSE_SYSTEM = `你是一个课表解析器，只输出 JSON，不要任何解释、markdown 或代码块标记。
把用户提供的课表文本解析成课程数组。每条对象的字段：
- name: 课程名称
- teacher: 教师，可选
- location: 上课地点，可选
- weekday: 1-7 的整数，1 表示周一
- periods: 节次数组，例如 [1,2] 表示第 1、2 节
- weeks: {"from": 起始周, "to": 结束周}
- parity: "all" | "odd" | "even"，单周是 odd，双周是 even
一门课在多个时间段上课时，拆成多条。`

/**
 * Parse one sentence into candidate events.
 * @param llm - the model service.
 * @param route - provider and model to call.
 * @param text - the user's sentence.
 * @param signal - cancellation.
 * @returns validated candidates, possibly empty.
 */
export async function parseEvents(
  llm: LlmService,
  route: { provider: string; model: string },
  text: string,
  signal?: AbortSignal,
): Promise<ParsedEvent[]> {
  const answer = await ask(llm, route, EVENT_SYSTEM, `${nowFacts(new Date())}\n用户说：${text}`, signal)
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJson(answer))
  } catch (error) {
    if (error instanceof ParseError) throw error
    throw new ParseError('parse-failed', '模型返回的不是合法 JSON')
  }
  const rows = Array.isArray(parsed) ? parsed : [parsed]
  const events = rows.map(normalizeEventRow).filter((row): row is ParsedEvent => row !== null)
  if (events.length === 0) throw new ParseError('no-events', '没有从这句话里识别出日程，换个说法试试')
  return events
}

/**
 * Parse a pasted timetable into course rows.
 * @param llm - the model service.
 * @param route - provider and model to call.
 * @param text - the pasted table.
 * @param signal - cancellation.
 * @returns validated rows.
 */
export async function parseCourses(
  llm: LlmService,
  route: { provider: string; model: string },
  text: string,
  signal?: AbortSignal,
): Promise<ParsedCourseRow[]> {
  const answer = await ask(llm, route, COURSE_SYSTEM, text.slice(0, 6000), signal)
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJson(answer))
  } catch (error) {
    if (error instanceof ParseError) throw error
    throw new ParseError('parse-failed', '模型返回的不是合法 JSON')
  }
  const rows = Array.isArray(parsed) ? parsed : [parsed]
  const courses: ParsedCourseRow[] = []
  for (const raw of rows) {
    if (raw === null || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const name = typeof row.name === 'string' ? row.name.trim() : ''
    const weekday = Number(row.weekday)
    const periods = Array.isArray(row.periods)
      ? row.periods.map((p) => Number(p)).filter((p) => Number.isInteger(p) && p >= 1 && p <= 24)
      : []
    if (name === '' || !Number.isInteger(weekday) || weekday < 1 || weekday > 7 || periods.length === 0) continue
    const weeks = (row.weeks ?? {}) as Record<string, unknown>
    const from = clamp(Number(weeks.from ?? 1) || 1, 1, 60)
    const to = clamp(Number(weeks.to ?? 20) || 20, 1, 60)
    const parityRaw = String(row.parity ?? 'all')
    courses.push({
      name: name.slice(0, 100),
      ...(typeof row.teacher === 'string' && row.teacher.trim() !== '' ? { teacher: row.teacher.trim().slice(0, 100) } : {}),
      ...(typeof row.location === 'string' && row.location.trim() !== '' ? { location: row.location.trim().slice(0, 100) } : {}),
      weekday,
      periods: [...new Set(periods)].sort((a, b) => a - b),
      weeks: { from: Math.min(from, to), to: Math.max(from, to) },
      parity: parityParity(parityRaw),
    })
  }
  if (courses.length === 0) throw new ParseError('no-courses', '没有识别出课程，检查一下文本格式')
  return courses
}

/** Map a parity word to the stored union. */
function parityParity(value: string): Parity {
  if (value === 'odd' || value.includes('单')) return 'odd'
  if (value === 'even' || value.includes('双')) return 'even'
  return 'all'
}
