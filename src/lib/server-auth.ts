import type { NextApiRequest } from "next";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET env var is not set in production");
}

interface JwtPayload { userId: string }

export function getUserId(req: NextApiRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(auth.split(" ")[1], JWT_SECRET) as JwtPayload;
    if (typeof payload?.userId !== "string") return null;
    return payload.userId;
  } catch {
    return null;
  }
}
