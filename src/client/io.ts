/** File download and pick helpers for import/export. */

/**
 * Save text to a file the user chooses a home for.
 * @param filename - suggested name.
 * @param text - file contents.
 * @param mime - media type.
 */
export function downloadText(filename: string, text: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Ask the user for one text file.
 * @param accept - input accept attribute.
 * @returns the file name and contents, or null when cancelled.
 */
export function pickTextFile(accept = '.ics,.json,.txt,text/calendar,application/json'): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      input.remove()
      if (file === undefined) {
        resolve(null)
        return
      }
      file
        .text()
        .then((text) => resolve({ name: file.name, text }))
        .catch(() => resolve(null))
    })
    document.body.appendChild(input)
    input.click()
  })
}

/** `schedule-2026-11-04.ics` style file name. */
export function stampedName(extension: string): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `schedule-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.${extension}`
}
