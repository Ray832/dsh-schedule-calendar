/**
 * Reminder engine.
 *
 * Scans the document for occurrences whose lead time has just arrived and
 * queues one notice per (occurrence, lead time). The browser half drains the
 * queue by polling, so a closed page never loses a reminder that is still
 * inside the retry window, and a restart never fires the same notice twice.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { expandAll, parseStamp, stamp } from './repeat.js'
import type { CalendarEvent, CalendarState } from './types.js'

/** One reminder waiting for or delivered to a browser page. */
export interface Notice {
  /** Stable key: event, occurrence start and lead time. */
  id: string
  eventId: string
  title: string
  start: string
  end: string
  allDay: boolean
  location?: string
  /** Lead time in minutes this notice fires at. */
  leadMinutes: number
  /** When the lead time arrived (epoch ms). */
  firedAt: number
  /** True when the app was closed at the intended moment. */
  missed?: boolean
  /** Set while a snooze is pending (epoch ms). */
  snoozedUntil?: number
}

/** Scan interval, in milliseconds. */
const TICK_MS = 15_000

/** A notice stays drainable for this long after it fires. */
const MAX_AGE_MS = 30 * 60_000

/** How far back a first scan looks for reminders the app was closed for. */
const LOOKBACK_MS = 12 * 60 * 60_000

/** At most this many missed reminders are replayed on startup. */
const MAX_MISSED = 5

/** Fired keys kept on disk, so a restart does not replay them. */
const MAX_FIRED = 4000

/** Persisted bookkeeping. */
interface FiredLog {
  fired: Record<string, number>
}

/** Clock helpers used by the scan. */
export interface EngineOptions {
  /** Reads the current document. */
  state(): CalendarState
  /** Absolute path of the bookkeeping file. */
  logPath: string
  /** Sink for storage problems. */
  onError?(error: unknown): void
  /** Injectable clock, for tests. */
  now?(): number
}

/** Whether a local time falls inside the quiet window. */
function inQuietHours(state: CalendarState, date: Date): boolean {
  const quiet = state.settings.quietHours
  if (!quiet.enabled) return false
  const minutes = date.getHours() * 60 + date.getMinutes()
  const parse = (value: string): number => {
    const [h, m] = value.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }
  const from = parse(quiet.from)
  const to = parse(quiet.to)
  if (from === to) return false
  return from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to
}

/** The reminder engine for one plugin instance. */
export class ReminderEngine {
  private readonly options: EngineOptions

  private readonly fired = new Map<string, number>()

  private readonly queue = new Map<string, Notice>()

  private readonly deliveredAt = new Map<string, number>()

  private timer: NodeJS.Timeout | undefined

  private lastScan = 0

  private firstScanDone = false

  constructor(options: EngineOptions) {
    this.options = options
    this.load()
  }

