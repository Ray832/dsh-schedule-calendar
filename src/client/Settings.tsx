/** Settings drawer: timetable switch, term bells, reminder policy. */

import { useEffect, useState } from 'react'
import type { CalendarSettings, CalendarState, Period, Term } from '../types.js'
import { call } from './api.js'
import { useT } from './i18n.js'
import { ReminderField } from './ReminderField.js'
import { downloadText, pickTextFile, stampedName } from './io.js'
import { ensureNotificationPermission } from './NoticeHost.js'

/** Props of the drawer. */
interface Props {
  state: CalendarState
  onClose(): void
  onSettings(patch: Partial<CalendarSettings>): Promise<unknown> | void
  onTerm(term: Partial<Term>): Promise<unknown> | void
  onReload(): Promise<unknown> | void
}

/** Whether the environment can raise an operating-system notification. */
function notificationState(): 'ok' | 'denied' | 'unsupported' {
  try {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission === 'granted' ? 'ok' : Notification.permission === 'denied' ? 'denied' : 'unsupported'
  } catch {
    return 'unsupported'
  }
}

/**
 * Render the settings drawer.
 * @param props - document and save callbacks.
 * @returns the drawer.
 */
export function SettingsPanel({ state, onClose, onSettings, onTerm, onReload }: Props) {
  const t = useT()
  const [term, setTerm] = useState<Term>(() => ({ ...state.term, periods: state.term.periods.map((p) => ({ ...p })) }))
  const [notifyAsked, setNotifyAsked] = useState(false)
  const [ioBusy, setIoBusy] = useState(false)
  const [ioMessage, setIoMessage] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const patchPeriod = (index: number, next: Partial<Period>): void =>
    setTerm((current) => ({ ...current, periods: current.periods.map((p) => (p.index === index ? { ...p, ...next } : p)) }))

  const addPeriod = (): void =>
    setTerm((current) => ({
      ...current,
      periods: [...current.periods, { index: (current.periods.at(-1)?.index ?? 0) + 1, start: '08:00', end: '08:45' }],
    }))

  const removePeriod = (index: number): void =>
    setTerm((current) => ({ ...current, periods: current.periods.filter((p) => p.index !== index) }))

  return (
    <div className="dshc-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dshc-modal" role="dialog" aria-modal="true" aria-label={t('设置')}>
        <header className="dshc-modal-head">
          <strong>{t('设置')}</strong>
          <button type="button" className="dshc-icon-btn" onClick={onClose} aria-label={t('关闭')}>
            ✕
          </button>
        </header>
        <div className="dshc-modal-body">
          <section className="dshc-section">
            <h3>{t('课表')}</h3>
            <label className="dshc-switch">
              <input
                type="checkbox"
                checked={state.settings.timetableEnabled}
                onChange={(e) => void onSettings({ timetableEnabled: e.target.checked })}
              />
              <span>{t('启用课表（关闭后左侧栏不再显示课表页）')}</span>
            </label>
            <div className="dshc-row">
              <label className="dshc-field">
                <span>{t('开学第一周的周一')}</span>
                <input
                  type="date"
                  value={term.startDate}
                  onChange={(e) => setTerm({ ...term, startDate: e.target.value })}
                  onBlur={() => void onTerm({ startDate: term.startDate })}
                />
              </label>
              <label className="dshc-field">
                <span>{t('总周数')}</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={term.totalWeeks}
                  onChange={(e) => setTerm({ ...term, totalWeeks: Number(e.target.value) })}
                  onBlur={() => void onTerm({ totalWeeks: term.totalWeeks })}
                />
              </label>
            </div>
            <div className="dshc-field">
              <span>{t('节次时间')}</span>
              <div className="dshc-periods">
                {term.periods.map((period) => (
                  <div key={period.index} className="dshc-period">
                    <span className="dshc-period-index">{t('第 {n} 节', { n: period.index })}</span>
                    <input type="time" value={period.start} onChange={(e) => patchPeriod(period.index, { start: e.target.value })} />
                    <span>–</span>
                    <input type="time" value={period.end} onChange={(e) => patchPeriod(period.index, { end: e.target.value })} />
                    <button type="button" className="dshc-icon-btn" aria-label={t('删除第 {n} 节', { n: period.index })} onClick={() => removePeriod(period.index)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="dshc-chips">
                <button type="button" className="dshc-chip" onClick={addPeriod}>{t('+ 增加一节')}</button>
                <button type="button" className="dshc-btn is-primary" onClick={() => void onTerm(term)}>{t('保存节次')}</button>
              </div>
            </div>
          </section>

          <section className="dshc-section">
            <h3>{t('提醒')}</h3>
            <label className="dshc-switch">
              <input
                type="checkbox"
                checked={state.settings.soundEnabled}
                onChange={(e) => void onSettings({ soundEnabled: e.target.checked })}
              />
              <span>{t('提醒时播放提示音')}</span>
            </label>
            <label className="dshc-switch">
              <input
                type="checkbox"
                checked={state.settings.systemNotification}
                onChange={async (e) => {
                  const on = e.target.checked
                  if (on && !notifyAsked) {
                    setNotifyAsked(true)
                    await ensureNotificationPermission()
                  }
                  void onSettings({ systemNotification: on })
                }}
              />
              <span>{t('同时发系统通知（DSH 最小化时也能看到）')}</span>
            </label>
            {notificationState() !== 'ok' ? (
              <p className="dshc-hint">{t('当前环境没有系统通知权限，到点仍会弹出应用内提醒。')}</p>
            ) : null}
            <label className="dshc-switch">
              <input
                type="checkbox"
                checked={state.settings.quietHours.enabled}
                onChange={(e) => void onSettings({ quietHours: { ...state.settings.quietHours, enabled: e.target.checked } })}
              />
              <span>{t('免打扰时段')}</span>
            </label>
            {state.settings.quietHours.enabled ? (
              <div className="dshc-row">
                <label className="dshc-field">
                  <span>{t('从')}</span>
                  <input
                    type="time"
                    value={state.settings.quietHours.from}
                    onChange={(e) => void onSettings({ quietHours: { ...state.settings.quietHours, from: e.target.value } })}
                  />
                </label>
                <label className="dshc-field">
                  <span>{t('到')}</span>
                  <input
                    type="time"
                    value={state.settings.quietHours.to}
                    onChange={(e) => void onSettings({ quietHours: { ...state.settings.quietHours, to: e.target.value } })}
                  />
                </label>
              </div>
            ) : null}
          </section>

          <section className="dshc-section">
            <h3>{t('日历')}</h3>
            <div className="dshc-row">
              <label className="dshc-field">
                <span>{t('每周从')}</span>
                <select
                  value={String(state.settings.weekStart)}
                  onChange={(e) => void onSettings({ weekStart: Number(e.target.value) === 7 ? 7 : 1 })}
                >
                  <option value="1">{t('周一开始')}</option>
                  <option value="7">{t('周日开始')}</option>
                </select>
              </label>
            </div>
            <div className="dshc-field">
              <span>{t('新建日程默认提醒')}</span>
              <ReminderField
                value={state.settings.defaultReminder}
                onChange={(defaultReminder) => void onSettings({ defaultReminder })}
              />
            </div>
            <p className="dshc-hint">{t('数据文件：')}{`<DSH_HOME>/storages/dsh-schedule-calendar/calendar.json`}</p>
          </section>

          <section className="dshc-section">
            <h3>{t('数据')}</h3>
            <div className="dshc-chips">
              <button
                type="button"
                className="dshc-btn"
                disabled={ioBusy}
                onClick={async () => {
                  setIoBusy(true)
                  try {
                    const reply = await call<{ text: string; count: number }>('io.export.ics')
                    downloadText(stampedName('ics'), reply.text, 'text/calendar;charset=utf-8')
                    setIoMessage(t('已导出 {n} 条日程为 ICS', { n: reply.count }))
                  } catch (cause) {
                    setIoMessage(cause instanceof Error ? cause.message : String(cause))
                  } finally {
                    setIoBusy(false)
                  }
                }}
              >{t('导出 ICS')}</button>
              <button
                type="button"
                className="dshc-btn"
                disabled={ioBusy}
                onClick={async () => {
                  const file = await pickTextFile('.ics,.txt,text/calendar')
                  if (file === null) return
                  setIoBusy(true)
                  try {
                    const reply = await call<{ state: CalendarState; added: number; skipped: number }>('io.import.ics', { text: file.text })
                    setIoMessage(t('从 {file} 导入 {n} 条', { file: file.name, n: reply.added }) + (reply.skipped > 0 ? t('，跳过 {n} 条', { n: reply.skipped }) : ''))
                    await onReload()
                  } catch (cause) {
                    setIoMessage(cause instanceof Error ? cause.message : String(cause))
                  } finally {
                    setIoBusy(false)
                  }
                }}
              >{t('导入 ICS')}</button>
              <button
                type="button"
                className="dshc-btn"
                disabled={ioBusy}
                onClick={async () => {
                  setIoBusy(true)
                  try {
                    const reply = await call<{ json: string }>('io.backup')
                    downloadText(stampedName('json'), reply.json, 'application/json;charset=utf-8')
                    setIoMessage(t('已导出 JSON 备份'))
                  } catch (cause) {
                    setIoMessage(cause instanceof Error ? cause.message : String(cause))
                  } finally {
                    setIoBusy(false)
                  }
                }}
              >{t('导出备份')}</button>
              <button
                type="button"
                className="dshc-btn is-danger"
                disabled={ioBusy}
                onClick={async () => {
                  const file = await pickTextFile('.json,application/json')
                  if (file === null) return
                  if (!window.confirm(t('恢复备份会覆盖当前的日程、课表和目标，确定继续？'))) return
                  setIoBusy(true)
                  try {
                    await call('io.restore', { json: file.text })
                    setIoMessage(t('已从 {file} 恢复', { file: file.name }))
                    await onReload()
                  } catch (cause) {
                    setIoMessage(cause instanceof Error ? cause.message : String(cause))
                  } finally {
                    setIoBusy(false)
                  }
                }}
              >{t('恢复备份')}</button>
            </div>
            {ioMessage !== null ? <p className="dshc-hint">{ioMessage}</p> : null}
          </section>
        </div>
        <footer className="dshc-modal-foot">
          <button type="button" className="dshc-btn is-primary" style={{ marginLeft: 'auto' }} onClick={onClose}>{t('完成')}</button>
        </footer>
      </div>
    </div>
  )
}
