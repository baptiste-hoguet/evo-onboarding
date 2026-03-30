import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { sendQuestionnaireToAdmin } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const client = await prisma.client.findUnique({ where: { token } });
  if (!client) {
    return Response.json({ error: "Client introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const { answers } = body;

  if (!answers || typeof answers !== "object") {
    return Response.json({ error: "Réponses invalides" }, { status: 400 });
  }

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: {
      questionnaire: JSON.stringify(answers),
      currentStep: Math.max(client.currentStep, 4),
    },
  });

  await prisma.activity.create({
    data: {
      clientId: client.id,
      action: "questionnaire_completed",
    },
  });

  // Envoi automatique des réponses à l'admin par email
  const clientName =
    [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
  try {
    await sendQuestionnaireToAdmin(clientName, client.email, client.offer, answers);
  } catch (err) {
    console.error("Erreur envoi email questionnaire :", err);
  }

  return Response.json({ client: updatedClient });
}
