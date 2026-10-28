import { get } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getClientAccount } from "@/lib/client-auth";

// Affiche un PDF déposé : réservé à son propriétaire ou à l'équipe connectée
export async function GET(_req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const v = await prisma.deliverableVersion.findUnique({ where: { id: versionId }, include: { deliverable: { select: { accountId: true } } } });
  if (!v) return new Response("Introuvable", { status: 404 });

  const account = await getClientAccount();
  const isOwner = account?.id === v.deliverable.accountId;
  if (!isOwner && !(await getServerSession(authOptions))) return new Response("Non autorisé", { status: 401 });

  const file = await get(v.pathname, { access: "private" });
  if (!file || file.statusCode !== 200) return new Response("Fichier introuvable", { status: 404 });
  return new Response(file.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(v.fileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
