import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const MAX_BYTES = 300_000;

// Sauvegarde automatique d'un brouillon
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const raw = await request.text();
  if (raw.length > MAX_BYTES) {
    return Response.json({ error: "Réponses trop volumineuses" }, { status: 413 });
  }

  let body: { answers?: unknown; section?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
    return Response.json({ error: "Réponses invalides" }, { status: 400 });
  }

  const current = await prisma.questionnaireResponse.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!current) return Response.json({ error: "Questionnaire introuvable" }, { status: 404 });
  if (current.status === "submitted") {
    return Response.json({ error: "Questionnaire déjà envoyé" }, { status: 409 });
  }

  const section = Number.isInteger(body.section) ? Math.max(0, Math.min(9, body.section as number)) : undefined;
  await prisma.questionnaireResponse.update({
    where: { id },
    data: { answers: JSON.stringify(body.answers), ...(section !== undefined && { section }) },
  });
  return Response.json({ ok: true });
}
