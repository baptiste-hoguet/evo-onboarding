import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { baseUrl } from "@/lib/base-url";
import { STATE_COOKIE, instagramConfig, redirectUri } from "@/lib/instagram/config";
import { InstagramError, exchangeCode, readAccount } from "@/lib/instagram/api";
import { createSnapshot, purgeUnlinkedSnapshots } from "@/lib/instagram/store";

export const maxDuration = 30;

function sameState(a: string | undefined, b: string | null): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Retour de l'écran d'autorisation Instagram. On lit les chiffres une fois, on enregistre un snapshot
// sans jeton, puis le jeton est abandonné (jamais stocké, jamais journalisé).
export async function GET(request: NextRequest) {
  const base = await baseUrl();
  const back = (q: string) => {
    const res = NextResponse.redirect(`${base}/diagnostic?${q}`, 303);
    res.cookies.set(STATE_COOKIE, "", { path: "/api/instagram", maxAge: 0 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  };

  const cfg = instagramConfig();
  if (!cfg) return back("ig_error=off");

  const q = request.nextUrl.searchParams;
  if (!sameState(request.cookies.get(STATE_COOKIE)?.value, q.get("state"))) return back("ig_error=state");
  if (q.get("error")) return back(q.get("error") === "access_denied" ? "ig_error=denied" : "ig_error=failed");
  const code = q.get("code");
  if (!code || code.length > 2048) return back("ig_error=failed");

  // Nettoyage paresseux des snapshots jamais rattachés à un diagnostic (au-delà de 24 h).
  await purgeUnlinkedSnapshots().catch(() => console.warn("instagram: nettoyage des snapshots impossible"));

  try {
    const accessToken = await exchangeCode(cfg, redirectUri(base), code);
    const read = await readAccount(accessToken, cfg.appSecret);
    const id = await createSnapshot(read);
    return back(`ig=${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof InstagramError) console.error("instagram: lecture impossible", err.step, err.status ?? "-", err.graphCode ?? "-");
    else {
      const dbCode = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : "unknown";
      console.error("instagram: enregistrement impossible", dbCode);
    }
    return back("ig_error=failed");
  }
}
