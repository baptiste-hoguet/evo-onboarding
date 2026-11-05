/** Lecture défensive du bloc `instagram` stocké dans DiagnosticLead.input (JSON). Pur, client et serveur. */
import type { InstagramSummary } from "@/lib/diagnostic/types";

const int = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);
const text = (v: unknown, max = 200): string | null => (typeof v === "string" && v && v.length <= max ? v : null);

export function parseInstagramSummary(v: unknown): InstagramSummary | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const username = text(o.username, 60);
  const reels7d = int(o.reels7d);
  if (!username || reels7d === null) return null;
  const permalink = text(o.topReelPermalink, 500);
  return {
    username,
    accountType: text(o.accountType, 30),
    followers: int(o.followers),
    reels7d,
    feed7d: int(o.feed7d) ?? 0,
    storiesLive: int(o.storiesLive),
    reelViewsTotal: int(o.reelViewsTotal),
    reelViewsAvg: int(o.reelViewsAvg),
    topReelViews: int(o.topReelViews),
    topReelPermalink: permalink && /^https:\/\/(www\.)?instagram\.com\//.test(permalink) ? permalink : null,
    fetchedAt: text(o.fetchedAt, 40) ?? "",
  };
}

/** Extrait le bloc instagram d'un input JSON brut. */
export function instagramFromInputJson(json: string | null | undefined): InstagramSummary | null {
  if (!json) return null;
  try {
    return parseInstagramSummary((JSON.parse(json) as { instagram?: unknown })?.instagram);
  } catch {
    return null;
  }
}
