/**
 * Browser-side call into the plugin's host route family.
 *
 * The URL is document-relative on purpose: DSH serves the GUI with
 * `<base href="./">`, so a sub-path deployment keeps working and a root
 * absolute `/api/...` would escape it.
 */

/** One failed host call, carrying the code the host chose. */
export class ApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

/**
 * Invoke one host method.
 * @param method - trailing route segment, e.g. `state.get`.
 * @param body - JSON payload.
 * @param signal - optional cancellation.
 * @returns the host's value.
 */
export async function call<T>(method: string, body: unknown = {}, signal?: AbortSignal): Promise<T> {
  const url = new URL(`api/dsh-calendar/${method}`, document.baseURI)
  const response = await fetch(url.href, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
    credentials: 'same-origin',
    signal,
  })
  const data = (await response.json()) as { ok: true; value: T } | { ok: false; error: { code: string; message?: string } }
  if (!data.ok) throw new ApiError(data.error.code, data.error.message ?? 'The calendar request failed.')
  return data.value
}
