import { logger } from "@/lib/logger";
// /api/auth/login — Next.js API Route
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { setAuthCookie } from "@/lib/auth-cookie";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET env var must be set in production");
}
const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rl = rateLimit(`login:${getIp(req)}`, 10, 60_000); // 10 attempts / minute per IP
  if (!rl.allowed) {
    res.setHeader("Retry-After", Math.ceil((rl.resetAt - Date.now()) / 1000));
    return res.status(429).json({ error: "Demasiados intentos. Intenta en un minuto." });
  }

  try {
    const data = JSON.parse(JSON.stringify(req.body)) as any;

    if (!data.password || (!data.phone && !data.email)) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: data.phone }, { email: data.email }],
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Esta cuenta usa inicio de sesión social. Usa Google o Apple." });
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });

    // Web: set httpOnly cookie (not readable by JS)
    // Mobile (Capacitor): also return token in body for Authorization header usage
    setAuthCookie(res, token);

    return res.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country,
        lang: user.lang,
      },
      token,
    });
  } catch (err: any) {
    logger.error("Login error:", err);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
}
