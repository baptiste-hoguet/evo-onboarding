import { prisma } from "@/lib/prisma";
import { getClientAccount } from "@/lib/client-auth";
import { getItemForAccount } from "@/lib/journey";

// Cases déclaratives (« J'ai visionné », « Compte créé ») et créneau réservé
export async function POST(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const account = await getClientAccount();
  if (!account) return Response.json({ error: "Session expirée, reconnecte-toi." }, { status: 401 });

  const { itemId } = await params;
  const found = await getItemForAccount(account.id, itemId);
  if (!found || !["checkbox", "booking"].includes(found.item.type)) return Response.json({ error: "Élément introuvable" }, { status: 404 });
  if (found.item.locked) return Response.json({ error: "Cet élément n'est pas encore débloqué." }, { status: 403 });

  const { done } = await request.json().catch(() => ({}));
  const doneAt = done ? new Date() : null;
  await prisma.itemProgress.upsert({
    where: { accountId_itemId: { accountId: account.id, itemId } },
    update: { doneAt },
    create: { accountId: account.id, itemId, doneAt },
  });
  return Response.json({ ok: true, doneAt });
}
