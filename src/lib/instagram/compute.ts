/**
 * Calcul des chiffres Instagram des 7 derniers jours à partir des réponses de l'API.
 * Pur (aucun appel réseau) : testé dans scripts/instagram-check.ts.
 */

export const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface RawMedia {
  id: string;
  media_type?: string; // IMAGE | VIDEO | CAROUSEL_ALBUM
  media_product_type?: string; // AD | FEED | STORY | REELS (peut être absent selon le type de connexion)
  timestamp?: string;
  permalink?: string;
}

export interface Computed {
  reels7d: number;
  feed7d: number;
  reelViewsTotal: number | null;
  reelViewsAvg: number | null;
  topReelViews: number | null;
  topReelPermalink: string | null;
}

/** Reel ? media_product_type fait foi ; à défaut, une vidéo du feed est publiée en reel depuis 2022. */
export function isReel(m: RawMedia): boolean {
  if (m.media_product_type) return m.media_product_type.toUpperCase() === "REELS";
  return (m.media_type ?? "").toUpperCase() === "VIDEO";
}

function isFeedPost(m: RawMedia): boolean {
  const p = (m.media_product_type ?? "FEED").toUpperCase();
  return p === "FEED" && !isReel(m);
}

/** Médias publiés dans la fenêtre [now - 7 j, now], sans doublon. */
export function inWindow(media: RawMedia[], now: number): RawMedia[] {
  const since = now - WINDOW_MS;
  const seen = new Set<string>();
  return media.filter((m) => {
    if (!m.id || seen.has(m.id)) return false;
    const t = m.timestamp ? Date.parse(m.timestamp) : NaN;
    if (!Number.isFinite(t) || t < since || t > now + 60_000) return false;
    seen.add(m.id);
    return true;
  });
}

/**
 * @param media    médias renvoyés par /me/media (déjà ou non filtrés sur 7 jours)
 * @param views    vues par id de reel ; absent = statistique indisponible pour ce reel
 */
export function computeNumbers(media: RawMedia[], views: Map<string, number>, now: number): Computed {
  const recent = inWindow(media, now);
  const reels = recent.filter(isReel);
  const feed = recent.filter(isFeedPost);

  let total = 0;
  let known = 0;
  let top: { views: number; permalink: string | null } | null = null;
  for (const r of reels) {
    const v = views.get(r.id);
    if (v === undefined || !Number.isFinite(v) || v < 0) continue;
    total += v;
    known += 1;
    if (!top || v > top.views) top = { views: v, permalink: r.permalink ?? null };
  }

  return {
    reels7d: reels.length,
    feed7d: feed.length,
    reelViewsTotal: known ? Math.round(total) : null,
    reelViewsAvg: known ? Math.round(total / known) : null,
    topReelViews: top ? Math.round(top.views) : null,
    topReelPermalink: top?.permalink && /^https:\/\/(www\.)?instagram\.com\//.test(top.permalink) ? top.permalink : null,
  };
}

/** Lit la valeur d'une métrique dans une réponse /<media-id>/insights. */
export function readMetric(body: unknown, name: string): number | undefined {
  if (!body || typeof body !== "object") return undefined;
  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data)) return undefined;
  const m = data.find((d) => d && typeof d === "object" && (d as { name?: unknown }).name === name) as
    | { values?: { value?: unknown }[]; total_value?: { value?: unknown } }
    | undefined;
  if (!m) return undefined;
  const v = m.total_value?.value ?? m.values?.[0]?.value;
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** Règle EVO : un reel au-dessus de 10 000 vues se refait en 10 variantes. */
export const VIRAL_REEL_VIEWS = 10_000;
