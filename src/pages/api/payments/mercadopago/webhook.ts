import type { NextApiRequest, NextApiResponse } from "next";
import MercadoPagoConfig, { Payment } from "mercadopago";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_SECRET_KEY! });
const mpPayment = new Payment(mpClient);

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

// Verify x-signature per MP docs:
// https://www.mercadopago.com.mx/developers/en/docs/your-integrations/notifications/webhooks#signature-validation
// Manifest format: id:<dataId>;request-id:<x-request-id>;ts:<ts>;
function verifyMpSignature(req: NextApiRequest, dataId: string, secret: string): boolean {
  const sig = req.headers["x-signature"];
  const reqId = req.headers["x-request-id"];
  if (typeof sig !== "string" || typeof reqId !== "string") return false;
  const ts = sig.match(/(?:^|,)\s*ts=([^,]+)/)?.[1];
  const v1 = sig.match(/(?:^|,)\s*v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = new Uint8Array(Buffer.from(expected));
  const b = new Uint8Array(Buffer.from(v1));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

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

    // Signature verification — required in production. In dev, skip if secret is unset.
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    if (process.env.NODE_ENV === "production" && !webhookSecret) {
      console.error("MP_WEBHOOK_SECRET not set in production — rejecting webhook");
      return res.status(500).json({ error: "Server misconfigured" });
    }
    if (webhookSecret && !verifyMpSignature(req, mpPaymentId, webhookSecret)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Idempotency: dedupe on (provider + event id). Concurrent retries fail the unique
    // constraint and we short-circuit. Key includes mpPaymentId since MP retries the
    // same notification many times.
    const eventKey = `mercadopago:${mpPaymentId}`;
    try {
      await prisma.processedWebhookEvent.create({
        data: { id: eventKey, provider: "mercadopago" },
      });
    } catch (e: unknown) {
      // P2002 = unique constraint — already processed, ignore.
      if ((e as { code?: string })?.code === "P2002") {
        return res.status(200).json({ ok: true, deduped: true });
      }
      throw e;
    }

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
    console.error("MP webhook error:", err);
    return res.status(200).json({ ok: true });
  }
}
