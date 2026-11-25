/** The plugin's main-area page: calendar, timetable and long-term plan. */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CalendarEvent, CalendarSettings, CalendarState, Course, Plan, Term } from '../types.js'
import { call } from './api.js'
import { CalendarView } from './CalendarView.js'
import type { ParsedCourse } from './csv.js'
import { EventEditor } from './EventEditor.js'
import { useT } from './i18n.js'
import { PlanPage } from './Plan.js'
import { QuickAdd } from './QuickAdd.js'
import { SettingsPanel } from './Settings.js'
import { Timetable } from './Timetable.js'

type Tab = 'calendar' | 'timetable' | 'plan'

/** Locale DSH runs the page in, for date formatting. */
function uiLocale(): string {
  try {
    return document.documentElement.lang || navigator.language || 'zh-CN'
  } catch {
    return 'zh-CN'
  }
}

/**
 * Render the panel shell and its tabs.
 * @returns the page.
 */
export function CalendarPage() {
  const [tab, setTab] = useState<Tab>('calendar')
  const [state, setState] = useState<CalendarState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editor, setEditor] = useState<{ event: CalendarEvent | null; day: Date } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const locale = useMemo(uiLocale, [])
  const t = useT()

  const reload = useCallback(async () => {
    try {
      setState(await call<CalendarState>('state.get'))
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // The panel is not the only writer any more: the assistant can add events
  // through `calendar_add` while this page is open. Poll the cheap revision
  // stamp and reload when it moves, so a chat-side write shows up here.
  useEffect(() => {
    let alive = true
    let seen = -1
    const check = async (): Promise<void> => {
      try {
        const { revision } = await call<{ revision: number }>('state.rev')
        if (!alive) return
        if (seen === -1) {
          seen = revision
          return
        }
        if (revision !== seen) {
          seen = revision
          await reload()
        }
      } catch {
        /* an unreachable host is reported by the visible error state */
      }
    }
    void check()
    const timer = setInterval(() => void check(), 6000)
    const onFocus = (): void => void check()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [reload])

  /** Run a mutating host call and adopt the document it answers with. */
  const mutate = useCallback(async (method: string, body: unknown): Promise<boolean> => {
    setBusy(true)
    try {
      setState(await call<CalendarState>(method, body))
      setError(null)
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const saveEvent = useCallback(
    async (event: Partial<CalendarEvent>) => {
      if (await mutate('event.save', { event })) setEditor(null)
    },
    [mutate],
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      if (await mutate('event.delete', { id })) setEditor(null)
    },
    [mutate],
  )

  const importEvents = useCallback(
    async (events: CalendarEvent[]) => {
      await mutate('event.import', { events })
    },
    [mutate],
  )

  const saveSettings = useCallback(
    async (patch: Partial<CalendarSettings>) => {
      await mutate('settings.update', { patch })
    },
    [mutate],
  )

  const saveTerm = useCallback(
    async (term: Partial<Term>) => {
      await mutate('term.update', { term })
    },
    [mutate],
  )

  const saveCourse = useCallback(
    async (course: Partial<Course>) => {
      await mutate('course.save', { course })
    },
    [mutate],
  )

  const deleteCourse = useCallback(
    async (id: string) => {
      await mutate('course.delete', { id })
    },
    [mutate],
  )

  const importCourses = useCallback(
    async (courses: ParsedCourse[], replace: boolean) => {
      await mutate('course.import', { courses, replace })
    },
    [mutate],
  )

  const parseTimetable = useCallback(async (text: string) => await call<{ courses: ParsedCourse[]; model: string }>('parse.timetable', { text }), [])

  const savePlan = useCallback(
    async (plan: Partial<Plan>) => {
      await mutate('plan.save', { plan })
    },
    [mutate],
  )

  const deletePlan = useCallback(
    async (id: string) => {
      await mutate('plan.delete', { id })
    },
    [mutate],
  )

  const toggleMilestone = useCallback(
    async (planId: string, milestoneId: string, done: boolean) => {
      await mutate('plan.milestone', { planId, milestoneId, done })
    },
    [mutate],
  )

  const timetableOn = state?.settings.timetableEnabled === true
  const showTimetableTab = timetableOn || tab === 'timetable'

  return (
    <div className="dshc-root">
      <header className="dshc-head">
        <h1 className="dshc-title">{t('日程')}</h1>
        <div className="dshc-tabs" role="tablist" aria-label={t('日程')}>
          <button type="button" className="dshc-tab" role="tab" aria-selected={tab === 'calendar'} onClick={() => setTab('calendar')}>
            {t('日历')}
          </button>
          {showTimetableTab ? (
            <button type="button" className="dshc-tab" role="tab" aria-selected={tab === 'timetable'} onClick={() => setTab('timetable')}>
              {t('课表')}
            </button>
          ) : null}
          <button type="button" className="dshc-tab" role="tab" aria-selected={tab === 'plan'} onClick={() => setTab('plan')}>
            {t('规划')}
          </button>
        </div>
        <button type="button" className="dshc-icon-btn" aria-label={t('设置')} title={t('设置')} onClick={() => setSettingsOpen(true)}>
          ⚙
        </button>
      </header>

      <div className="dshc-body">
        {error !== null ? <p className="dshc-error">{error}</p> : null}
        {state === null && error === null ? <p className="dshc-empty">{t('载入中…')}</p> : null}

        {state !== null && tab === 'calendar' ? (
          <>
            <QuickAdd onImport={(events) => void importEvents(events)} />
            <CalendarView
              state={state}
              locale={locale}
              onCreate={(day) => setEditor({ event: null, day })}
              onOpen={(event) => setEditor({ event, day: new Date() })}
            />
          </>
        ) : null}

        {state !== null && tab === 'timetable' ? (
          <Timetable
            state={state}
            onSaveCourse={(course) => void saveCourse(course)}
            onDeleteCourse={(id) => void deleteCourse(id)}
            onImport={(courses, replace) => void importCourses(courses, replace)}
            onAiParse={parseTimetable}
            onEnable={() => void saveSettings({ timetableEnabled: true })}
          />
        ) : null}

        {state !== null && tab === 'plan' ? (
          <PlanPage
            state={state}
            onSave={(plan) => void savePlan(plan)}
            onDelete={(id) => void deletePlan(id)}
            onToggle={(planId, milestoneId, done) => void toggleMilestone(planId, milestoneId, done)}
          />
        ) : null}
      </div>

      {busy ? <div className="dshc-busy" role="status" aria-live="polite" /> : null}

      {editor !== null ? (
        <EventEditor
          initial={editor.event}
          day={editor.day}
          defaultLead={state?.settings.defaultRemindBefore ?? 10}
          onCancel={() => setEditor(null)}
          onSave={saveEvent}
          onDelete={deleteEvent}
        />
      ) : null}

      {settingsOpen && state !== null ? (
        <SettingsPanel
          state={state}
          onClose={() => setSettingsOpen(false)}
          onSettings={(patch) => saveSettings(patch)}
          onTerm={(term) => saveTerm(term)}
          onReload={reload}
        />
      ) : null}
    </div>
  )
}
