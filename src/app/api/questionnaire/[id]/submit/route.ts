import { prisma } from "@/lib/prisma";
import { NextRequest, after } from "next/server";
import { generateQuestionnaireSummary } from "@/lib/questionnaire-summary";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { generatePassword, sessionCookie } from "@/lib/client-auth";
import { defaultTemplateId } from "@/lib/journey";
import { sendSpaceCreated } from "@/lib/espace-email";
import { baseUrl } from "@/lib/base-url";

// Laisse le temps à la synthèse IA lancée après la réponse
export const maxDuration = 120;

const MAX_BYTES = 600_000;
const str = (v: unknown, max = 200) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

// Envoi final : fige les réponses et leur version lisible
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const raw = await request.text();
  if (raw.length > MAX_BYTES) {
    return Response.json({ error: "Réponses trop volumineuses" }, { status: 413 });
  }

  let body: { answers?: Record<string, unknown>; readable?: unknown; figures?: unknown; route?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }
  const a = body.answers;
  if (!a || typeof a !== "object" || Array.isArray(a) || !Array.isArray(body.readable)) {
    return Response.json({ error: "Réponses invalides" }, { status: 400 });
  }

  const current = await prisma.questionnaireResponse.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!current) return Response.json({ error: "Questionnaire introuvable" }, { status: 404 });
  if (current.status === "submitted") return Response.json({ ok: true, already: true });

  const email = str(a["3.email"])?.toLowerCase() ?? null;
  await prisma.questionnaireResponse.update({
    where: { id },
    data: {
      status: "submitted",
      submittedAt: new Date(),
      answers: JSON.stringify(a),
      readable: JSON.stringify({ reponses: body.readable, chiffres: Array.isArray(body.figures) ? body.figures : [] }),
      firstName: str(a["1.prenom"]),
      lastName: str(a["1.nom"]),
      email,
      brand: str(a["2.v"]),
      route: str(body.route),
    },
  });

  // Synthèse IA en arrière-plan : le client n'attend pas
  after(async () => {
    try {
      await generateQuestionnaireSummary(id);
    } catch (err) {
      console.error("Synthèse IA questionnaire :", err);
    }
  });

  // Espace client : création du compte (identifiant = email) et connexion immédiate
  let account: { email: string; password?: string; existing?: boolean } | null = null;
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    const existing = await prisma.clientAccount.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      account = { email, existing: true };
    } else {
      const password = generatePassword();
      const created = await prisma.clientAccount.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(password, 10),
          firstName: str(a["1.prenom"]),
          lastName: str(a["1.nom"]),
          brand: str(a["2.v"]),
          questionnaireId: id,
          templateId: await defaultTemplateId(),
          lastLoginAt: new Date(),
        },
      });
      (await cookies()).set(sessionCookie(created.id, created.sessionVersion));
      account = { email, password };
      const url = await baseUrl();
      after(async () => {
        try {
          await sendSpaceCreated(email, created.firstName, password, url);
        } catch (err) {
          console.error("Email accès espace client :", err);
        }
      });
    }
  }

  return Response.json({ ok: true, account });
}
