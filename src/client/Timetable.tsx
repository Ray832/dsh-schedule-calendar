/** Timetable page: term weeks, bell periods and the course grid. */

import { useMemo, useRef, useState } from 'react'
import type { CalendarState, Course, Parity, Period } from '../types.js'
import { CSV_TEMPLATE, parseCourseCsv, type ParsedCourse } from './csv.js'
import { COLORS } from './EventEditor.js'
import { addDays, parseLocal } from './dates.js'
import { language, useT } from './i18n.js'

/** Weekday short names. */
const WEEKDAY_NAMES = ['一', '二', '三', '四', '五', '六', '日']

/** Parity labels. */
const PARITIES: Array<{ value: Parity; label: string }> = [
  { value: 'all', label: '每周' },
  { value: 'odd', label: '单周' },
  { value: 'even', label: '双周' },
]

/**
 * Teaching week containing a date.
 * @param termStart - Monday of week 1, `YYYY-MM-DD`.
 * @param date - the day to place.
 * @returns the 1-based week number, possibly outside the term.
 */
export function weekOf(termStart: string, date: Date): number {
  const start = parseLocal(termStart)
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((day.getTime() - start.getTime()) / 86_400_000)
  return Math.floor(diff / 7) + 1
}

/** Whether a course runs in a given week. */
function runsInWeek(course: Course, week: number): boolean {
  if (week < course.weeks.from || week > course.weeks.to) return false
  if (course.parity === 'odd' && week % 2 === 0) return false
  if (course.parity === 'even' && week % 2 === 1) return false
  return true
}

/** Props of the timetable page. */
interface Props {
  state: CalendarState
  onSaveCourse(course: Partial<Course>): void
  onDeleteCourse(id: string): void
  onImport(courses: ParsedCourse[], replace: boolean): void
  onAiParse(text: string): Promise<{ courses: ParsedCourse[]; model: string }>
  onEnable(): void
}

/**
 * Render the timetable.
 * @param props - document and callbacks.
 * @returns the page body.
 */
