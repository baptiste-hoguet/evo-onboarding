import { prisma } from "@/lib/prisma";

// Clic sur le bouton Calendly depuis le résultat (appelé en sendBeacon, sans attendre la réponse).
// On garde la date du premier clic.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return Response.json({ error: "Identifiant invalide." }, { status: 400 });

  try {
    await prisma.diagnosticLead.updateMany({
      where: { id, calendlyClickAt: null },
      data: { calendlyClickAt: new Date() },
    });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : "unknown";
    console.error("diagnostic: clic Calendly non enregistré", code);
    return Response.json({ ok: false }, { status: 503 });
  }
  return Response.json({ ok: true });
}
