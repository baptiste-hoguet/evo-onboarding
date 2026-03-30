import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
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

  await prisma.activity.create({
    data: {
      clientId: id,
      action: "Lien d'accès renvoyé",
    },
  });

  const baseUrl = request.nextUrl.origin;
  const link = `${baseUrl}/onboarding/${client.token}`;

  await sendWelcomeEmail(client.email, link);

  return Response.json({ success: true, link });
}
