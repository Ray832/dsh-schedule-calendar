/**
 * Browser half of dsh-schedule-calendar.
 *
 * Registers one left-sidebar panel and the main-area page it addresses. The
 * shell mounts this bundle lazily, so nothing here runs until the panel is
 * first used.
 */

import { CSS } from './css.js'
import { CalendarIcon } from './Icon.js'
import { t } from './i18n.js'
import { NoticeHost } from './NoticeHost.js'
import { CalendarPage } from './Page.js'

/** Panel id: the sidebar row and the main-area key share it. */
export const PANEL_ID = 'dsh-schedule-calendar'

/** Cordis services awaited before {@link apply} runs. */
export const inject = ['slots'] as const

/** Minimal shape of the browser context members used here. */
interface ClientContext {
  slots: {
    inject(name: string, callback: () => () => void): () => void
    register(spec: Record<string, unknown>, component: unknown): () => void
  }
  effect?(callback: () => (() => void) | void, label?: string): void
  get?(key: string): unknown
}

/** Inject the package stylesheet once per page. */
function ensureStyles(): void {
  const marker = `style[data-plugin="${PANEL_ID}"]`
  if (document.querySelector(marker) !== null) return
  const tag = document.createElement('style')
  tag.dataset.plugin = PANEL_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
}

/**
 * Mount the browser half.
 * @param ctx - browser cords context.
 */
export function apply(ctx: ClientContext): void {
  ensureStyles()
  const disposers: Array<() => void> = []

  disposers.push(
    ctx.slots.inject('sidebar.panellist', () =>
      ctx.slots.register(
        {
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 40,
          label: () => t('日程'),
        },
        CalendarIcon,
      ),
    ),
  )

  disposers.push(
    ctx.slots.inject('main', () =>
      ctx.slots.register(
        {
          name: 'main',
          key: PANEL_ID,
        },
        CalendarPage,
      ),
    ),
  )

  // Frame-wide reminder stack: due reminders must show while the user is
  // anywhere in DSH, not only on this plugin's page.
  disposers.push(
    ctx.slots.inject('shell.overlay', () =>
      ctx.slots.register(
        {
          name: 'shell.overlay',
          id: `${PANEL_ID}-notices`,
          order: 20,
        },
        NoticeHost,
      ),
    ),
  )

  const dispose = (): void => {
    for (const stop of disposers.splice(0)) {
      try {
        stop()
      } catch {
        /* the fiber may already have released it */
      }
    }
  }
  if (typeof ctx.effect === 'function') ctx.effect(() => dispose, 'dsh-schedule-calendar: surfaces')
}
