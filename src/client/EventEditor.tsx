/** Create/edit dialog for one event. */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CalendarEvent, Repeat, RepeatKind } from '../types.js'
import { useT, language } from './i18n.js'

/** Palette offered to the user. */
export const COLORS: Record<string, string> = {
  blue: '#4d6bfe',
  green: '#22a06b',
  amber: '#d98a00',
  rose: '#e2557b',
  violet: '#8b5cf6',
  slate: '#64748b',
}

/** Lead times offered as checkboxes, in minutes. */
const LEADS = [0, 5, 10, 30, 60]

/** Repeat choices in display order. */
const REPEATS: Array<{ kind: RepeatKind; label: string }> = [
  { kind: 'none', label: '不重复' },
  { kind: 'daily', label: '每天' },
  { kind: 'weekdays', label: '工作日' },
  { kind: 'weekly', label: '每周' },
  { kind: 'biweekly', label: '每两周' },
  { kind: 'monthly', label: '每月' },
]

/** Weekday keys, Monday first. */
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

/** Editable draft, all strings so inputs stay controlled. */
interface Draft {
  title: string
  date: string
  startTime: string
  endTime: string
  allDay: boolean
  location: string
  note: string
  color: string
  leads: number[]
  repeat: RepeatKind
  weekdays: number[]
  until: string
}

/** Split a stored stamp into the three inputs the form edits. */
function split(stamp: string): { date: string; time: string } {
  return { date: stamp.slice(0, 10), time: stamp.length >= 16 ? stamp.slice(11, 16) : '09:00' }
}

/**
 * Build the initial draft for a new or existing event.
 * @param initial - event being edited, or null for a fresh one.
 * @param day - default day for a fresh event.
 * @returns the draft.
 */
