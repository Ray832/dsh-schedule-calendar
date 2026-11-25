/**
 * Reminder surface.
 *
 * Lives in the frame-wide overlay slot, so a due reminder appears wherever the
 * user is in DSH — chat, settings, another plugin's page. It polls the host on
 * a slow interval; the host owns which reminders are due.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CalendarSettings, CalendarState } from '../types.js'
import { describeLead } from '../remind.js'
import { call } from './api.js'
import { clockOf } from './dates.js'
import { language, t as translate, useT } from './i18n.js'

/** Delay choices offered when the user asks to be nudged again. */
const SNOOZE_MINUTES = [5, 10, 30, 60, 180]

/** One notice as the host sends it. */
interface Notice {
  id: string
  eventId: string
  title: string
  start: string
  end: string
  allDay: boolean
  location?: string
  leadMinutes: number
  firedAt: number
  missed?: boolean
}

/** Polling interval while the page is open. */
const POLL_MS = 15_000

/** At most this many cards on screen at once. */
const MAX_CARDS = 4

/**
 * Play a short two-tone chime.
 * WebAudio keeps the plugin asset-free and works while the tab is backgrounded
 * in Electron.
 */
function chime(): void {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctor === undefined) return
    const audio = new Ctor()
    const now = audio.currentTime
    for (const [index, frequency] of [880, 1174].entries()) {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + index * 0.16)
      gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.16 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.16 + 0.15)
      osc.connect(gain).connect(audio.destination)
      osc.start(now + index * 0.16)
      osc.stop(now + index * 0.16 + 0.18)
    }
    setTimeout(() => void audio.close().catch(() => {}), 800)
  } catch {
    /* audio is a nicety, never a requirement */
  }
}

/**
 * Raise an operating-system notification when the environment allows one.
 * @param notice - the due reminder.
 */
function systemNotify(notice: Notice): void {
  try {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    const body = [notice.allDay ? translate('全天') : clockOf(notice.start), notice.location].filter(Boolean).join(' · ')
    new Notification(notice.title, { body, tag: notice.id })
  } catch {
    /* the in-app card is the fallback */
  }
}

/**
 * Render the reminder stack and keep it in sync with the host.
 * @returns the overlay, or null while nothing is due.
 */
export function NoticeHost() {
  const t = useT()
  const [notices, setNotices] = useState<Notice[]>([])
  const settingsRef = useRef<CalendarSettings | null>(null)

  /** Read the document once so sound and system-notification switches apply. */
  const loadSettings = useCallback(async () => {
    try {
      const state = await call<CalendarState>('state.get')
      settingsRef.current = state.settings
    } catch {
      /* settings are optional for showing a card */
    }
  }, [])

  const poll = useCallback(async () => {
    try {
      const due = await call<Notice[]>('notify.pending')
      if (due.length === 0) return
      setNotices((current) => {
        const seen = new Set(current.map((notice) => notice.id))
        const merged = [...current, ...due.filter((notice) => !seen.has(notice.id))]
        return merged.slice(-MAX_CARDS)
      })
      const settings = settingsRef.current
      if (settings === null || settings.soundEnabled) chime()
      if (settings === null || settings.systemNotification) {
        for (const notice of due) systemNotify(notice)
      }
    } catch {
      /* a closed host is not an error worth showing */
    }
  }, [])

  useEffect(() => {
    void loadSettings()
    void poll()
    const timer = setInterval(() => void poll(), POLL_MS)
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') {
        void loadSettings()
        void poll()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [loadSettings, poll])

  const [snoozeFor, setSnoozeFor] = useState<string | null>(null)

  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id))
    void call('notify.ack', { id }).catch(() => {})
  }, [])

  const snooze = useCallback((id: string, minutes: number) => {
    setSnoozeFor(null)
    setNotices((current) => current.filter((notice) => notice.id !== id))
    void call('notify.snooze', { id, minutes }).catch(() => {})
  }, [])

  const complete = useCallback((notice: Notice) => {
    setNotices((current) => current.filter((item) => item.id !== notice.id))
    void call('notify.complete', { eventId: notice.eventId }).catch(() => {})
    void call('notify.ack', { id: notice.id }).catch(() => {})
  }, [])

  if (notices.length === 0) return null

  return (
    <div className="dshc-notices" role="region" aria-label={t('日程提醒')}>
      {notices.map((notice) => (
        <article key={notice.id} className="dshc-notice" role="alert">
          <header className="dshc-notice-head">
            <span className="dshc-notice-kind">{notice.missed === true ? t('错过的提醒') : t('日程提醒')}</span>
            <span className="dshc-notice-time">
              {notice.allDay ? t('全天') : clockOf(notice.start)}
              {` · ${describeLead(notice.leadMinutes, language() === 'en' ? 'en' : 'zh')}`}
            </span>
            <button type="button" className="dshc-notice-x" aria-label={t('关闭')} onClick={() => dismiss(notice.id)}>
              ✕
            </button>
          </header>
          <strong className="dshc-notice-title">{notice.title}</strong>
          {notice.location !== undefined ? <span className="dshc-notice-loc">{notice.location}</span> : null}
          <div className="dshc-notice-actions">
            <button type="button" className="dshc-btn is-primary" onClick={() => complete(notice)}>
              {t('标记完成')}
            </button>
            <button type="button" className="dshc-btn" onClick={() => dismiss(notice.id)}>
              {t('关闭提醒')}
            </button>
            <button
              type="button"
              className="dshc-btn"
              aria-expanded={snoozeFor === notice.id}
              onClick={() => setSnoozeFor(snoozeFor === notice.id ? null : notice.id)}
            >
              {t('稍后提醒')}
            </button>
          </div>
          {snoozeFor === notice.id ? (
            <div className="dshc-notice-snooze">
              <span className="dshc-hint">{t('选一档，到点再提醒我')}</span>
              <div className="dshc-chips">
                {SNOOZE_MINUTES.map((minutes) => (
                  <button key={minutes} type="button" className="dshc-chip" onClick={() => snooze(notice.id, minutes)}>
                    {t('{n} 分钟后', { n: minutes })}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}

/**
 * Ask for notification permission once, without blocking anything.
 * Called by the page after a user gesture, never on load.
 */
export async function ensureNotificationPermission(): Promise<void> {
  try {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'default') return
    await Notification.requestPermission()
  } catch {
    /* unsupported environments simply keep the in-app card */
  }
}
