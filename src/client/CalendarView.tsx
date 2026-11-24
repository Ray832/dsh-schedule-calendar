/** Calendar surface: month grid, week columns and a single-day agenda. */

import { useMemo, useState } from 'react'
import { expandAll, dayKey, type Occurrence } from '../repeat.js'
import type { CalendarEvent, CalendarState } from '../types.js'
import { COLORS } from './EventEditor.js'
import { addDays, clockOf, monthMatrix, monthTitle, sameDay, weekdayLabels, ymd, isoWeekday } from './dates.js'
import { useT } from './i18n.js'

/** Which layout the surface shows. */
export type ViewMode = 'month' | 'week' | 'day'

/** Props of the calendar surface. */
interface Props {
  state: CalendarState
  locale: string
  onCreate(day: Date): void
  onOpen(event: CalendarEvent): void
}

/**
 * Render the calendar surface.
 * @param props - document, locale and callbacks.
 * @returns the surface.
 */
export function CalendarView({ state, locale, onCreate, onOpen }: Props) {
  const t = useT()
  const today = useMemo(() => new Date(), [])
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  const [selected, setSelected] = useState<Date>(today)

  const range = useMemo(() => {
    if (view === 'month') {
      const weeks = monthMatrix(cursor.getFullYear(), cursor.getMonth(), state.settings.weekStart)
      const first = weeks[0]?.[0] ?? cursor
      return { from: addDays(first, -1), to: addDays(first, 43) }
    }
    if (view === 'week') {
      const start = addDays(cursor, -(state.settings.weekStart === 1 ? isoWeekday(cursor) - 1 : cursor.getDay()))
      return { from: addDays(start, -1), to: addDays(start, 8) }
    }
    const midnight = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
    return { from: addDays(midnight, -1), to: addDays(midnight, 2) }
  }, [view, cursor, state.settings.weekStart])

  const byDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>()
    for (const occurrence of expandAll(state.events, range.from, range.to)) {
      const key = dayKey(occurrence.start)
      const list = map.get(key)
      if (list === undefined) map.set(key, [occurrence])
      else list.push(occurrence)
    }
    return map
  }, [state.events, range])

  const step = (delta: number): void => {
    if (view === 'month') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))
    else if (view === 'week') setCursor(addDays(cursor, delta * 7))
    else setCursor(addDays(cursor, delta))
  }

  const heading = useMemo(() => {
    if (view === 'month') return monthTitle(cursor.getFullYear(), cursor.getMonth(), locale)
    if (view === 'week') {
      const start = addDays(cursor, -(state.settings.weekStart === 1 ? isoWeekday(cursor) - 1 : cursor.getDay()))
      const end = addDays(start, 6)
      const fmt = (day: Date) => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(day)
      return `${fmt(start)} – ${fmt(end)}`
    }
    return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', weekday: 'long' }).format(cursor)
  }, [view, cursor, locale, state.settings.weekStart])

  return (
    <div className="dshc-surface">
      <div className="dshc-toolbar">
        <button type="button" className="dshc-icon-btn" aria-label={t('上一页')} onClick={() => step(-1)}>
          ‹
        </button>
        <button type="button" className="dshc-btn" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), today.getDate()))}>
          {t('今天')}
        </button>
        <button type="button" className="dshc-icon-btn" aria-label={t('下一页')} onClick={() => step(1)}>
          ›
        </button>
        <strong className="dshc-heading">{heading}</strong>
        <div className="dshc-seg" role="group" aria-label={t('视图')}>
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}>
              {mode === 'month' ? t('月') : mode === 'week' ? t('周') : t('日')}
            </button>
          ))}
        </div>
        <button type="button" className="dshc-btn is-primary" onClick={() => onCreate(view === 'day' ? cursor : selected)}>
          + {t('新建')}
        </button>
      </div>

      {view === 'month' ? (
        <MonthGrid
          cursor={cursor}
          weekdayStart={state.settings.weekStart}
          locale={locale}
          byDay={byDay}
          selected={selected}
          today={today}
          onSelect={setSelected}
          onCreate={onCreate}
          onOpen={onOpen}
        />
      ) : null}

      {view === 'week' ? (
        <div className="dshc-week">
          {Array.from({ length: 7 }, (_, index) => {
            const start = addDays(cursor, -(state.settings.weekStart === 1 ? isoWeekday(cursor) - 1 : cursor.getDay()))
            const day = addDays(start, index)
            const list = byDay.get(ymd(day)) ?? []
            return (
              <div key={ymd(day)} className={`dshc-weekcol${sameDay(day, today) ? ' is-today' : ''}`}>
                <button type="button" className="dshc-weekhead" onClick={() => onCreate(day)}>
                  <span>{weekdayLabels(state.settings.weekStart, locale)[index]}</span>
                  <strong>{day.getDate()}</strong>
                </button>
                <div className="dshc-weeklist">
                  {list.map((occurrence) => (
                    <Chip key={occurrence.key} occurrence={occurrence} onOpen={onOpen} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {view === 'day' ? (
        <div className="dshc-agenda">
          {(byDay.get(ymd(cursor)) ?? []).length === 0 ? (
            <div className="dshc-empty">
              <strong>{t('这一天还没有安排')}</strong>
              <span>{t('点右上角「新建」添加一条，或在对话框里直接说「明天下午三点组会」。')}</span>
            </div>
          ) : (
            (byDay.get(ymd(cursor)) ?? []).map((occurrence) => (
              <button key={occurrence.key} type="button" className="dshc-agendarow" onClick={() => onOpen(occurrence.event)}>
                <span className="dshc-agendatime">
                  {occurrence.event.allDay ? t('全天') : clockOf(occurrence.event.start)}
                </span>
                <span className="dshc-dot" style={{ background: COLORS[occurrence.event.color ?? 'blue'] ?? COLORS.blue }} />
                <span className={`dshc-agendatitle${occurrence.event.done === true ? ' is-done' : ''}`}>{occurrence.event.title}</span>
                {occurrence.event.location !== undefined ? <span className="dshc-agendaloc">{occurrence.event.location}</span> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

/** Props of the month grid. */
interface MonthProps {
  cursor: Date
  weekdayStart: 1 | 7
  locale: string
  byDay: Map<string, Occurrence[]>
  selected: Date
  today: Date
  onSelect(day: Date): void
  onCreate(day: Date): void
  onOpen(event: CalendarEvent): void
}

/**
 * Render the month grid.
 * @param props - grid inputs.
 * @returns the grid.
 */
function MonthGrid({ cursor, weekdayStart, locale, byDay, selected, today, onSelect, onCreate, onOpen }: MonthProps) {
  const weeks = useMemo(() => monthMatrix(cursor.getFullYear(), cursor.getMonth(), weekdayStart), [cursor, weekdayStart])
  const labels = useMemo(() => weekdayLabels(weekdayStart, locale), [weekdayStart, locale])
  return (
    <div className="dshc-grid">
      {labels.map((label) => (
        <div key={label} className="dshc-dow">
          {label}
        </div>
      ))}
      {weeks.flat().map((day) => {
        const outside = day.getMonth() !== cursor.getMonth()
        const list = byDay.get(ymd(day)) ?? []
        return (
          <div
            key={ymd(day)}
            className={`dshc-day${outside ? ' is-out' : ''}${sameDay(day, selected) ? ' is-selected' : ''}`}
            onClick={() => onSelect(day)}
            onDoubleClick={() => onCreate(day)}
            role="gridcell"
          >
            <div className={`dshc-daynum${sameDay(day, today) ? ' is-today' : ''}`}>{day.getDate()}</div>
            <div className="dshc-daylist">
              {list.slice(0, 3).map((occurrence) => (
                <Chip key={occurrence.key} occurrence={occurrence} onOpen={onOpen} />
              ))}
              {list.length > 3 ? <span className="dshc-more">+{list.length - 3}</span> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * One event pill.
 * @param props - occurrence and opener.
 * @returns the pill.
 */
function Chip({ occurrence, onOpen }: { occurrence: Occurrence; onOpen(event: CalendarEvent): void }) {
  const { event } = occurrence
  const color = COLORS[event.color ?? 'blue'] ?? COLORS.blue
  return (
    <button
      type="button"
      className={`dshc-chip-event${event.done === true ? ' is-done' : ''}`}
      style={{ borderColor: color, background: `${color}1f` }}
      title={`${event.title}${event.location !== undefined ? ` · ${event.location}` : ''}`}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation()
        onOpen(event)
      }}
    >
      {event.allDay ? null : <span className="dshc-chiptime">{clockOf(event.start)}</span>}
      <span className="dshc-chiptitle">{event.title}</span>
    </button>
  )
}
