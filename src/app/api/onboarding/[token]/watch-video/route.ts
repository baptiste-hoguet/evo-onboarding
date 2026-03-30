import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

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
      videoWatched: true,
      currentStep: Math.max(client.currentStep, 2),
    },
  });

  await prisma.activity.create({
    data: {
      clientId: client.id,
      action: "video_watched",
    },
  });

  return Response.json({ client: updatedClient });
}
