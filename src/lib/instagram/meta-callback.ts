/** Lecture commune des callbacks Meta (désautorisation, suppression) : signed_request vérifié. */
import { instagramConfig } from "./config";
import { parseSignedRequest, type SignedRequestPayload } from "./signed-request";

const MAX_BYTES = 8_000;

export async function readSignedRequest(request: Request): Promise<SignedRequestPayload | null> {
  const cfg = instagramConfig();
  if (!cfg) return null;
  const raw = await request.text().catch(() => "");
  if (!raw || raw.length > MAX_BYTES) return null;
  let value: unknown = null;
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    try {
      value = (JSON.parse(raw) as { signed_request?: unknown }).signed_request;
    } catch {
      return null;
    }
  } else {
    value = new URLSearchParams(raw).get("signed_request");
  }
  return parseSignedRequest(value, cfg.appSecret);
}
