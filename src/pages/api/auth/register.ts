// /api/auth/register — Next.js API Route
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET env var must be set in production");
}
const JWT_SECRET = process.env.JWT_SECRET || "el-pitazo-dev-secret";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const data = JSON.parse(JSON.stringify(req.body)) as any;
    
    if (!data.phone && !data.email) {
      return res.status(400).json({ error: "Need phone or email" });
    }
    if (!data.password || data.password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!data.name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const hash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        email: data.email,
        password: hash,
        name: data.name,
        role: Array.isArray(data.role) ? data.role : [data.role],
        country: data.country,
        lang: data.lang,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    
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
    console.error("Register error:", err);
    if (err.code === "P2002") {
      const field = err.meta?.target?.includes("email") ? "email" : "teléfono";
      return res.status(409).json({ error: `Ya existe una cuenta con ese ${field}` });
    }
    return res.status(500).json({ error: "Error al crear la cuenta" });
  }
}
