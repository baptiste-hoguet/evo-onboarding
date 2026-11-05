/**
 * Vérification de la connexion Instagram (sans réseau ni base) : signed_request Meta,
 * calcul des chiffres des 7 derniers jours, lecture des statistiques, lecture défensive du bloc stocké.
 * Lancer : npx tsx scripts/instagram-check.ts
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { parseSignedRequest, signRequestForTest } from "../src/lib/instagram/signed-request";
import { computeNumbers, isReel, readMetric, type RawMedia } from "../src/lib/instagram/compute";
import { parseInstagramSummary } from "../src/lib/instagram/summary";
import { authorizeUrl, instagramPublic } from "../src/lib/instagram/config";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`ok  ${name}`);
}

const SECRET = "app-secret-de-test";
const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// ── signed_request ──────────────────────────────────────────────────────────
check("signed_request valide accepté", () => {
  const sr = signRequestForTest({ algorithm: "HMAC-SHA256", issued_at: 1_700_000_000, user_id: "17841400000000001" }, SECRET);
  const p = parseSignedRequest(sr, SECRET);
  assert.ok(p);
  assert.equal(p.user_id, "17841400000000001");
});

check("signed_request construit à la main (comme l'exemple PHP de Meta)", () => {
  const payload = b64url(Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", expires: 1291840400, issued_at: 1291836800, user_id: "218471" })));
  const sig = b64url(createHmac("sha256", SECRET).update(payload).digest());
  assert.equal(parseSignedRequest(`${sig}.${payload}`, SECRET)?.user_id, "218471");
  // Avec padding "=" conservé : accepté aussi.
  const padded = createHmac("sha256", SECRET).update(payload).digest("base64").replace(/\+/g, "-").replace(/\//g, "_");
  assert.equal(parseSignedRequest(`${padded}.${payload}`, SECRET)?.user_id, "218471");
});

check("user_id numérique converti en chaîne", () => {
  const sr = signRequestForTest({ algorithm: "HMAC-SHA256", user_id: 218471 }, SECRET);
  assert.equal(parseSignedRequest(sr, SECRET)?.user_id, "218471");
});

check("mauvaise clé refusée", () => {
  const sr = signRequestForTest({ algorithm: "HMAC-SHA256", user_id: "1" }, "autre-secret");
  assert.equal(parseSignedRequest(sr, SECRET), null);
});

check("payload modifié refusé", () => {
  const sr = signRequestForTest({ algorithm: "HMAC-SHA256", user_id: "1" }, SECRET);
  const [sig] = sr.split(".");
  const forged = b64url(Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", user_id: "2" })));
  assert.equal(parseSignedRequest(`${sig}.${forged}`, SECRET), null);
});

check("algorithme autre que HMAC-SHA256 refusé", () => {
  assert.equal(parseSignedRequest(signRequestForTest({ algorithm: "none", user_id: "1" }, SECRET), SECRET), null);
});

check("user_id absent ou invalide refusé", () => {
  assert.equal(parseSignedRequest(signRequestForTest({ algorithm: "HMAC-SHA256" }, SECRET), SECRET), null);
  assert.equal(parseSignedRequest(signRequestForTest({ algorithm: "HMAC-SHA256", user_id: "1 OR 1=1" }, SECRET), SECRET), null);
});

check("entrées malformées refusées sans lever", () => {
  for (const v of [undefined, null, 42, "", ".", "abc", "abc.", ".abc", "a.b.c", "é.é", "x".repeat(5000)]) {
    assert.equal(parseSignedRequest(v, SECRET), null);
  }
  const sr = signRequestForTest({ algorithm: "HMAC-SHA256", user_id: "1" }, SECRET);
  assert.equal(parseSignedRequest(sr, ""), null);
  // Payload qui n'est pas du JSON, correctement signé.
  const payload = b64url(Buffer.from("pas du json"));
  const sig = b64url(createHmac("sha256", SECRET).update(payload).digest());
  assert.equal(parseSignedRequest(`${sig}.${payload}`, SECRET), null);
});

// ── calcul des 7 derniers jours ─────────────────────────────────────────────
const NOW = Date.parse("2026-11-05T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
const media: RawMedia[] = [
  { id: "r1", media_type: "VIDEO", media_product_type: "REELS", timestamp: daysAgo(1), permalink: "https://www.instagram.com/reel/AAA/" },
  { id: "r2", media_type: "VIDEO", media_product_type: "REELS", timestamp: daysAgo(3), permalink: "https://www.instagram.com/reel/BBB/" },
  { id: "r3", media_type: "VIDEO", media_product_type: "REELS", timestamp: daysAgo(6.9), permalink: "https://www.instagram.com/reel/CCC/" },
  { id: "r-old", media_type: "VIDEO", media_product_type: "REELS", timestamp: daysAgo(8) },
  { id: "p1", media_type: "IMAGE", media_product_type: "FEED", timestamp: daysAgo(2) },
  { id: "c1", media_type: "CAROUSEL_ALBUM", media_product_type: "FEED", timestamp: daysAgo(4) },
  { id: "ad", media_type: "IMAGE", media_product_type: "AD", timestamp: daysAgo(1) },
  { id: "r1", media_type: "VIDEO", media_product_type: "REELS", timestamp: daysAgo(1) }, // doublon de pagination
  { id: "bad", media_type: "VIDEO", media_product_type: "REELS" }, // sans date
];

check("comptes reels / feed sur 7 jours (doublons, anciens, pubs exclus)", () => {
  const n = computeNumbers(media, new Map(), NOW);
  assert.equal(n.reels7d, 3);
  assert.equal(n.feed7d, 2);
  assert.equal(n.reelViewsTotal, null);
  assert.equal(n.reelViewsAvg, null);
  assert.equal(n.topReelViews, null);
});

check("vues : total, moyenne sur les reels connus, meilleur reel", () => {
  const views = new Map([["r1", 12_500], ["r2", 800], ["r-old", 999_999]]); // r3 : statistique indisponible
  const n = computeNumbers(media, views, NOW);
  assert.equal(n.reelViewsTotal, 13_300);
  assert.equal(n.reelViewsAvg, 6_650);
  assert.equal(n.topReelViews, 12_500);
  assert.equal(n.topReelPermalink, "https://www.instagram.com/reel/AAA/");
});

check("permalink hors instagram.com ignoré", () => {
  const n = computeNumbers([{ id: "x", media_product_type: "REELS", timestamp: daysAgo(1), permalink: "https://evil.example/" }], new Map([["x", 5]]), NOW);
  assert.equal(n.topReelPermalink, null);
});

check("sans media_product_type : une vidéo compte comme reel", () => {
  assert.equal(isReel({ id: "v", media_type: "VIDEO" }), true);
  assert.equal(isReel({ id: "i", media_type: "IMAGE" }), false);
  const n = computeNumbers(
    [
      { id: "v", media_type: "VIDEO", timestamp: daysAgo(1) },
      { id: "i", media_type: "IMAGE", timestamp: daysAgo(1) },
    ],
    new Map(),
    NOW,
  );
  assert.equal(n.reels7d, 1);
  assert.equal(n.feed7d, 1);
});

check("lecture de la métrique views (values[] et total_value)", () => {
  assert.equal(readMetric({ data: [{ name: "views", period: "lifetime", values: [{ value: 4321 }] }] }, "views"), 4321);
  assert.equal(readMetric({ data: [{ name: "views", total_value: { value: 77 } }] }, "views"), 77);
  assert.equal(readMetric({ data: [] }, "views"), undefined); // statistique indisponible : jeu vide, pas 0
  assert.equal(readMetric({ data: [{ name: "reach", values: [{ value: 1 }] }] }, "views"), undefined);
  assert.equal(readMetric(null, "views"), undefined);
  assert.equal(readMetric({ error: { code: 10 } }, "views"), undefined);
});

// ── bloc stocké dans DiagnosticLead.input ───────────────────────────────────
check("lecture défensive du bloc instagram", () => {
  assert.equal(parseInstagramSummary(null), null);
  assert.equal(parseInstagramSummary({ reels7d: 2 }), null);
  const s = parseInstagramSummary({ username: "coach.test", reels7d: 3, followers: -4, topReelPermalink: "javascript:alert(1)", storiesLive: 2 });
  assert.ok(s);
  assert.equal(s.followers, null);
  assert.equal(s.topReelPermalink, null);
  assert.equal(s.storiesLive, 2);
  assert.equal(s.feed7d, 0);
});

// ── URL de connexion Unified Login ──────────────────────────────────────────
check("URL de connexion : paramètres du tableau de bord Meta, sans scope ni popup", () => {
  const u = new URL(authorizeUrl({ appId: "1399056015642759", appSecret: "x", configId: "1080671358359178" }, "https://evo-inc.fr", "ST4TE"));
  assert.equal(`${u.origin}${u.pathname}`, "https://www.facebook.com/dialog/oauth");
  assert.equal(u.searchParams.get("client_id"), "1399056015642759");
  assert.equal(u.searchParams.get("config_id"), "1080671358359178");
  assert.equal(u.searchParams.get("override_default_response_type"), "true");
  assert.equal(u.searchParams.get("redirect_uri"), "https://evo-inc.fr/api/instagram/callback");
  assert.equal(u.searchParams.get("response_type"), "code");
  assert.equal(u.searchParams.get("state"), "ST4TE");
  assert.equal(u.searchParams.get("prompt"), "login");
  assert.equal(u.searchParams.has("scope"), false);
  assert.equal(u.searchParams.has("display"), false);
  assert.equal(u.searchParams.has("client_secret"), false);
});

check("carte publique seulement avec META_INSTAGRAM_PUBLIC=1", () => {
  const prev = process.env.META_INSTAGRAM_PUBLIC;
  for (const [v, expected] of [[undefined, false], ["", false], ["0", false], ["true", false], ["1", true], [" 1 ", true]] as const) {
    if (v === undefined) delete process.env.META_INSTAGRAM_PUBLIC;
    else process.env.META_INSTAGRAM_PUBLIC = v;
    assert.equal(instagramPublic(), expected, `META_INSTAGRAM_PUBLIC=${String(v)}`);
  }
  if (prev === undefined) delete process.env.META_INSTAGRAM_PUBLIC;
  else process.env.META_INSTAGRAM_PUBLIC = prev;
});

console.log(`\n${passed} vérifications OK`);
