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
  const { firstName, lastName, phone, company, address, siret, socials, niche, objective } = body;

  if (!firstName || !lastName) {
    return Response.json(
      { error: "Le prenom et le nom sont obligatoires" },
      { status: 400 }
    );
  }

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: {
      firstName,
      lastName,
      phone: phone || null,
      company: company || null,
      address: address || null,
      siret: siret || null,
      socials: socials || null,
      niche: niche || null,
      objective: objective || null,
      currentStep: Math.max(client.currentStep, 3),
    },
  });

  await prisma.activity.create({
    data: {
      clientId: client.id,
      action: "info_updated",
    },
  });

  return Response.json({ client: updatedClient });
}
