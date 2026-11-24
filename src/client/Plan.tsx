/** Long-term planning: a goal, its milestones, and how far along it is. */

import { useState } from 'react'
import type { CalendarState, Milestone, Plan } from '../types.js'
import { t, useT } from './i18n.js'

/** Days from today to a `YYYY-MM-DD` date; negative when overdue. */
function daysLeft(due: string | undefined): number | null {
  if (due === undefined || due === '') return null
  const target = new Date(`${due}T00:00`).getTime()
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return Math.round((target - start) / 86_400_000)
}

/** Human sentence for a deadline. */
function dueLabel(due: string | undefined): string | null {
  const left = daysLeft(due)
  if (left === null) return null
  if (left < 0) return t('已逾期 {n} 天', { n: Math.abs(left) })
  if (left === 0) return t('今天截止')
  if (left === 1) return t('明天截止')
  return t('还有 {n} 天', { n: left })
}

/** Progress of a plan, 0–1. */
function progressOf(plan: Plan): number {
  if (plan.milestones.length === 0) return plan.status === 'done' ? 1 : 0
  return plan.milestones.filter((milestone) => milestone.done).length / plan.milestones.length
}

/** Props of the plan page. */
interface Props {
  state: CalendarState
  onSave(plan: Partial<Plan>): void
  onDelete(id: string): void
  onToggle(planId: string, milestoneId: string, done: boolean): void
}

/**
 * Render the plan list, or one plan's detail when selected.
 * @param props - document and callbacks.
 * @returns the page body.
 */
