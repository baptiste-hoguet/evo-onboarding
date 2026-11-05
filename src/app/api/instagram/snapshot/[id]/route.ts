import { findFreshSnapshot, toSummary } from "@/lib/instagram/store";

const NO_STORE = { "Cache-Control": "no-store" };

// Chiffres d'un snapshot Instagram pour pré-remplir le formulaire (créé il y a moins de 2 h, pas encore rattaché).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const snap = await findFreshSnapshot(id);
    if (!snap) return Response.json({ error: "Lecture Instagram expirée ou introuvable." }, { status: 404, headers: NO_STORE });
    return Response.json({ id: snap.id, instagram: toSummary(snap) }, { headers: NO_STORE });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : "unknown";
    console.error("instagram: snapshot illisible", code);
    return Response.json({ error: "Lecture impossible pour le moment." }, { status: 503, headers: NO_STORE });
  }
}
