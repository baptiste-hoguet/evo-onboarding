import { prisma } from "@/lib/prisma";
import { runDiagnostic } from "@/lib/diagnostic/engine";
import { CONSENT_LABELS, computeScore, validatePayload } from "@/lib/diagnostic/form";
import { findFreshSnapshot, toSummary } from "@/lib/instagram/store";

const MAX_BYTES = 20_000;

// Diagnostic express (public, sans compte) : valide, calcule la contrainte n°1, enregistre le lead.
// Aucune donnée personnelle n'est écrite dans les logs.
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return Response.json({ error: "Requête trop volumineuse." }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const v = validatePayload(body);
  if (!v.ok) return Response.json({ error: v.error }, { status: v.spam ? 429 : 400 });
  const { lead } = v;

  // Lecture Instagram facultative : rattachée au lead et recopiée dans input.instagram (ignorée par le moteur).
  let snapshotId: string | null = null;
  if (lead.instagramSnapshotId) {
    const snap = await findFreshSnapshot(lead.instagramSnapshotId).catch(() => null);
    if (snap) {
      snapshotId = snap.id;
      lead.input = { ...lead.input, instagram: toSummary(snap) };
    }
  }

  let result;
  try {
    result = runDiagnostic(lead.input);
  } catch (err) {
    console.error("diagnostic: moteur en erreur", err instanceof Error ? err.name : "unknown");
    return Response.json({ error: "Le calcul a échoué. Réessaie dans un instant." }, { status: 500 });
  }

  try {
    const now = new Date();
    const row = await prisma.diagnosticLead.create({
      data: {
        firstName: lead.firstName,
        email: lead.email,
        phone: lead.phone,
        instagram: lead.instagram,
        activity: lead.activity,
        revenueRange: lead.revenueRange,
        goalRange: lead.goalRange,
        input: JSON.stringify(lead.input),
        result: JSON.stringify(result),
        constraintKey: result.constraint,
        score: computeScore(lead),
        consentCgu: true,
        consentRecontact: lead.consentRecontact,
        consentLabels: JSON.stringify({ cgu: CONSENT_LABELS.cgu, recontact: CONSENT_LABELS.recontact }),
        consentAt: now,
        utmSource: lead.utmSource,
        utmMedium: lead.utmMedium,
        utmCampaign: lead.utmCampaign,
        ...(snapshotId ? { instagramSnapshots: { connect: { id: snapshotId } } } : {}),
      },
      select: { id: true },
    });
    return Response.json({ id: row.id, result });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : "unknown";
    console.error("diagnostic: enregistrement impossible", code);
    return Response.json({ error: "Enregistrement impossible pour le moment. Réessaie dans un instant." }, { status: 503 });
  }
}