function draftOf(initial: CalendarEvent | null, day: Date): Draft {
  if (initial === null) {
    return {
      title: '',
      date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`,
      startTime: '09:00',
      endTime: '10:00',
      allDay: false,
      location: '',
      note: '',
      color: 'blue',
      leads: [10],
      repeat: 'none',
      weekdays: [],
      until: '',
    }
  }
  const start = split(initial.start)
  const end = split(initial.end)
  const repeat = initial.repeat ?? { kind: 'none' as const }
  return {
    title: initial.title,
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    allDay: initial.allDay,
    location: initial.location ?? '',
    note: initial.note ?? '',
    color: initial.color ?? 'blue',
    leads: initial.remindBefore ?? [],
    repeat: repeat.kind,
    weekdays: repeat.weekdays ?? [],
    until: repeat.until ?? '',
  }
}

/** Props of the editor. */
interface EditorProps {
  initial: CalendarEvent | null
  day: Date
  /** Default lead time applied to a fresh event. */
  defaultLead?: number
  onCancel(): void
  onSave(event: Partial<CalendarEvent>): void
  onDelete?(id: string): void
}

/**
 * Render the modal editor.
 * @param props - initial value and callbacks.
 * @returns the dialog.
 */
export function EventEditor({ initial, day, defaultLead = 10, onCancel, onSave, onDelete }: EditorProps) {
  const t = useT()
  const [draft, setDraft] = useState<Draft>(() => {
    const base = draftOf(initial, day)
    return initial === null ? { ...base, leads: [defaultLead] } : base
  })
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    const onKey = (keyEvent: KeyboardEvent): void => {
      if (keyEvent.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const patch = (next: Partial<Draft>): void => setDraft((current) => ({ ...current, ...next }))

  const repeatNeedsWeekdays = draft.repeat === 'weekly' || draft.repeat === 'biweekly'
  const weekdayLabels = language() === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : WEEKDAYS
  const effectiveWeekdays = useMemo(() => {
    if (draft.weekdays.length > 0) return draft.weekdays
    if (draft.date === '') return []
    const d = new Date(`${draft.date}T00:00`)
    return [d.getDay() === 0 ? 7 : d.getDay()]
  }, [draft.weekdays, draft.date])

  const submit = (): void => {
    if (draft.title.trim() === '') {
      setError(t('请填写标题'))
      return
    }
    const start = `${draft.date}T${draft.allDay ? '00:00' : draft.startTime}`
    const end = `${draft.date}T${draft.allDay ? '23:59' : draft.endTime}`
    if (end < start) {
      setError(t('结束时间不能早于开始时间'))
      return
    }
    const repeat: Repeat = { kind: draft.repeat }
    if (repeatNeedsWeekdays) repeat.weekdays = effectiveWeekdays
    if (draft.until !== '') repeat.until = draft.until
    onSave({
      ...(initial ?? {}),
      title: draft.title.trim(),
      start,
      end,
      allDay: draft.allDay,
      location: draft.location.trim() === '' ? undefined : draft.location.trim(),
      note: draft.note.trim() === '' ? undefined : draft.note,
      color: draft.color,
      remindBefore: draft.leads,
      repeat,
      source: initial?.source ?? 'manual',
    })
  }

  return (
    <div className="dshc-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="dshc-modal" role="dialog" aria-modal="true" aria-label={initial === null ? t('新建日程') : t('编辑日程')}>
        <header className="dshc-modal-head">
          <strong>{initial === null ? t('新建日程') : t('编辑日程')}</strong>
          <button type="button" className="dshc-icon-btn" onClick={onCancel} aria-label={t('关闭')}>
            ✕
          </button>
        </header>
        <div className="dshc-modal-body">
          <label className="dshc-field">
            <span>{t('标题')}</span>
            <input
              ref={titleRef}
              type="text"
              value={draft.title}
              placeholder={t('例如：高等数学第 3 章复习')}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </label>
          <div className="dshc-row">
            <label className="dshc-field">
              <span>{t('日期')}</span>
              <input type="date" value={draft.date} onChange={(e) => patch({ date: e.target.value })} />
            </label>
            <label className="dshc-field dshc-check">
              <input type="checkbox" checked={draft.allDay} onChange={(e) => patch({ allDay: e.target.checked })} />
              <span>{t('全天')}</span>
            </label>
          </div>
          {draft.allDay ? null : (
            <div className="dshc-row">
              <label className="dshc-field">
                <span>{t('开始')}</span>
                <input type="time" value={draft.startTime} onChange={(e) => patch({ startTime: e.target.value })} />
              </label>
              <label className="dshc-field">
                <span>{t('结束')}</span>
                <input type="time" value={draft.endTime} onChange={(e) => patch({ endTime: e.target.value })} />
              </label>
            </div>
          )}
          <div className="dshc-row">
            <label className="dshc-field">
              <span>{t('地点')}</span>
              <input type="text" value={draft.location} placeholder={t('选填')} onChange={(e) => patch({ location: e.target.value })} />
            </label>
          </div>
          <label className="dshc-field">
            <span>{t('备注')}</span>
            <textarea rows={2} value={draft.note} placeholder={t('选填')} onChange={(e) => patch({ note: e.target.value })} />
          </label>
          <div className="dshc-field">
            <span>{t('提前提醒')}</span>
            <div className="dshc-chips">
              {LEADS.map((lead) => (
                <button
                  key={lead}
                  type="button"
                  className={`dshc-chip${draft.leads.includes(lead) ? ' is-on' : ''}`}
                  aria-pressed={draft.leads.includes(lead)}
                  onClick={() =>
                    patch({
                      leads: draft.leads.includes(lead) ? draft.leads.filter((v) => v !== lead) : [...draft.leads, lead].sort((a, b) => a - b),
                    })
                  }
                >
                  {lead === 0 ? t('准时') : t('{n} 分钟', { n: lead })}
                </button>
              ))}
            </div>
          </div>
          <div className="dshc-row">
            <label className="dshc-field">
              <span>{t('重复')}</span>
              <select value={draft.repeat} onChange={(e) => patch({ repeat: e.target.value as RepeatKind })}>
                {REPEATS.map((option) => (
                  <option key={option.kind} value={option.kind}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            </label>
            <label className="dshc-field">
              <span>{t('重复截止')}</span>
              <input type="date" value={draft.until} onChange={(e) => patch({ until: e.target.value })} />
            </label>
          </div>
          {repeatNeedsWeekdays ? (
            <div className="dshc-field">
              <span>{t('星期')}</span>
              <div className="dshc-chips">
                {weekdayLabels.map((label, index) => {
                  const value = index + 1
                  const on = effectiveWeekdays.includes(value)
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`dshc-chip${on ? ' is-on' : ''}`}
                      aria-pressed={on}
                      onClick={() =>
                        patch({
                          weekdays: on
                            ? effectiveWeekdays.filter((v) => v !== value)
                            : [...effectiveWeekdays, value].sort((a, b) => a - b),
                        })
                      }
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
          <div className="dshc-field">
            <span>{t('颜色')}</span>
            <div className="dshc-chips">
              {Object.entries(COLORS).map(([key, hex]) => (
                <button
                  key={key}
                  type="button"
                  className={`dshc-swatch${draft.color === key ? ' is-on' : ''}`}
                  style={{ background: hex }}
                  aria-label={key}
                  aria-pressed={draft.color === key}
                  onClick={() => patch({ color: key })}
                />
              ))}
            </div>
          </div>
          {error !== null ? <p className="dshc-error">{error}</p> : null}
        </div>
        <footer className="dshc-modal-foot">
          {initial !== null && onDelete !== undefined ? (
            <button type="button" className="dshc-btn is-danger" onClick={() => onDelete(initial.id)}>
              {t('删除')}
            </button>
          ) : null}
          <span style={{ marginLeft: 'auto' }} />
          <button type="button" className="dshc-btn" onClick={onCancel}>
            {t('取消')}
          </button>
          <button type="button" className="dshc-btn is-primary" onClick={submit}>
            {t('保存')}
          </button>
        </footer>
      </div>
    </div>
  )
}