export function PlanPage({ state, onSave, onDelete, onToggle }: Props) {
  const t = useT()
  const [editing, setEditing] = useState<Plan | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = state.plans.find((plan) => plan.id === openId) ?? null

  if (editing !== null) {
    return (
      <PlanEditor
        initial={editing}
        onClose={() => setEditing(null)}
        onSave={(plan) => {
          onSave(plan)
          setEditing(null)
        }}
      />
    )
  }

  if (open !== null) {
    const progress = Math.round(progressOf(open) * 100)
    return (
      <div className="dshc-surface">
        <div className="dshc-toolbar">
          <button type="button" className="dshc-btn" onClick={() => setOpenId(null)}>{t('‹ 全部目标')}</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" className="dshc-btn" onClick={() => setEditing(open)}>{t('编辑')}</button>
            <button
              type="button"
              className="dshc-btn is-danger"
              onClick={() => {
                onDelete(open.id)
                setOpenId(null)
              }}
            >{t('删除')}</button>
          </div>
        </div>
        <div className="dshc-plan-head">
          <h2>{open.title}</h2>
          {open.goal !== undefined ? <p className="dshc-plan-goal">{open.goal}</p> : null}
          <div className="dshc-plan-meta">
            <span>{t('{n}% 完成', { n: progress })}</span>
            {open.due !== undefined ? <span>{t('截止 {date}', { date: open.due })}</span> : null}
            {dueLabel(open.due) !== null ? <span className="dshc-plan-due">{dueLabel(open.due)}</span> : null}
            <span>{t('{done}/{total} 个里程碑', { done: open.milestones.filter((m) => m.done).length, total: open.milestones.length })}</span>
          </div>
          <div className="dshc-bar" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
        <ul className="dshc-milestones">
          {open.milestones.map((milestone) => (
            <li key={milestone.id}>
              <label className="dshc-milestone">
                <input
                  type="checkbox"
                  checked={milestone.done}
                  onChange={(e) => onToggle(open.id, milestone.id, e.target.checked)}
                />
                <span className={milestone.done ? 'dshc-milestone-title is-done' : 'dshc-milestone-title'}>{milestone.title}</span>
                {milestone.due !== undefined ? <span className="dshc-milestone-due">{milestone.due}</span> : null}
              </label>
            </li>
          ))}
          {open.milestones.length === 0 ? <li className="dshc-hint">{t('还没有里程碑，点「编辑」把它们加进来。')}</li> : null}
        </ul>
      </div>
    )
  }

  return (
    <div className="dshc-surface">
      <div className="dshc-toolbar">
        <strong className="dshc-heading">{t('长期目标')}</strong>
        <button
          type="button"
          className="dshc-btn is-primary"
          style={{ marginLeft: 'auto' }}
          onClick={() =>
            setEditing({
              id: '',
              title: '',
              priority: 'normal',
              status: 'active',
              milestones: [],
              createdAt: 0,
              updatedAt: 0,
            } as Plan)
          }
        >{t('+ 新建目标')}</button>
      </div>
      {state.plans.length === 0 ? (
        <div className="dshc-empty">
          <strong>{t('还没有目标')}</strong>
          <span>{t('把一个长期任务拆成几个里程碑，进度就会一目了然。比如「期末复习」拆成三章 + 两套真题。')}</span>
        </div>
      ) : (
        <div className="dshc-planlist">
          {state.plans.map((plan) => {
            const progress = Math.round(progressOf(plan) * 100)
            return (
              <button key={plan.id} type="button" className="dshc-plancard" onClick={() => setOpenId(plan.id)}>
                <div className="dshc-plancard-top">
                  <strong>{plan.title}</strong>
                  {plan.status === 'done' ? <span className="dshc-tag">{t('已完成')}</span> : null}
                  {plan.priority === 'high' ? <span className="dshc-tag is-hot">{t('重要')}</span> : null}
                </div>
                <div className="dshc-bar" aria-hidden="true">
                  <i style={{ width: `${progress}%` }} />
                </div>
                <div className="dshc-plan-meta">
                  <span>{progress}%</span>
                  <span>
                    {t('{done}/{total} 个里程碑', { done: plan.milestones.filter((m) => m.done).length, total: plan.milestones.length })}
                  </span>
                  {dueLabel(plan.due) !== null ? <span className="dshc-plan-due">{dueLabel(plan.due)}</span> : null}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Props of the plan editor. */
interface EditorProps {
  initial: Plan
  onClose(): void
  onSave(plan: Partial<Plan>): void
}

/**
 * Render the plan editor with an inline milestone list.
 * @param props - draft seed and callbacks.
 * @returns the dialog.
 */
function PlanEditor({ initial, onClose, onSave }: EditorProps) {
  const t = useT()
  const [title, setTitle] = useState(initial.title)
  const [goal, setGoal] = useState(initial.goal ?? '')
  const [due, setDue] = useState(initial.due ?? '')
  const [priority, setPriority] = useState<Plan['priority']>(initial.priority)
  const [milestones, setMilestones] = useState<Milestone[]>(() => initial.milestones.map((m) => ({ ...m })))
  const [draftTitle, setDraftTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const addMilestone = (): void => {
    if (draftTitle.trim() === '') return
    setMilestones((current) => [
      ...current,
      { id: `tmp-${Date.now()}-${current.length}`, title: draftTitle.trim(), done: false },
    ])
    setDraftTitle('')
  }

  const submit = (): void => {
    if (title.trim() === '') {
      setError(t('请填写目标名称'))
      return
    }
    onSave({
      ...(initial.id !== '' ? { id: initial.id } : {}),
      title: title.trim(),
      goal: goal.trim() === '' ? undefined : goal.trim(),
      due: due === '' ? undefined : due,
      priority,
      status: initial.status,
      milestones,
    })
  }

  return (
    <div className="dshc-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dshc-modal" role="dialog" aria-modal="true" aria-label={initial.id === '' ? t('新建目标') : t('编辑目标')}>
        <header className="dshc-modal-head">
          <strong>{initial.id === '' ? t('新建目标') : t('编辑目标')}</strong>
          <button type="button" className="dshc-icon-btn" onClick={onClose} aria-label={t('关闭')}>
            ✕
          </button>
        </header>
        <div className="dshc-modal-body">
          <label className="dshc-field">
            <span>{t('目标')}</span>
            <input type="text" value={title} placeholder={t('例如：期末复习完高数')} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="dshc-field">
            <span>{t('说明')}</span>
            <textarea rows={2} value={goal} placeholder={t('选填：为什么要做、做到什么程度算完成')} onChange={(e) => setGoal(e.target.value)} />
          </label>
          <div className="dshc-row">
            <label className="dshc-field">
              <span>{t('截止日')}</span>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
            <label className="dshc-field">
              <span>{t('优先级')}</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Plan['priority'])}>
                <option value="low">{t('低')}</option>
                <option value="normal">{t('普通')}</option>
                <option value="high">{t('重要')}</option>
              </select>
            </label>
          </div>
          <div className="dshc-field">
            <span>{t('里程碑')}</span>
            <ul className="dshc-milestones">
              {milestones.map((milestone) => (
                <li key={milestone.id}>
                  <div className="dshc-milestone-row">
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) =>
                        setMilestones((current) =>
                          current.map((item) => (item.id === milestone.id ? { ...item, title: e.target.value } : item)),
                        )
                      }
                    />
                    <input
                      type="date"
                      value={milestone.due ?? ''}
                      onChange={(e) =>
                        setMilestones((current) =>
                          current.map((item) =>
                            item.id === milestone.id ? { ...item, due: e.target.value === '' ? undefined : e.target.value } : item,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="dshc-icon-btn"
                      aria-label={t('删除里程碑')}
                      onClick={() => setMilestones((current) => current.filter((item) => item.id !== milestone.id))}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="dshc-row">
              <input
                type="text"
                placeholder={t('加一个里程碑，回车确认')}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addMilestone()
                  }
                }}
                style={{
                  flex: 1,
                  border: '1px solid var(--dshc-border)',
                  borderRadius: 8,
                  padding: '6px 9px',
                  background: 'var(--dshc-bg)',
                  color: 'var(--dshc-text)',
                  fontSize: 13,
                }}
              />
              <button type="button" className="dshc-btn" onClick={addMilestone}>{t('添加')}</button>
            </div>
          </div>
          {error !== null ? <p className="dshc-error">{error}</p> : null}
        </div>
        <footer className="dshc-modal-foot">
          <span style={{ marginLeft: 'auto' }} />
          <button type="button" className="dshc-btn" onClick={onClose}>{t('取消')}</button>
          <button type="button" className="dshc-btn is-primary" onClick={submit}>{t('保存')}</button>
        </footer>
      </div>
    </div>
  )
}
