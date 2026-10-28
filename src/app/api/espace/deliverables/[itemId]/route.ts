import { after } from "next/server";
import { head } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getClientAccount } from "@/lib/client-auth";
import { getItemForAccount } from "@/lib/journey";
import { sendDeliverableSubmitted } from "@/lib/espace-email";

// Enregistre une nouvelle version déposée (après l'envoi direct du PDF) et passe la fiche en « Déposée »
export async function POST(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const account = await getClientAccount();
  if (!account) return Response.json({ error: "Session expirée, reconnecte-toi." }, { status: 401 });

  const { itemId } = await params;
  const found = await getItemForAccount(account.id, itemId);
  if (!found || found.item.type !== "deliverable") return Response.json({ error: "Fiche introuvable" }, { status: 404 });
  if (found.item.locked || found.item.deliverable?.status === "validee") {
    return Response.json({ error: "Cette fiche ne peut plus être modifiée." }, { status: 403 });
  }

  const { pathname, fileName } = await request.json().catch(() => ({}));
  if (typeof pathname !== "string" || !pathname.startsWith(`livrables/${account.id}/${itemId}/`)) {
    return Response.json({ error: "Fichier invalide" }, { status: 400 });
  }
  let size = 0;
  try {
    const meta = await head(pathname);
    if (meta.contentType !== "application/pdf") throw new Error();
    size = meta.size;
  } catch {
    return Response.json({ error: "Le fichier n'a pas été reçu. Réessaie." }, { status: 400 });
  }

  const deliverable = await prisma.deliverable.upsert({
    where: { accountId_itemId: { accountId: account.id, itemId } },
    update: { status: "deposee" },
    create: { accountId: account.id, itemId, status: "deposee" },
    include: { _count: { select: { versions: true } } },
  });
  const number = deliverable._count.versions + 1;
  await prisma.deliverableVersion.create({
    data: { deliverableId: deliverable.id, number, pathname, fileName: String(fileName || "fiche.pdf").slice(0, 200), size },
  });

  const client = [account.firstName, account.lastName].filter(Boolean).join(" ") || account.email;
  after(async () => {
    try {
      await sendDeliverableSubmitted(client, account.email, found.item.label, number);
    } catch (err) {
      console.error("Email fiche déposée :", err);
    }
  });
  return Response.json({ ok: true });
}
