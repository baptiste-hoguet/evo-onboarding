import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { baseUrl } from "@/lib/base-url";
import { BETA_COOKIE, STATE_COOKIE, STATE_MAX_AGE_S, authorizeUrl, instagramConfig } from "@/lib/instagram/config";

// Début de la connexion Instagram : state anti-CSRF en cookie, puis redirection vers l'écran de connexion officiel de Meta.
export async function GET(request: NextRequest) {
  const base = await baseUrl();
  const cfg = instagramConfig();
  if (!cfg) return NextResponse.redirect(`${base}/diagnostic`, 303);

  const state = randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(authorizeUrl(cfg, base, state), 303);
  const opts = { httpOnly: true, secure: base.startsWith("https://"), sameSite: "lax" as const, path: "/api/instagram", maxAge: STATE_MAX_AGE_S };
  res.cookies.set(STATE_COOKIE, state, opts);
  // Bêta testeur : le retour vers /diagnostic garde ?beta=instagram.
  if (request.nextUrl.searchParams.get("beta") === "instagram") res.cookies.set(BETA_COOKIE, "1", opts);
  else res.cookies.set(BETA_COOKIE, "", { ...opts, maxAge: 0 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
