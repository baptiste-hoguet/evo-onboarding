import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { baseUrl } from "@/lib/base-url";
import { STATE_COOKIE, STATE_MAX_AGE_S, authorizeUrl, instagramConfig } from "@/lib/instagram/config";

// Début de la connexion Instagram : state anti-CSRF en cookie, puis redirection vers l'écran de connexion officiel de Meta.
export async function GET() {
  const base = await baseUrl();
  const cfg = instagramConfig();
  if (!cfg) return NextResponse.redirect(`${base}/diagnostic`, 303);

  const state = randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(authorizeUrl(cfg, base, state), 303);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: base.startsWith("https://"),
    sameSite: "lax",
    path: "/api/instagram",
    maxAge: STATE_MAX_AGE_S,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
