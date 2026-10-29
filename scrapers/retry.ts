/** Retry transient network/server failures, never a source's explicit access denial. */
export function isRetryableSourceError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } } | null)?.response?.status
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return status === 408 || status === 429
  }
  return true
}