export function Timetable({ state, onSaveCourse, onDeleteCourse, onImport, onAiParse, onEnable }: Props) {
  const today = useMemo(() => new Date(), [])
  const t = useT()
  const wd = (day: number): string =>
    language() === 'en'
      ? (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day - 1] ?? 'D' + day)
      : '周' + WEEKDAY_NAMES[day - 1]
  const currentWeek = weekOf(state.term.startDate, today)
  const [week, setWeek] = useState(() => Math.min(Math.max(1, currentWeek), state.term.totalWeeks))
  const [editing, setEditing] = useState<{ course: Course | null; weekday: number; period: number } | null>(null)
  const [importing, setImporting] = useState(false)

  if (!state.settings.timetableEnabled) {
    return (
      <div className="dshc-empty">
        <strong>{t('课表未启用')}</strong>
        <span>{t('启用后可以按学期周次查看课程，并支持粘贴文本、手动录入或导入 CSV。')}</span>
        <button type="button" className="dshc-btn is-primary" onClick={onEnable}>
          {t('启用课表')}
        </button>
      </div>
    )
  }

  const periods = state.term.periods
  const days = state.term.days.length > 0 ? state.term.days : [1, 2, 3, 4, 5, 6, 7]
  const visible = state.courses.filter((course) => runsInWeek(course, week))

  return (
    <div className="dshc-surface">
      <div className="dshc-toolbar">
        <button type="button" className="dshc-icon-btn" aria-label={t('上一周')} onClick={() => setWeek((w) => Math.max(1, w - 1))}>
          ‹
        </button>
        <button type="button" className="dshc-btn" onClick={() => setWeek(Math.min(Math.max(1, currentWeek), state.term.totalWeeks))}>
          {t('本周')}
        </button>
        <button type="button" className="dshc-icon-btn" aria-label={t('下一周')} onClick={() => setWeek((w) => Math.min(state.term.totalWeeks, w + 1))}>
          ›
        </button>
        <strong className="dshc-heading">{t('第 {n} 周', { n: week })}</strong>
        {currentWeek !== week && currentWeek >= 1 && currentWeek <= state.term.totalWeeks ? (
          <span className="dshc-hint">{t('（本周是第 {n} 周）', { n: currentWeek })}</span>
        ) : null}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button type="button" className="dshc-btn" onClick={() => setImporting(true)}>
            {t('导入')}
          </button>
          <button
            type="button"
            className="dshc-btn is-primary"
            onClick={() => setEditing({ course: null, weekday: days[0] ?? 1, period: periods[0]?.index ?? 1 })}
          >
            + {t('添加课程')}
          </button>
        </div>
      </div>

      {periods.length === 0 ? (
        <div className="dshc-empty">
          <strong>{t('还没有节次时间')}</strong>
          <span>{t('先到设置里配置每天第几节几点上课，课表格子才能排出来。')}</span>
        </div>
      ) : (
        <div className="dshc-tt" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div className="dshc-tt-corner">{t('节次')}</div>
          {days.map((day) => (
            <div key={day} className="dshc-tt-head">
              {wd(day)}
            </div>
          ))}

          {periods.map((period, rowIndex) => (
            <div key={`r${period.index}`} style={{ display: 'contents' }}>
              <div className="dshc-tt-time">
                <strong>{period.index}</strong>
                <span>
                  {period.start}
                  <br />
                  {period.end}
                </span>
              </div>
              {days.map((day) => (
                <button
                  key={`c${period.index}-${day}`}
                  type="button"
                  className="dshc-tt-cell"
                  style={{ gridRow: rowIndex + 2, gridColumn: days.indexOf(day) + 2 }}
                  aria-label={t('第 {n} 节', { n: period.index }) + ' ' + wd(day)}
                  onClick={() => setEditing({ course: null, weekday: day, period: period.index })}
                />
              ))}
            </div>
          ))}

          {visible.map((course) => {
            const first = Math.min(...course.periods)
            const rowIndex = periods.findIndex((period) => period.index === first)
            if (rowIndex < 0) return null
            const span = Math.max(1, course.periods.length)
            const color = COLORS[course.color ?? 'blue'] ?? COLORS.blue
            return (
              <button
                key={course.id}
                type="button"
                className="dshc-tt-course"
                style={{
                  gridRow: `${rowIndex + 2} / span ${span}`,
                  gridColumn: days.indexOf(course.weekday) + 2,
                  borderColor: color,
                  background: `${color}1f`,
                }}
                onClick={() => setEditing({ course, weekday: course.weekday, period: first })}
              >
                <strong>{course.name}</strong>
                {course.location !== undefined ? <span>{course.location}</span> : null}
                {course.teacher !== undefined ? <span>{course.teacher}</span> : null}
              </button>
            )
          })}
        </div>
      )}

      <p className="dshc-hint">
        {t('本学期共 {total} 周，已录入 {courses} 门课程，本周显示 {visible} 门。', { total: state.term.totalWeeks, courses: state.courses.length, visible: visible.length })}
      </p>

      {editing !== null ? (
        <CourseEditor
          initial={editing.course}
          weekday={editing.weekday}
          period={editing.period}
          term={state.term}
          onClose={() => setEditing(null)}
          onSave={(course) => {
            onSaveCourse(course)
            setEditing(null)
          }}
          onDelete={(id) => {
            onDeleteCourse(id)
            setEditing(null)
          }}
        />
      ) : null}

      {importing ? (
        <ImportDialog
          onClose={() => setImporting(false)}
          onAiParse={onAiParse}
          onImport={(courses, replace) => {
            onImport(courses, replace)
            setImporting(false)
          }}
        />
      ) : null}
    </div>
  )
}

/** Props of the course editor. */
interface EditorProps {
  initial: Course | null
  weekday: number
  period: number
  term: CalendarState['term']
  onClose(): void
  onSave(course: Partial<Course>): void
  onDelete(id: string): void
}

/**
 * Render the course editor.
 * @param props - draft seed and callbacks.
 * @returns the dialog.
 */
