/**
 * Appels à l'API officielle Meta (« Instagram API with Unified Login », hôte graph.facebook.com), côté serveur.
 * Le jeton d'accès ne quitte jamais ces fonctions : il n'est ni stocké, ni journalisé,
 * et les erreurs ne transportent ni URL (qui contiendrait le jeton) ni donnée personnelle.
 */
import { createHmac } from "node:crypto";
import { GRAPH_HOST, GRAPH_VERSION, TOKEN_URL, type MetaConfig } from "./config";
import { computeNumbers, inWindow, isReel, readMetric, WINDOW_MS, type RawMedia } from "./compute";
import type { InstagramSummary } from "@/lib/diagnostic/types";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_MEDIA_PAGES = 4;
const MAX_REELS_WITH_INSIGHTS = 30;
const INSIGHTS_CONCURRENCY = 5;

/** Erreur sans détail sensible : seulement une étape et un code HTTP / Graph. */
export class InstagramError extends Error {
  constructor(public step: string, public status: number | null, public graphCode: number | null = null) {
    super(`instagram:${step}`);
    this.name = "InstagramError";
  }
}

/** Jeton + appsecret_proof (HMAC-SHA256 du jeton avec la clé secrète), ajoutés à chaque appel Graph. */
interface Session {
  token: string;
  proof: string;
}

async function getJson(url: string, step: string): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    throw new InstagramError(step, null);
  }
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !body) {
    const code = (body?.error as { code?: unknown } | undefined)?.code;
    throw new InstagramError(step, res.status, typeof code === "number" ? code : null);
  }
  return body;
}

