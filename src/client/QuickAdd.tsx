/** One-sentence quick add: the model turns a phrase into candidate events. */

import { useState } from 'react'
import type { CalendarEvent } from '../types.js'
import { call } from './api.js'
import { clockOf } from './dates.js'
import { useT } from './i18n.js'

/** Props of the bar. */
interface Props {
  onImport(events: CalendarEvent[]): void
}

/** Reply of the host parse route. */
interface ParseReply {
  events: CalendarEvent[]
  model: string
}

/**
 * Render the quick-add bar and its confirmation list.
 * @param props - import callback.
 * @returns the bar.
 */
export function QuickAdd({ onImport }: Props) {
  const t = useT()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ParseReply | null>(null)

  const parse = async (): Promise<void> => {
    const sentence = text.trim()
    if (sentence === '' || busy) return
    setBusy(true)
    setError(null)
    try {
      setPreview(await call<ParseReply>('parse.events', { text: sentence }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setPreview(null)
    } finally {
      setBusy(false)
    }
  }

  const confirm = (): void => {
    if (preview === null) return
    onImport(preview.events)
    setPreview(null)
    setText('')
  }

  return (
    <div className="dshc-quick">
      <div className="dshc-quick-row">
        <input
          type="text"
          value={text}
          placeholder={t('一句话添加，例如：明天下午三点组会，提前十分钟提醒')}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void parse()
            }
            if (e.key === 'Escape') setPreview(null)
          }}
          disabled={busy}
        />
        <button type="button" className="dshc-btn is-primary" onClick={() => void parse()} disabled={busy || text.trim() === ''}>
          {busy ? t('解析中…') : t('解析')}
        </button>
      </div>

      {error !== null ? (
        <p className="dshc-error">
          {error}
          <button type="button" className="dshc-link" onClick={() => void parse()}>
            {t('重试')}
          </button>
        </p>
      ) : null}

      {preview !== null ? (
        <div className="dshc-preview" role="group" aria-label={t('解析结果')}>
          <div className="dshc-preview-head">
            <span>{t('识别到 {n} 条日程 · 由 {model} 解析', { n: preview.events.length, model: preview.model })}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button type="button" className="dshc-btn" onClick={() => setPreview(null)}>
                {t('取消')}
              </button>
              <button type="button" className="dshc-btn is-primary" onClick={confirm}>
                {t('全部添加')}
              </button>
            </div>
          </div>
          <ul className="dshc-preview-list">
            {preview.events.map((event) => (
              <li key={event.id}>
                <strong>{event.title}</strong>
                <span>
                  {event.start.slice(0, 10)} {event.allDay ? t('全天') : clockOf(event.start)}
                  {event.allDay ? '' : `–${clockOf(event.end)}`}
                </span>
                {event.location !== undefined ? <span className="dshc-hint">{event.location}</span> : null}
                {event.repeat !== undefined && event.repeat.kind !== 'none' ? <span className="dshc-tag">{t('重复')}</span> : null}
              </li>
            ))}
          </ul>
          <p className="dshc-hint">{t('解析结果先预览再落库；有问题就改一下措辞重新解析。')}</p>
        </div>
      ) : null}
    </div>
  )
}
