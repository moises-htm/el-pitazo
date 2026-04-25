import { logger } from "@/lib/logger";
import type { NextApiRequest, NextApiResponse } from "next";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_SECRET_KEY! });
const mpPayment = new Payment(mpClient);

/**
 * Verifies the MercadoPago v2 webhook signature.
 * See: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
 * Header format: x-signature: "ts=<timestamp>,v1=<hmac-sha256>"
 */
function verifyMpSignature(req: NextApiRequest): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // skip verification in dev if not configured

  const signature = req.headers["x-signature"] as string | undefined;
  const requestId = req.headers["x-request-id"] as string | undefined;
  if (!signature) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const dataId = (
    (req.query.data as any)?.id ??
    req.body?.data?.id ??
    ""
  ) as string;

  const manifest = `id:${dataId};request-id:${requestId ?? ""};ts:${ts};`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

const statusMap: Record<string, "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"> = {
  approved: "COMPLETED",
  pending: "PENDING",
  in_process: "PENDING",
  authorized: "PENDING",
  rejected: "FAILED",
  cancelled: "FAILED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  if (!verifyMpSignature(req)) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  try {
    // Support both IPN (query params) and Webhooks (body) styles
    const paymentIdFromQuery = req.query.id as string | undefined;
    const topicFromQuery = req.query.topic as string | undefined;
    const { type, data, action } = req.body || {};

    let mpPaymentId: string | null = null;

    if (topicFromQuery === "payment" && paymentIdFromQuery) {
      mpPaymentId = paymentIdFromQuery;
    } else if ((type === "payment" || action?.startsWith("payment.")) && data?.id) {
      mpPaymentId = String(data.id);
    }

    if (!mpPaymentId) return res.status(200).json({ ok: true });

    const mpData = await mpPayment.get({ id: mpPaymentId });
    const status = statusMap[mpData.status ?? ""] ?? "PENDING";
    const externalRef = mpData.external_reference;

    let payment = await prisma.payment.findFirst({
      where: { externalId: mpPaymentId },
    });

    if (!payment && externalRef) {
      const parts = externalRef.split(":");
      if (parts.length >= 3) {
        const [tournamentId, teamId, userId] = parts;
        payment = await prisma.payment.findFirst({
          where: { tournamentId, teamId, userId, method: { in: ["MERCADOPAGO", "OXXO", "SPEI"] } },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    if (payment) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment!.id },
          data: {
            status,
            externalId: mpPaymentId!,
            paidAt: status === "COMPLETED" ? new Date() : undefined,
            receiptUrl: (mpData.transaction_details as any)?.external_resource_url ?? undefined,
          },
        });
        if (status === "COMPLETED" && payment!.teamId) {
          await tx.team.update({
            where: { id: payment!.teamId },
            data: { payStatus: "PAID" },
          });
        }
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error("MP webhook error:", err);
    return res.status(200).json({ ok: true });
  }
}
