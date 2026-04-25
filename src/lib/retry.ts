/**
 * Retries an async operation with exponential backoff.
 *
 * Usage:
 *   const result = await withRetry(
 *     () => withTimeout(mpPreference.create(...), 10_000),
 *     { attempts: 2, delayMs: 500, label: "mp-preference" }
 *   );
 *
 * Only retries on network/timeout errors. Does NOT retry on 4xx responses
 * (those are caller errors, not transient failures).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; delayMs?: number; label?: string } = {}
): Promise<T> {
  const { attempts = 2, delayMs = 500, label = "operation" } = options;
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Don't retry on explicit client errors (non-transient)
      const statusCode = err?.status ?? err?.statusCode;
      if (statusCode && statusCode >= 400 && statusCode < 500) throw err;

      if (i < attempts - 1) {
        const wait = delayMs * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }

  throw lastError;
}
