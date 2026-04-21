import type { NextApiRequest, NextApiResponse } from "next";
import { getUserId } from "@/lib/server-auth";
import { put } from "@vercel/blob";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(501).json({ error: "Video storage not configured. Set BLOB_READ_WRITE_TOKEN." });
  }

  const filename = (req.query.filename as string) || `video-${Date.now()}.mp4`;

  try {
    const blob = await put(`feed/${userId}/${filename}`, req, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return res.json({ url: blob.url });
  } catch (err: any) {
    return res.status(500).json({ error: "Error al subir el video" });
  }
}
