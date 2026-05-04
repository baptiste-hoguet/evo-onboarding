import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(clients);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { email, offer, firstName, lastName, paymentSchedule } = body;

  if (!email || !offer) {
    return Response.json(
      { error: "Email et offre sont requis" },
      { status: 400 }
    );
  }

  if (!["AGORA", "NEXUS", "ATLAS"].includes(offer)) {
    return Response.json({ error: "Offre invalide" }, { status: 400 });
  }

  const token = createId();

  const client = await prisma.client.create({
    data: {
      email,
      offer,
      firstName: firstName || null,
      lastName: lastName || null,
      paymentSchedule: paymentSchedule || "1x",
      token,
    },
  });

  await prisma.activity.create({
    data: {
      clientId: client.id,
      action: "Client créé",
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
  const link = `${baseUrl}/onboarding/${token}`;

  let emailSent = true;
  try {
    await sendWelcomeEmail(email, link);
  } catch (err) {
    console.error("Email non envoyé :", err);
    emailSent = false;
  }

  return Response.json({ ...client, link, emailSent }, { status: 201 });
}
