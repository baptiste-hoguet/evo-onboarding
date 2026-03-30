import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { sendPaymentConfirmedEmail } from "@/lib/email";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const client = await prisma.client.findUnique({ where: { token } });
  if (!client) {
    return Response.json({ error: "Client introuvable" }, { status: 404 });
  }

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: {
      paymentSent: true,
      paymentConfirmed: true,
      currentStep: Math.max(client.currentStep, 6),
    },
  });

  await prisma.activity.create({
    data: {
      clientId: client.id,
      action: "payment_attested",
    },
  });

  const portalUrl = `${process.env.NEXTAUTH_URL}/onboarding/${token}`;
  await sendPaymentConfirmedEmail(client.email, portalUrl);

  return Response.json({ client: updatedClient });
}
