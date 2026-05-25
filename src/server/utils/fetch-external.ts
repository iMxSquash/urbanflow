const DEFAULT_TIMEOUT_MS = 5_000

/**
 * Fetch with automatic timeout. Chains an upstream AbortSignal when provided
 * so the request is cancelled by EITHER the timeout OR the upstream signal.
 */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const upstreamSignal = init?.signal as AbortSignal | undefined

  // Fast-path: upstream already aborted before we even start
  if (upstreamSignal?.aborted) {
    throw new Error('Request aborted', { cause: upstreamSignal.reason })
  }

  const controller = new AbortController()

  // Forward upstream abort → our controller so timeout OR upstream cancels the fetch
  if (upstreamSignal) {
    upstreamSignal.addEventListener('abort', () => controller.abort(upstreamSignal.reason), {
      once: true,
    })
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    // Upstream abort — re-throw as-is, not as a timeout error
    if (upstreamSignal?.aborted) throw err
    const isTimeout = (err as Error).name === 'AbortError'
    throw new Error(isTimeout ? `timeout ${timeoutMs}ms dépassé` : (err as Error).message, {
      cause: err,
    })
  } finally {
    clearTimeout(timer)
  }
}
