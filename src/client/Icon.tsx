/** Sidebar glyph: a calendar card with a marked day. */

/** Props the DSH sidebar hands an icon: requested edge in pixels. */
interface IconProps {
  size?: number
}

/**
 * Render the plugin's sidebar icon.
 * @param props - the sidebar icon share.
 * @returns decorative SVG sized to the sidebar's request.
 */
export function CalendarIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 2v2.4M10.5 2v2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="5" y="8.5" width="2.2" height="2.2" rx="0.6" fill="currentColor" />
    </svg>
  )
}
