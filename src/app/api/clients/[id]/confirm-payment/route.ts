import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmedEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return Response.json({ error: "Client introuvable" }, { status: 404 });
  }

  await prisma.client.update({
    where: { id },
    data: {
      paymentConfirmed: true,
      currentStep: Math.max(client.currentStep, 4),
    },
  });

  await prisma.activity.create({
    data: {
      clientId: id,
      action: "Virement confirmé par l'admin",
    },
  });

  const portalUrl = `${process.env.NEXTAUTH_URL}/onboarding/${client.token}`;
  await sendPaymentConfirmedEmail(client.email, portalUrl);

  return Response.json({ success: true });
}
