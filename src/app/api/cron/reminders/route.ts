import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { NextRequest } from "next/server";

// Called by Vercel Cron every day
// Sends reminder to clients who haven't progressed in 48h and haven't completed onboarding
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const staleClients = await prisma.client.findMany({
    where: {
      completedAt: null,
      updatedAt: { lt: cutoff },
      currentStep: { gt: 0 },
    },
  });

  let sent = 0;
  for (const client of staleClients) {
    const portalUrl = `${process.env.NEXTAUTH_URL}/onboarding/${client.token}`;
    await sendReminderEmail(client.email, portalUrl);

    await prisma.activity.create({
      data: {
        clientId: client.id,
        action: "Relance automatique envoyée",
      },
    });

    sent++;
  }

  return Response.json({ sent, total: staleClients.length });
}
