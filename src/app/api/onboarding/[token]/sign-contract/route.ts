import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { sendContractSignedEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const client = await prisma.client.findUnique({ where: { token } });
  if (!client) {
    return Response.json({ error: "Client introuvable" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { signatureData } = body;

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: {
      contractSigned: true,
      signatureData: signatureData || null,
      currentStep: Math.max(client.currentStep, 5),
    },
  });

  await prisma.activity.create({
    data: {
      clientId: client.id,
      action: "contract_signed",
    },
  });

  const clientName = [client.firstName, client.lastName]
    .filter(Boolean)
    .join(" ") || client.email;
  const portalUrl = `${process.env.NEXTAUTH_URL}/onboarding/${token}`;
  await sendContractSignedEmail(client.email, clientName, portalUrl);

  return Response.json({ client: updatedClient });
}
