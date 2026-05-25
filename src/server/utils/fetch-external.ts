const DEFAULT_TIMEOUT_MS = 5_000

/**
 * Fetch avec timeout automatique. Lance une exception descriptive si le
 * délai est dépassé ou si une erreur réseau se produit.
 */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    const isTimeout = (err as Error).name === 'AbortError'
    const reason = isTimeout ? `timeout ${timeoutMs}ms dépassé` : (err as Error).message
    throw new Error(reason, { cause: err })
  } finally {
    clearTimeout(timer)
  }
}
