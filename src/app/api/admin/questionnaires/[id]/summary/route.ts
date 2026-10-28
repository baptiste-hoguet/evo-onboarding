import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateQuestionnaireSummary } from "@/lib/questionnaire-summary";

export const maxDuration = 120;

// (Re)génère la synthèse IA — réservé à l'équipe connectée (consomme des tokens DeepSeek)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const summary = await generateQuestionnaireSummary(id);
    return Response.json({ summary });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur inconnue" }, { status: 500 });
  }
}
