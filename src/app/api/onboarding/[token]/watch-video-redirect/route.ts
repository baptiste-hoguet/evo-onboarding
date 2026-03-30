import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const client = await prisma.client.findUnique({ where: { token } });
  if (!client) {
    return NextResponse.redirect(new URL("/", _request.url));
  }

  await prisma.client.update({
    where: { id: client.id },
    data: {
      videoWatched: true,
      currentStep: Math.max(client.currentStep, 2),
    },
  });

  await prisma.activity.create({
    data: { clientId: client.id, action: "video_watched" },
  });

  return NextResponse.redirect(
    new URL(`/onboarding/${token}`, _request.url)
  );
}
