import type { NextApiRequest } from "next";
import crypto from "node:crypto";

function timingSafeEq(a: string, b: string): boolean {
  const ab = new Uint8Array(Buffer.from(a));
  const bb = new Uint8Array(Buffer.from(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; message: string };

// Verifies a request is from a trusted cron source. Vercel sends
// `Authorization: Bearer <CRON_SECRET>` for scheduled jobs; we also accept
// `x-cron-secret` for manual triggers. Refuses entirely if CRON_SECRET is
// unset in production. Use timing-safe compare.
export function verifyCronSecret(req: NextApiRequest): CronAuthResult {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, status: 500, message: "Server misconfigured" };
    }
    return { ok: false, status: 401, message: "Unauthorized" };
  }
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = req.headers["x-cron-secret"];
  const presented = typeof headerSecret === "string" ? headerSecret : bearer;
  if (!presented || !timingSafeEq(presented, expected)) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
  return { ok: true };
}