  /** Read the fired log, ignoring and resetting a damaged file. */
  private load(): void {
    const path = this.options.logPath
    if (!existsSync(path)) return
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8')) as FiredLog
      for (const [key, at] of Object.entries(parsed.fired ?? {})) {
        if (typeof at === 'number') this.fired.set(key, at)
      }
    } catch (error) {
      this.options.onError?.(error)
    }
  }

  /** Persist the fired log atomically, dropping entries past the retention window. */
  private save(): void {
    const path = this.options.logPath
    const cutoff = this.now() - 40 * 24 * 60 * 60_000
    const entries = [...this.fired.entries()].filter(([, at]) => at >= cutoff).slice(-MAX_FIRED)
    this.fired.clear()
    for (const [key, at] of entries) this.fired.set(key, at)
    const payload: FiredLog = { fired: Object.fromEntries(entries) }
    try {
      mkdirSync(dirname(path), { recursive: true })
      const tmp = `${path}.tmp`
      writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
      renameSync(tmp, path)
    } catch (error) {
      this.options.onError?.(error)
    }
  }

  /** Current time in epoch milliseconds. */
  private now(): number {
    return this.options.now?.() ?? Date.now()
  }

  /** Start the scan loop. @returns a disposer. */
  start(): () => void {
    this.scan()
    this.timer = setInterval(() => this.scan(), TICK_MS)
    if (typeof this.timer.unref === 'function') this.timer.unref()
    return () => this.stop()
  }

  /** Stop the scan loop. */
  stop(): void {
    if (this.timer !== undefined) clearInterval(this.timer)
    this.timer = undefined
  }

  /**
   * Drop queue entries that are too old to be useful.
   * @param now - current epoch ms.
   */
  private prune(now: number): void {
    for (const [id, notice] of this.queue) {
      const delivered = this.deliveredAt.get(id)
      if (delivered !== undefined && now - delivered > MAX_AGE_MS) {
        this.queue.delete(id)
        this.deliveredAt.delete(id)
        continue
      }
      if (delivered === undefined && now - notice.firedAt > MAX_AGE_MS) this.queue.delete(id)
    }
  }

  /**
   * One scan pass: queue every lead time that just arrived.
   * @returns the notices queued by this pass.
   */
  scan(): Notice[] {
    const state = this.options.state()
    const now = this.now()
    const from = this.lastScan === 0 ? now - LOOKBACK_MS : this.lastScan - 1000
    this.lastScan = now
    this.prune(now)

    const occurrences = expandAll(state.events, new Date(from - 24 * 60 * 60_000), new Date(now + 60 * 60_000))
    const added: Notice[] = []
    let recorded = false

    for (const occurrence of occurrences) {
      const event = occurrence.event
      const leads = (event.remindBefore ?? []).filter((lead) => Number.isFinite(lead) && lead >= 0)
      for (const lead of leads) {
        const fireAt = occurrence.start.getTime() - lead * 60_000
        if (fireAt > now || fireAt < from) continue
        const id = `${occurrence.key}#${lead}`
        if (this.fired.has(id) || this.queue.has(id)) continue
        const missed = !this.firstScanDone && now - fireAt > 2 * 60_000
        if (missed && added.length >= MAX_MISSED) continue
        if (!missed && inQuietHours(state, new Date(fireAt))) {
          // Suppressed, but still recorded: after a restart it must stay silent.
          this.fired.set(id, fireAt)
          recorded = true
          continue
        }
        const notice: Notice = {
          id,
          eventId: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          location: event.location,
          leadMinutes: lead,
          firedAt: fireAt,
          ...(missed ? { missed: true } : {}),
        }
        this.queue.set(id, notice)
        this.fired.set(id, fireAt)
        added.push(notice)
      }
    }

    this.firstScanDone = true
    if (added.length > 0 || recorded) this.save()
    return added
  }

  /**
   * Take every notice the browser has not seen yet.
   * @returns notices to render now.
   */
  pending(): Notice[] {
    const now = this.now()
    this.prune(now)
    const out: Notice[] = []
    for (const [id, notice] of this.queue) {
      if (this.deliveredAt.has(id)) continue
      if (notice.snoozedUntil !== undefined && notice.snoozedUntil > now) continue
      this.deliveredAt.set(id, now)
      out.push(notice)
    }
    return out
  }

  /**
   * Re-arm one notice after a snooze.
   * @param id - notice id.
   * @param minutes - delay in minutes.
   * @returns the updated notice, or undefined when it is gone.
   */
  snooze(id: string, minutes: number): Notice | undefined {
    const notice = this.queue.get(id)
    if (notice === undefined) return undefined
    notice.snoozedUntil = this.now() + Math.max(1, minutes) * 60_000
    this.deliveredAt.delete(id)
    return notice
  }

  /**
   * Forget one notice: the user closed or completed it.
   * @param id - notice id.
   */
  ack(id: string): void {
    this.queue.delete(id)
    this.deliveredAt.delete(id)
  }

  /** Everything still on screen, for diagnostics and tests. */
  snapshot(): Notice[] {
    return [...this.queue.values()]
  }
}

/**
 * Build a stable id for one occurrence's lead time.
 * @param event - the event.
 * @param occurrenceStart - local start of the occurrence.
 * @param lead - lead minutes.
 * @returns the notice id.
 */
export function noticeId(event: CalendarEvent, occurrenceStart: Date, lead: number): string {
  return `${event.id}@${stamp(occurrenceStart)}#${lead}`
}
