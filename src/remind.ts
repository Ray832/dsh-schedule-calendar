/**
 * Reminder tiers.
 *
 * One event carries a `ReminderPlan`; the reminder engine and the ICS export
 * both work from the flat lead-minute list this module derives from it. Keeping
 * the conversion in one place is what makes "提前 2 小时" and "提前 15 天开始，
 * 每 3 天提醒一次" the same kind of thing to everything downstream.
 *
 * The three tiers exist because the three horizons are genuinely different:
 *
 * | tier  | horizon      | shape                                    |
 * |-------|--------------|------------------------------------------|
 * | short | today        | hours 0–24 + minutes 0–60, fires once     |
 * | mid   | up to 15 d   | days 1–15, fires once                    |
 * | long  | weeks ahead  | from `startDays`, repeats every N days   |
 *
 * A long-tier plan also fires on the day itself, so the deadline is never
 * silent just because the nudge sequence ended early.
 */

import type { ReminderPlan } from './types.js'

/** Upper bound of the short tier's hour field. */
export const SHORT_MAX_HOURS = 24

/** Upper bound of the short tier's minute field. */
export const SHORT_MAX_MINUTES = 60

/** Upper bound shared by the mid tier and the long tier's start. */
export const MID_MAX_DAYS = 15

/** The only intervals the long tier offers. */
export const LONG_INTERVALS = [1, 3, 5, 7] as const

/** Hard cap on derived lead times, so no plan can flood the engine. */
export const MAX_LEADS = 40

/** One minute in minutes. */
const MINUTES_PER_HOUR = 60

/** One day in minutes. */
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR

/** Round a value into an integer range, falling back when it is not a number. */
function int(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Math.round(Number(value))
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

/**
 * Clamp an untrusted reminder payload into a usable plan.
 * @param raw - whatever arrived over HTTP, from the model, or from disk.
 * @returns a plan that is always safe to store.
 */
export function cleanReminderPlan(raw: unknown): ReminderPlan {
  const plan = (raw ?? {}) as Partial<ReminderPlan>
  switch (plan.kind) {
    case 'short':
      return {
        kind: 'short',
        hours: int(plan.hours, 0, SHORT_MAX_HOURS, 0),
        minutes: int(plan.minutes, 0, SHORT_MAX_MINUTES, 10),
      }
    case 'mid':
      return { kind: 'mid', days: int(plan.days, 1, MID_MAX_DAYS, 1) }
    case 'long': {
      const everyDays = (LONG_INTERVALS as readonly number[]).includes(Number(plan.everyDays))
        ? Number(plan.everyDays)
        : 3
      const startDays = Math.max(everyDays, int(plan.startDays, 1, MID_MAX_DAYS, MID_MAX_DAYS))
      return { kind: 'long', startDays, everyDays }
    }
    default:
      return { kind: 'none' }
  }
}

/**
 * Derive the lead times a plan fires at.
 * @param plan - the stored tier.
 * @returns minutes before the start, one entry per reminder, largest first.
 */
export function reminderLeads(plan: ReminderPlan | undefined): number[] {
  if (plan === undefined) return []
  switch (plan.kind) {
    case 'short': {
      const minutes = (plan.hours ?? 0) * MINUTES_PER_HOUR + (plan.minutes ?? 0)
      return [minutes]
    }
    case 'mid':
      return [(plan.days ?? 1) * MINUTES_PER_DAY]
    case 'long': {
      const every = plan.everyDays ?? 3
      const out: number[] = []
      for (let day = plan.startDays ?? MID_MAX_DAYS; day >= 1; day -= every) {
        out.push(day * MINUTES_PER_DAY)
        if (out.length >= MAX_LEADS - 1) break
      }
      // The day itself, so the deadline is not silent once the ladder ends.
      out.push(0)
      return out
    }
    default:
      return []
  }
}

/**
 * Read the lead times an event actually uses.
 *
 * Documents written before tiers existed only have `remindBefore`; they keep
 * working until their next save rewrites them.
 * @param event - stored event fields.
 * @returns minutes before the start, ascending.
 */
export function eventLeads(event: { reminder?: ReminderPlan; remindBefore?: number[] }): number[] {
  if (event.reminder !== undefined) return [...reminderLeads(event.reminder)].sort((a, b) => a - b)
  const legacy = (event.remindBefore ?? []).filter((value) => Number.isFinite(value) && value >= 0)
  return [...new Set(legacy)].sort((a, b) => a - b)
}

/**
 * Best-effort tier for a legacy lead-time list.
 * @param leads - minutes before the start, any order.
 * @returns the closest tier, or `none` when there is no usable lead.
 */
export function planFromLeads(leads: number[] | undefined): ReminderPlan {
  const first = (leads ?? []).filter((value) => Number.isFinite(value) && value >= 0).sort((a, b) => a - b)[0]
  if (first === undefined) return { kind: 'none' }
  if (first < MINUTES_PER_DAY) {
    return { kind: 'short', hours: Math.floor(first / MINUTES_PER_HOUR), minutes: first % MINUTES_PER_HOUR }
  }
  const days = Math.round(first / MINUTES_PER_DAY)
  return { kind: 'mid', days: Math.min(MID_MAX_DAYS, Math.max(1, days)) }
}

/**
 * A one-line summary of a plan, for notices, tool output and the settings page.
 * @param plan - the tier.
 * @param lang - `zh` or `en`.
 * @returns human text such as `提前 2 小时` or `提前 15 天起每 3 天`.
 */
export function describePlan(plan: ReminderPlan | undefined, lang: 'zh' | 'en' = 'zh'): string {
  const zh = lang === 'zh'
  if (plan === undefined || plan.kind === 'none') return zh ? '不提醒' : 'no reminder'
  if (plan.kind === 'short') {
    return `${zh ? '提前' : 'lead'} ${describeLead((plan.hours ?? 0) * MINUTES_PER_HOUR + (plan.minutes ?? 0), lang)}`
  }
  if (plan.kind === 'mid') {
    const days = plan.days ?? 1
    return `${zh ? '提前' : 'lead'} ${days} ${zh ? '天' : days === 1 ? 'day' : 'days'}`
  }
  const every = plan.everyDays ?? 3
  const start = plan.startDays ?? MID_MAX_DAYS
  return zh
    ? `提前 ${start} 天起，每 ${every} 天一次`
    : `from ${start} days out, every ${every} day${every === 1 ? '' : 's'}`
}

/**
 * A one-line summary of a single lead time.
 * @param minutes - minutes before the start.
 * @param lang - `zh` or `en`.
 * @returns human text such as `10 分钟` or `10 minutes`.
 */
export function describeLead(minutes: number, lang: 'zh' | 'en' = 'zh'): string {
  const zh = lang === 'zh'
  if (!Number.isFinite(minutes) || minutes <= 0) return zh ? '准时' : 'at start'
  if (minutes % MINUTES_PER_DAY === 0) {
    const days = minutes / MINUTES_PER_DAY
    return zh ? `${days} 天` : `${days} day${days === 1 ? '' : 's'}`
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = minutes % MINUTES_PER_HOUR
  const parts: string[] = []
  if (hours > 0) parts.push(zh ? `${hours} 小时` : `${hours} hour${hours === 1 ? '' : 's'}`)
  if (rest > 0) parts.push(zh ? `${rest} 分钟` : `${rest} min`)
  return parts.join(zh ? ' ' : ' ')
}