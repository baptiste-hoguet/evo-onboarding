import { prisma } from "@/lib/prisma";

// Crée un brouillon de questionnaire (lien public, sans compte)
export async function POST() {
  const r = await prisma.questionnaireResponse.create({ data: {} });
  return Response.json({ id: r.id });
}
