/**
 * Browser half of dsh-schedule-calendar.
 *
 * Registers one left-sidebar panel, the main-area page it addresses, and the
 * frame-wide reminder stack. The shell mounts this bundle lazily, so nothing
 * here runs until the panel is first used.
 */

import { CSS } from './css.js'
import { CalendarIcon } from './Icon.js'
import { setLanguage, t } from './i18n.js'
import { NoticeHost } from './NoticeHost.js'
import { CalendarPage } from './Page.js'

/** Panel id: the sidebar row and the main-area key share it. */
export const PANEL_ID = 'dsh-schedule-calendar'

/** Cordis services awaited before {@link apply} runs. */
export const inject = ['slots', 'locale'] as const

/** The locale service face this plugin reads. */
interface LocaleService {
  getLocale?(): { active?: string }
  subscribe?(listener: () => void): () => void
}

/** Minimal shape of the browser context members used here. */
interface ClientContext {
  slots: {
    inject(name: string, callback: () => () => void): () => void
    register(spec: Record<string, unknown>, component: unknown): () => void
  }
  locale?: LocaleService
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
 * Follow the DSH interface language.
 *
 * The shell's HTML carries no `lang` and Electron reports the OS locale, so a
 * Chinese desktop still looked English from the DOM. The locale service is the
 * only source that matches what the rest of DSH renders.
 * @param ctx - browser context.
 * @param disposers - cleanup sink for the subscription.
 */
function followLocale(ctx: ClientContext, disposers: Array<() => void>): void {
  const locale = ctx.locale ?? (ctx.get?.('locale') as LocaleService | undefined)
  if (locale?.getLocale === undefined) return
  const sync = (): void => {
    try {
      const active = locale.getLocale?.()?.active
      if (typeof active === 'string' && active !== '') setLanguage(active)
    } catch {
      /* a throwing service keeps the last known language */
    }
  }
  sync()
  if (typeof locale.subscribe === 'function') {
    const stop = locale.subscribe(sync)
    if (typeof stop === 'function') disposers.push(stop)
  }
}

/**
 * Mount the browser half.
 * @param ctx - browser cords context.
 */
export function apply(ctx: ClientContext): void {
  ensureStyles()
  const disposers: Array<() => void> = []

  followLocale(ctx, disposers)

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
