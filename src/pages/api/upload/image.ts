import type { NextApiRequest, NextApiResponse } from "next";
import { getUserId } from "@/lib/server-auth";
import { put } from "@vercel/blob";

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

const MAX_BYTES = 5 * 1024 * 1024;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { image, folder = "uploads", filename } = req.body as {
    image?: string;
    folder?: string;
    filename?: string;
  };

  if (!image || !image.startsWith("data:image/")) {
    return res.status(400).json({ error: "Imagen inválida" });
  }

  // If Vercel Blob isn't configured, fall back to returning the data URL as-is.
  // This keeps dev/test functional while still typing the API correctly.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.json({ url: image, fallback: true });
  }

  try {
    const match = image.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/);
    if (!match) return res.status(400).json({ error: "Formato no soportado" });
    const mime = match[1];
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > MAX_BYTES) return res.status(413).json({ error: "Imagen demasiado grande (máx 5MB)" });

    const ext = mime.split("/")[1].replace("jpeg", "jpg");
    const safe = (filename || `img-${Date.now()}`).replace(/[^a-z0-9_-]/gi, "_");
    const blob = await put(`${folder}/${userId}/${safe}.${ext}`, buffer, {
      access: "public",
      contentType: mime,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return res.json({ url: blob.url });
  } catch {
    return res.status(500).json({ error: "Error al subir la imagen" });
  }
}
