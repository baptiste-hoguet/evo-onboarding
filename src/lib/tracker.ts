/**
 * Pushes a freshly completed onboarding client to the EVO Tracker SaaS.
 *
 * Configuration via env vars on the onboarding deployment:
 *   - TRACKER_URL              e.g. https://evo-tracker-two.vercel.app
 *   - TRACKER_WEBHOOK_SECRET   shared secret matching ONBOARDING_WEBHOOK_SECRET
 *                              on the tracker side.
 *
 * Failures are logged but never thrown — the onboarding completion flow
 * must succeed for the end user even if the tracker is temporarily down.
 */

interface OnboardingClientLike {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  siret: string | null;
  socials: string | null;
  offer: string | null;
  questionnaire: string | null;
  completedAt: Date | null;
}

export async function pushClientToTracker(
  client: OnboardingClientLike
): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.TRACKER_URL;
  const secret = process.env.TRACKER_WEBHOOK_SECRET;

  if (!url || !secret) {
    console.warn(
      "[tracker] TRACKER_URL or TRACKER_WEBHOOK_SECRET not configured — skipping push"
    );
    return { ok: false, error: "Tracker not configured" };
  }

  // Tracker requires firstName + lastName. If somehow missing, skip silently.
  if (!client.firstName || !client.lastName) {
    console.warn(
      `[tracker] client ${client.id} missing firstName/lastName — skipping push`
    );
    return { ok: false, error: "Missing name" };
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/api/integrations/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        onboardingId: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        company: client.company,
        address: client.address,
        siret: client.siret,
        socials: client.socials,
        offer: client.offer,
        questionnaire: client.questionnaire,
        completedAt: client.completedAt?.toISOString() ?? null,
      }),
      // Don't keep the request hanging forever if the tracker is unreachable.
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[tracker] push failed for ${client.email}: ${res.status} ${text}`
      );
      return { ok: false, error: `${res.status} ${text}` };
    }

    const data = await res.json().catch(() => ({}));
    console.log(
      `[tracker] push ok for ${client.email} → tracker client ${data.clientId} (${data.action})`
    );
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[tracker] push threw for ${client.email}:`, msg);
    return { ok: false, error: msg };
  }
}
