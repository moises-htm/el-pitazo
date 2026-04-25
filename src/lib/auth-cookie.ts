/**
 * httpOnly cookie helpers for JWT storage.
 *
 * Web clients: token lives in an httpOnly, SameSite=Lax cookie —
 *   not readable by JS, mitigates XSS token theft.
 *
 * Mobile clients (Capacitor/Expo): still receive `token` in the JSON
 *   response body and send it as `Authorization: Bearer <token>`.
 *   Both paths are supported by `getUserId()` in server-auth.ts.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize, parse } from "cookie";

export const COOKIE_NAME = "ep_token";
const IS_PROD = process.env.NODE_ENV === "production";

export function setAuthCookie(res: NextApiResponse, token: string): void {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  );
}

export function clearAuthCookie(res: NextApiResponse): void {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
}

export function getTokenFromCookie(req: NextApiRequest): string | null {
  const cookies = parse(req.headers.cookie ?? "");
  return cookies[COOKIE_NAME] ?? null;
}
