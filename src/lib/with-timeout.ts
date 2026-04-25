/**
 * Wraps any promise with a hard deadline.
 * Throws `Error("<label> timed out after <ms>ms")` if the deadline is exceeded.
 *
 * Usage:
 *   const result = await withTimeout(mpPayment.create(...), 10_000, "mp-oxxo");
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = "operation"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const id = setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      );
      // Allow Node.js to exit if this is the only pending timer
      if (typeof id === "object" && "unref" in id) (id as NodeJS.Timeout).unref();
    }),
  ]);
}