function CourseEditor({ initial, weekday, period, term, onClose, onSave, onDelete }: EditorProps) {
  const t = useT()
  const wd = (day: number): string =>
    language() === 'en'
      ? (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day - 1] ?? 'D' + day)
      : '周' + WEEKDAY_NAMES[day - 1]
  const [draft, setDraft] = useState({
    name: initial?.name ?? '',
    teacher: initial?.teacher ?? '',
    location: initial?.location ?? '',
    weekday: initial?.weekday ?? weekday,
    from: initial?.periods[0] ?? period,
    to: initial?.periods.at(-1) ?? period,
    weekFrom: initial?.weeks.from ?? 1,
    weekTo: initial?.weeks.to ?? term.totalWeeks,
    parity: (initial?.parity ?? 'all') as Parity,
    color: initial?.color ?? 'blue',
  })
  const [error, setError] = useState<string | null>(null)
  const patch = (next: Partial<typeof draft>): void => setDraft((current) => ({ ...current, ...next }))

  const submit = (): void => {
    if (draft.name.trim() === '') {
      setError(t('请填写课程名称'))
      return
    }
    const from = Math.min(draft.from, draft.to)
    const to = Math.max(draft.from, draft.to)
    const periods: number[] = []
    for (let p = from; p <= to; p += 1) periods.push(p)
    onSave({
      ...(initial ?? {}),
      name: draft.name.trim(),
      teacher: draft.teacher.trim() === '' ? undefined : draft.teacher.trim(),
      location: draft.location.trim() === '' ? undefined : draft.location.trim(),
      weekday: draft.weekday,
      periods,
      weeks: { from: Math.min(draft.weekFrom, draft.weekTo), to: Math.max(draft.weekFrom, draft.weekTo) },
      parity: draft.parity,
      color: draft.color,
    })
  }

  return (
    <div className="dshc-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dshc-modal" role="dialog" aria-modal="true" aria-label={initial === null ? t('添加课程') : t('编辑课程')}>
        <header className="dshc-modal-head">
          <strong>{initial === null ? t('添加课程') : t('编辑课程')}</strong>
          <button type="button" className="dshc-icon-btn" onClick={onClose} aria-label={t('关闭')}>
            ✕
          </button>
        </header>
        <div className="dshc-modal-body">
          <label className="dshc-field">
            <span>{t('课程名称')}</span>
            <input
              type="text"
              value={draft.name}
              placeholder={t('例如：高等数学')}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>
          <div className="dshc-row">
            <label className="dshc-field">
              <span>{t('教师')}</span>
              <input type="text" value={draft.teacher} onChange={(e) => patch({ teacher: e.target.value })} />
            </label>
            <label className="dshc-field">
              <span>{t('地点')}</span>
              <input type="text" value={draft.location} onChange={(e) => patch({ location: e.target.value })} />
            </label>
          </div>
          <div className="dshc-row">
            <label className="dshc-field">
              <span>{t('星期')}</span>
              <select value={draft.weekday} onChange={(e) => patch({ weekday: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <option key={day} value={day}>
                    {wd(day)}
                  </option>
                ))}
              </select>
            </label>
            <label className="dshc-field">
              <span>{t('起始节')}</span>
              <select value={draft.from} onChange={(e) => patch({ from: Number(e.target.value) })}>
                {term.periods.map((p: Period) => (
                  <option key={p.index} value={p.index}>
                    {t('第 {n} 节', { n: p.index })}
                  </option>
                ))}
              </select>
            </label>
            <label className="dshc-field">
              <span>{t('结束节')}</span>
              <select value={draft.to} onChange={(e) => patch({ to: Number(e.target.value) })}>
                {term.periods.map((p: Period) => (
                  <option key={p.index} value={p.index}>
                    {t('第 {n} 节', { n: p.index })}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="dshc-row">
            <label className="dshc-field">
              <span>{t('起始周')}</span>
              <input type="number" min={1} max={60} value={draft.weekFrom} onChange={(e) => patch({ weekFrom: Number(e.target.value) })} />
            </label>
            <label className="dshc-field">
              <span>{t('结束周')}</span>
              <input type="number" min={1} max={60} value={draft.weekTo} onChange={(e) => patch({ weekTo: Number(e.target.value) })} />
            </label>
            <label className="dshc-field">
              <span>{t('单双周')}</span>
              <select value={draft.parity} onChange={(e) => patch({ parity: e.target.value as Parity })}>
                {PARITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
          {initial !== null ? (
            <button type="button" className="dshc-btn is-danger" onClick={() => onDelete(initial.id)}>{t('删除')}</button>
          ) : null}
          <span style={{ marginLeft: 'auto' }} />
          <button type="button" className="dshc-btn" onClick={onClose}>{t('取消')}</button>
          <button type="button" className="dshc-btn is-primary" onClick={submit}>{t('保存')}</button>
        </footer>
      </div>
    </div>
  )
}

/** Props of the import dialog. */
interface ImportProps {
  onClose(): void
  onImport(courses: ParsedCourse[], replace: boolean): void
  onAiParse(text: string): Promise<{ courses: ParsedCourse[]; model: string }>
}

/**
 * Render the import dialog: paste text, read a CSV file, or let the model parse
 * a copied timetable; then preview and confirm.
 * @param props - callbacks.
 * @returns the dialog.
 */
function ImportDialog({ onClose, onImport, onAiParse }: ImportProps) {
  const t = useT()
  const [text, setText] = useState('')
  const [replace, setReplace] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ai, setAi] = useState<{ courses: ParsedCourse[]; model: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const csv = useMemo(() => (text.trim() === '' ? null : parseCourseCsv(text)), [text])
  const courses = ai?.courses ?? csv?.courses ?? []
  const skipped = ai === null ? (csv?.skipped.length ?? 0) : 0

  const pick = async (file: File | undefined): Promise<void> => {
    if (file === undefined) return
    try {
      setText(await file.text())
      setAi(null)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const runAi = async (): Promise<void> => {
    if (text.trim() === '' || busy) return
    setBusy(true)
    setError(null)
    try {
      const reply = await onAiParse(text)
      setAi(reply)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dshc-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dshc-modal" role="dialog" aria-modal="true" aria-label={t('导入课表')}>
        <header className="dshc-modal-head">
          <strong>{t('导入课表')}</strong>
          <button type="button" className="dshc-icon-btn" onClick={onClose} aria-label={t('关闭')}>
            ✕
          </button>
        </header>
        <div className="dshc-modal-body">
          <p className="dshc-hint">{t('三种方式任选：让 AI 解析你粘贴的课表文字、选择教务系统导出的 CSV 文件，或按下面的列顺序自己排版。')}</p>
          <div className="dshc-chips">
            <button type="button" className="dshc-btn" onClick={() => void fileRef.current?.click()}>{t('选择 CSV 文件')}</button>
            <button type="button" className="dshc-btn" onClick={() => void runAi()} disabled={busy || text.trim() === ''}>
              {busy ? t('解析中…') : t('AI 解析这段文本')}
            </button>
            <button
              type="button"
              className="dshc-chip"
              onClick={() => {
                setText(CSV_TEMPLATE)
                setAi(null)
              }}
            >{t('填入示例')}</button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              style={{ display: 'none' }}
              onChange={(e) => void pick(e.target.files?.[0])}
            />
          </div>
          <label className="dshc-field">
            <span>{t('粘贴内容')}</span>
            <textarea
              rows={7}
              value={text}
              placeholder={t('也可以直接贴教务系统复制的课表文字，再点「AI 解析」')}
              onChange={(e) => {
                setText(e.target.value)
                setAi(null)
              }}
            />
          </label>
          <details className="dshc-details">
            <summary>{t('CSV 列格式')}</summary>
            <pre className="dshc-pre">{CSV_TEMPLATE}</pre>
          </details>
          <label className="dshc-switch">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            <span>{t('覆盖已有课程（不勾选则追加）')}</span>
          </label>
          {courses.length > 0 ? (
            <p className="dshc-hint">
              {ai !== null ? t('由 {model} 解析出 {n} 门课程', { model: ai.model, n: courses.length }) : t('识别到 {n} 门课程', { n: courses.length })}
              {skipped > 0 ? t('，{n} 行无法识别', { n: skipped }) : ''}
            </p>
          ) : null}
          {error !== null ? <p className="dshc-error">{error}</p> : null}
        </div>
        <footer className="dshc-modal-foot">
          <span style={{ marginLeft: 'auto' }} />
          <button type="button" className="dshc-btn" onClick={onClose}>{t('取消')}</button>
          <button
            type="button"
            className="dshc-btn is-primary"
            disabled={courses.length === 0}
            onClick={() => {
              if (courses.length > 0) onImport(courses, replace)
            }}
          >
            {t('导入')} {courses.length} 门
          </button>
        </footer>
      </div>
    </div>
  )
}
