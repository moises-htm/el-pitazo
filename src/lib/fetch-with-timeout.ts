/**
 * fetch with an AbortController-based timeout.
 * Throws a DOMException with name "AbortError" when the timeout fires.
 */
export async function fetchWithTimeout(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
