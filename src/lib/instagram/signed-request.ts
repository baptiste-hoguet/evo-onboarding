/**
 * Vérification du `signed_request` envoyé par Meta aux URL de désautorisation et de
 * suppression des données : "<signature>.<payload>", deux parties en base64url,
 * signature = HMAC-SHA256(payload encodé, clé secrète de l'app).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface SignedRequestPayload {
  user_id: string;
  algorithm: string;
  issued_at?: number;
  expires?: number;
  [key: string]: unknown;
}

const B64URL_RE = /^[A-Za-z0-9_-]+={0,2}$/;

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/** Renvoie le payload si la signature est valide, sinon null. Ne lève jamais. */
export function parseSignedRequest(signedRequest: unknown, secret: string): SignedRequestPayload | null {
  if (typeof signedRequest !== "string" || !secret || signedRequest.length > 4096) return null;
  const dot = signedRequest.indexOf(".");
  if (dot <= 0 || dot === signedRequest.length - 1) return null;
  const encodedSig = signedRequest.slice(0, dot);
  const encodedPayload = signedRequest.slice(dot + 1);
  if (!B64URL_RE.test(encodedSig) || !B64URL_RE.test(encodedPayload)) return null;

  const sig = b64urlDecode(encodedSig);
  const expected = createHmac("sha256", secret).update(encodedPayload).digest();
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;

  let data: unknown;
  try {
    data = JSON.parse(b64urlDecode(encodedPayload).toString("utf8"));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  if (typeof d.algorithm !== "string" || d.algorithm.toUpperCase() !== "HMAC-SHA256") return null;
  const uid = typeof d.user_id === "number" ? String(d.user_id) : d.user_id;
  if (typeof uid !== "string" || !/^\d{1,40}$/.test(uid)) return null;
  return { ...d, user_id: uid, algorithm: d.algorithm } as SignedRequestPayload;
}

/** Fabrique un signed_request (tests uniquement). */
export function signRequestForTest(payload: Record<string, unknown>, secret: string): string {
  const enc = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const p = enc(Buffer.from(JSON.stringify(payload), "utf8"));
  const s = enc(createHmac("sha256", secret).update(p).digest());
  return `${s}.${p}`;
}
