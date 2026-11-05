/**
 * Connexion Instagram du Diagnostic express : « Instagram API with Unified Login »
 * (API officielle Meta, autorisation via Facebook Login for Business et une configuration
 * de connexion). Tout est masqué tant que META_APP_ID, META_APP_SECRET et
 * META_LOGIN_CONFIG_ID ne sont pas définis. Côté serveur uniquement.
 */

// Version de l'API Graph (dernière version documentée au 5 novembre 2026).
export const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v27.0";

// URL de connexion telle que générée par le tableau de bord Meta (sans version, comme dans la doc Unified Login).
export const AUTHORIZE_URL = "https://www.facebook.com/dialog/oauth";
export const GRAPH_HOST = "graph.facebook.com";
export const TOKEN_URL = `https://${GRAPH_HOST}/${GRAPH_VERSION}/oauth/access_token`;

export const STATE_COOKIE = "evo_ig_state";
export const STATE_MAX_AGE_S = 10 * 60;

// Un snapshot n'est servi au formulaire que pendant 2 h ; non relié à un lead, il est supprimé après 24 h.
export const SNAPSHOT_TTL_MS = 2 * 60 * 60 * 1000;
export const UNLINKED_RETENTION_MS = 24 * 60 * 60 * 1000;

export const SNAPSHOT_ID_RE = /^[a-z0-9]{10,40}$/i;

export interface MetaConfig {
  appId: string;
  appSecret: string;
  configId: string;
}

export function instagramConfig(): MetaConfig | null {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const configId = process.env.META_LOGIN_CONFIG_ID?.trim();
  return appId && appSecret && configId ? { appId, appSecret, configId } : null;
}

export function instagramEnabled(): boolean {
  return instagramConfig() !== null;
}

export function redirectUri(base: string): string {
  return `${base}/api/instagram/callback`;
}

/**
 * URL de connexion Unified Login : client_id, config_id (qui fixe les permissions demandées,
 * pas de scope), redirect_uri, response_type=code, state anti-CSRF. prompt=login propose
 * les deux options de connexion (Instagram et Facebook). Pas de display=popup : redirection pleine page.
 */
export function authorizeUrl(cfg: MetaConfig, base: string, state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", cfg.appId);
  url.searchParams.set("config_id", cfg.configId);
  url.searchParams.set("override_default_response_type", "true");
  url.searchParams.set("redirect_uri", redirectUri(base));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "login");
  return url.toString();
}
