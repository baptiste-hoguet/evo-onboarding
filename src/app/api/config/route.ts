import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const configs = await prisma.config.findMany();
  return Response.json(configs);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { offer, welcomeVideoUrl, contractUrl, guideUrl, calComUrl, usefulLinks, nexusAmount, slackInviteUrl } = body;

  // Find existing config for this offer (or global if offer is null)
  const existing = await prisma.config.findFirst({
    where: offer ? { offer } : { offer: null },
  });

  const data = offer
    ? {
        offer,
        welcomeVideoUrl: welcomeVideoUrl || null,
        contractUrl: contractUrl || null,
        guideUrl: guideUrl || null,
        calComUrl: calComUrl || null,
        usefulLinks: usefulLinks || null,
      }
    : {
        offer: null,
        nexusAmount: nexusAmount != null ? Number(nexusAmount) : null,
        slackInviteUrl: slackInviteUrl || null,
      };

  let config;
  if (existing) {
    config = await prisma.config.update({
      where: { id: existing.id },
      data,
    });
  } else {
    config = await prisma.config.create({ data });
  }

  return Response.json(config);
}
