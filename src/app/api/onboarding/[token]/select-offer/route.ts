import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

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
  const { offer } = body;

  if (!offer || !["AGORA", "NEXUS", "ATLAS"].includes(offer)) {
    return Response.json({ error: "Offre invalide" }, { status: 400 });
  }

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: {
      offer,
      currentStep: Math.max(client.currentStep, 1),
    },
  });

  await prisma.activity.create({
    data: {
      clientId: client.id,
      action: `offer_selected:${offer}`,
    },
  });

  // Fetch config for this offer
  const config = await prisma.config.findFirst({ where: { offer } });

  return Response.json({ client: updatedClient, config });
}
