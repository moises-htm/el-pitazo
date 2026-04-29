import type { NextApiRequest } from "next";
import jwt from "jsonwebtoken";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET env var must be set in production");
}

export const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

interface JwtPayload { userId: string }

export function verifyToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (typeof payload?.userId !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

export function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7))?.userId ?? null;
}
