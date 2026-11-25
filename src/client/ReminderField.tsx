/**
 * Reminder tier editor.
 *
 * One control, three usages: the event modal, the settings page (as the default
 * for new events) and the notice card (when the user asks to be nudged again).
 * Keeping it a single component is what stops the three places from disagreeing
 * about what "提前 2 小时" means.
 */

import type { ReminderKind, ReminderPlan } from '../types.js'
import { LONG_INTERVALS, MID_MAX_DAYS, SHORT_MAX_HOURS, SHORT_MAX_MINUTES, describePlan } from '../remind.js'
import { language, useT } from './i18n.js'

/** The four tiers, in the order the user thinks about them. */
const KINDS: Array<{ kind: ReminderKind; label: string }> = [
  { kind: 'none', label: '不提醒' },
  { kind: 'short', label: '短期 · 当天' },
  { kind: 'mid', label: '中期 · 1-15 天' },
  { kind: 'long', label: '长期 · 每 N 天' },
]

/** Round into range, treating junk as the minimum. */
function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** Props of the tier editor. */
interface Props {
  value: ReminderPlan
  onChange(next: ReminderPlan): void
  /** Hide the tier chips; used where the caller already picked the tier. */
  compact?: boolean
}

/**
 * Render the tier editor.
 * @param props - current plan and a change handler.
 * @returns the control block.
 */
export function ReminderField({ value, onChange, compact = false }: Props) {
  const t = useT()
  const lang = language() === 'en' ? 'en' : 'zh'

  const switchKind = (kind: ReminderKind): void => {
    if (kind === value.kind) return
    if (kind === 'none') {
      onChange({ kind: 'none' })
      return
    }
    if (kind === 'short') {
      onChange({ kind: 'short', hours: value.hours ?? 0, minutes: value.minutes ?? 10 })
      return
    }
    if (kind === 'mid') {
      onChange({ kind: 'mid', days: value.days ?? 1 })
      return
    }
    onChange({ kind: 'long', startDays: value.startDays ?? MID_MAX_DAYS, everyDays: value.everyDays ?? 3 })
  }

  return (
    <div className="dshc-reminder">
      {compact ? null : (
        <div className="dshc-chips" role="group" aria-label={t('提醒档位')}>
          {KINDS.map((option) => (
            <button
              key={option.kind}
              type="button"
              className={`dshc-chip${value.kind === option.kind ? ' is-on' : ''}`}
              aria-pressed={value.kind === option.kind}
              onClick={() => switchKind(option.kind)}
            >
              {t(option.label)}
            </button>
          ))}
        </div>
      )}

      {value.kind === 'short' ? (
        <div className="dshc-remindrow">
          <span className="dshc-remindlabel">{t('提前')}</span>
          <input
            type="number"
            min={0}
            max={SHORT_MAX_HOURS}
            value={value.hours ?? 0}
            aria-label={t('小时')}
            onChange={(e) => onChange({ ...value, hours: clamp(Number(e.target.value), 0, SHORT_MAX_HOURS) })}
          />
          <span className="dshc-remindunit">{t('小时')}</span>
          <input
            type="number"
            min={0}
            max={SHORT_MAX_MINUTES}
            value={value.minutes ?? 0}
            aria-label={t('分钟')}
            onChange={(e) => onChange({ ...value, minutes: clamp(Number(e.target.value), 0, SHORT_MAX_MINUTES) })}
          />
          <span className="dshc-remindunit">{t('分钟')}</span>
        </div>
      ) : null}

      {value.kind === 'mid' ? (
        <div className="dshc-remindrow">
          <span className="dshc-remindlabel">{t('提前')}</span>
          <input
            type="number"
            min={1}
            max={MID_MAX_DAYS}
            value={value.days ?? 1}
            aria-label={t('天')}
            onChange={(e) => onChange({ ...value, days: clamp(Number(e.target.value), 1, MID_MAX_DAYS) })}
          />
          <span className="dshc-remindunit">{t('天')}</span>
        </div>
      ) : null}

      {value.kind === 'long' ? (
        <div className="dshc-remindrow">
          <span className="dshc-remindlabel">{t('提前')}</span>
          <input
            type="number"
            min={1}
            max={MID_MAX_DAYS}
            value={value.startDays ?? MID_MAX_DAYS}
            aria-label={t('天')}
            onChange={(e) => onChange({ ...value, startDays: clamp(Number(e.target.value), 1, MID_MAX_DAYS) })}
          />
          <span className="dshc-remindunit">{t('天起，每')}</span>
          <select
            value={String(value.everyDays ?? 3)}
            aria-label={t('每几天提醒一次')}
            onChange={(e) => onChange({ ...value, everyDays: Number(e.target.value) })}
          >
            {LONG_INTERVALS.map((interval) => (
              <option key={interval} value={String(interval)}>
                {interval}
              </option>
            ))}
          </select>
          <span className="dshc-remindunit">{t('天提醒一次')}</span>
        </div>
      ) : null}

      <p className="dshc-hint">{describePlan(value, lang)}</p>
    </div>
  )
}