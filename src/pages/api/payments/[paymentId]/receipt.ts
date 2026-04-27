import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { paymentId } = req.query as { paymentId: string };

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        tournament: { select: { name: true, fieldLocation: true } },
        team: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });
    if (!payment) return res.status(404).json({ error: "Pago no encontrado" });
    return res.json({ payment });
  } catch {
    return res.status(500).json({ error: "Error al obtener recibo" });
  }
}
