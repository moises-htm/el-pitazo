import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server-auth";
import { put } from "@vercel/blob";

export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(501).json({ error: "Avatar storage not configured. Set BLOB_READ_WRITE_TOKEN." });
  }

  const { avatar } = req.body;
  if (!avatar || !avatar.startsWith("data:image/")) {
    return res.status(400).json({ error: "Invalid image data" });
  }

  // Decode base64 data URI → Buffer
  const [meta, data] = (avatar as string).split(",");
  const mimeMatch = meta.match(/data:(image\/\w+);base64/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const ext  = mime.split("/")[1] ?? "jpg";

  let buffer: Buffer;
  try {
    buffer = Buffer.from(data, "base64");
  } catch {
    return res.status(400).json({ error: "Invalid base64 image data" });
  }

  try {
    const blob = await put(`avatars/${userId}.${ext}`, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: mime,
    });

    await prisma.user.update({ where: { id: userId }, data: { avatar: blob.url } });
    return res.json({ avatar: blob.url });
  } catch (err: any) {
    return res.status(500).json({ error: "Error al subir el avatar" });
  }
}
