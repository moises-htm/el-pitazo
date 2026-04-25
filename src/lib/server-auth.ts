import type { NextApiRequest } from "next";
import jwt from "jsonwebtoken";
import { getTokenFromCookie } from "@/lib/auth-cookie";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET env var must be set in production");
}

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

interface JwtPayload { userId: string }

/**
 * Extracts the authenticated userId from the request.
 *
 * Priority:
 *  1. `Authorization: Bearer <token>` header — used by Capacitor/mobile builds
 *  2. `ep_token` httpOnly cookie — used by web browsers
 */
export function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  const rawToken = auth?.startsWith("Bearer ")
    ? auth.split(" ")[1]
    : getTokenFromCookie(req);

  if (!rawToken) return null;
  try {
    const payload = jwt.verify(rawToken, JWT_SECRET) as JwtPayload;
    if (typeof payload?.userId !== "string") return null;
    return payload.userId;
  } catch {
    return null;
  }
}
