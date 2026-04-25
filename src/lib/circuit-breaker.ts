/**
 * Simple circuit breaker.
 * Opens after MAX_FAILURES consecutive failures and auto-resets after RESET_TIMEOUT_MS.
 */

const MAX_FAILURES = 3;
const RESET_TIMEOUT_MS = 30_000;

type CircuitState = "closed" | "open";

interface ServiceState {
  failures: number;
  state: CircuitState;
  openedAt: number | null;
}

const services = new Map<string, ServiceState>();

function getService(name: string): ServiceState {
  if (!services.has(name)) {
    services.set(name, { failures: 0, state: "closed", openedAt: null });
  }
  return services.get(name)!;
}

/** Returns true if the circuit is open (requests should be rejected). */
export function isOpen(serviceName: string): boolean {
  const svc = getService(serviceName);

  if (svc.state === "open" && svc.openedAt !== null) {
    if (Date.now() - svc.openedAt >= RESET_TIMEOUT_MS) {
      // Auto-reset
      svc.failures = 0;
      svc.state = "closed";
      svc.openedAt = null;
      return false;
    }
    return true;
  }

  return false;
}

/** Call after a successful request to reset the failure counter. */
export function recordSuccess(serviceName: string): void {
  const svc = getService(serviceName);
  svc.failures = 0;
  svc.state = "closed";
  svc.openedAt = null;
}

/** Call after a failed request. Opens the circuit after MAX_FAILURES. */
export function recordFailure(serviceName: string): void {
  const svc = getService(serviceName);
  svc.failures += 1;

  if (svc.failures >= MAX_FAILURES && svc.state === "closed") {
    svc.state = "open";
    svc.openedAt = Date.now();
  }
}

/**
 * Wraps an async call with circuit-breaker protection.
 * Throws an Error with message "Circuit open: <serviceName>" when the circuit is open.
 */
export async function callWithBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (isOpen(serviceName)) {
    throw new Error(`Circuit open: ${serviceName}`);
  }

  try {
    const result = await fn();
    recordSuccess(serviceName);
    return result;
  } catch (err) {
    recordFailure(serviceName);
    throw err;
  }
}