function graphUrl(path: string, params: Record<string, string>, s: Session): string {
  const u = new URL(`https://${GRAPH_HOST}/${GRAPH_VERSION}/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("access_token", s.token);
  u.searchParams.set("appsecret_proof", s.proof);
  return u.toString();
}

/** On ne suit que des pages servies par graph.facebook.com (appsecret_proof rajouté si absent). */
function nextPage(body: Record<string, unknown>, s: Session): string | null {
  const next = (body.paging as { next?: unknown } | undefined)?.next;
  if (typeof next !== "string") return null;
  try {
    const u = new URL(next);
    if (u.hostname !== GRAPH_HOST) return null;
    if (!u.searchParams.has("appsecret_proof")) u.searchParams.set("appsecret_proof", s.proof);
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Échange côté serveur du code contre un jeton (Business Integration System User Access Token),
 * avec l'ID et la clé secrète de l'app Meta. Le jeton est jeté après la lecture.
 */
export async function exchangeCode(cfg: MetaConfig, redirectUri: string, code: string): Promise<string> {
  const u = new URL(TOKEN_URL);
  u.searchParams.set("client_id", cfg.appId);
  u.searchParams.set("client_secret", cfg.appSecret);
  // Facebook Login exige le même redirect_uri que celui de la boîte de dialogue.
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("code", code.replace(/#_$/, ""));
  const body = await getJson(u.toString(), "token");
  const token = body.access_token;
  if (typeof token !== "string" || !token) throw new InstagramError("token", 200);
  return token;
}

function intOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null;
}

/** Compte(s) Instagram partagé(s) par le client lors de la connexion : on prend le premier. */
async function fetchAccount(s: Session) {
  const me = await getJson(graphUrl("me", { fields: "id" }, s), "me").catch(() => null);
  const list = await getJson(graphUrl("me/assigned_instagram_accounts", { fields: "id,username" }, s), "accounts");
  const first = Array.isArray(list.data) ? (list.data[0] as { id?: unknown } | undefined) : undefined;
  if (!first?.id) throw new InstagramError("accounts", 200);
  const igId = String(first.id);
  const user = await getJson(graphUrl(igId, { fields: "id,username,followers_count" }, s), "profile");
  const username = typeof user.username === "string" ? user.username.slice(0, 60) : "";
  if (!username) throw new InstagramError("profile", 200);
  return {
    igUserId: igId,
    appScopedId: me?.id !== undefined ? String(me.id) : null,
    username,
    followers: intOrNull(user.followers_count),
  };
}

async function listMedia(s: Session, igId: string, since: number, fields: string): Promise<RawMedia[]> {
  const out: RawMedia[] = [];
  let url: string | null = graphUrl(`${igId}/media`, { fields, since: String(since), limit: "50" }, s);
  for (let page = 0; url && page < MAX_MEDIA_PAGES; page++) {
    const body = await getJson(url, "media");
    const data = Array.isArray(body.data) ? (body.data as RawMedia[]) : [];
    out.push(...data);
    // Les médias arrivent du plus récent au plus ancien : on s'arrête dès qu'on sort de la fenêtre.
    const last = data[data.length - 1];
    if (!data.length || (last?.timestamp && Date.parse(last.timestamp) < since * 1000)) break;
    url = nextPage(body, s);
  }
  return out;
}

async function fetchRecentMedia(s: Session, igId: string, now: number): Promise<RawMedia[]> {
  const since = Math.floor((now - WINDOW_MS) / 1000);
  try {
    return await listMedia(s, igId, since, "id,media_type,media_product_type,timestamp,permalink");
  } catch (e) {
    // Si le champ media_product_type était refusé, on relit sans lui (les vidéos comptent alors comme reels).
    if (e instanceof InstagramError && e.status === 400) return listMedia(s, igId, since, "id,media_type,timestamp,permalink");
    throw e;
  }
}

/** Stories encore en ligne (Instagram ne les garde que 24 h). null si indisponible. */
async function fetchLiveStories(s: Session, igId: string): Promise<number | null> {
  try {
    let count = 0;
    let url: string | null = graphUrl(`${igId}/stories`, { fields: "id", limit: "50" }, s);
    for (let page = 0; url && page < 3; page++) {
      const body = await getJson(url, "stories");
      count += Array.isArray(body.data) ? body.data.length : 0;
      url = nextPage(body, s);
    }
    return count;
  } catch {
    return null;
  }
}

/** Vues par reel. Une statistique en erreur est simplement ignorée, sans bloquer le reste. */
async function fetchReelViews(s: Session, reels: RawMedia[]): Promise<Map<string, number>> {
  const views = new Map<string, number>();
  const queue = reels.slice(0, MAX_REELS_WITH_INSIGHTS);
  async function worker() {
    for (let r = queue.shift(); r; r = queue.shift()) {
      try {
        const body = await getJson(graphUrl(`${r.id}/insights`, { metric: "views" }, s), "insights");
        const v = readMetric(body, "views");
        if (v !== undefined) views.set(r.id, v);
      } catch {
        // reel trop récent, permission insights absente, statistiques indisponibles… on continue.
      }
    }
  }
  await Promise.all(Array.from({ length: INSIGHTS_CONCURRENCY }, worker));
  return views;
}

export interface ReadResult {
  igUserId: string;
  igScopedId: string | null;
  summary: InstagramSummary;
}

/** Lecture unique : compte, médias des 7 derniers jours, stories en ligne, vues des reels. */
export async function readAccount(token: string, appSecret: string): Promise<ReadResult> {
  const s: Session = { token, proof: createHmac("sha256", appSecret).update(token).digest("hex") };
  const now = Date.now();
  const account = await fetchAccount(s);
  const [media, storiesLive] = await Promise.all([fetchRecentMedia(s, account.igUserId, now), fetchLiveStories(s, account.igUserId)]);
  const reels = inWindow(media, now).filter(isReel);
  const views = await fetchReelViews(s, reels);
  const n = computeNumbers(media, views, now);
  return {
    igUserId: account.igUserId,
    igScopedId: account.appScopedId,
    summary: {
      username: account.username,
      accountType: null, // non exposé par l'API côté graph.facebook.com
      followers: account.followers,
      storiesLive,
      ...n,
      fetchedAt: new Date(now).toISOString(),
    },
  };
}
