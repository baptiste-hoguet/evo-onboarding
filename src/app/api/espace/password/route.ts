import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getClientAccount, sessionCookie } from "@/lib/client-auth";

// Changement de mot de passe : déconnecte les autres appareils (sessionVersion + 1)
export async function POST(request: Request) {
  const account = await getClientAccount();
  if (!account) return Response.json({ error: "Session expirée, reconnecte-toi." }, { status: 401 });

  const { current, next } = await request.json().catch(() => ({}));
  if (typeof current !== "string" || !(await bcrypt.compare(current, account.passwordHash))) {
    return Response.json({ error: "Ton mot de passe actuel est incorrect." }, { status: 400 });
  }
  if (typeof next !== "string" || next.length < 8) {
    return Response.json({ error: "Ton nouveau mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }
  const updated = await prisma.clientAccount.update({
    where: { id: account.id },
    data: { passwordHash: await bcrypt.hash(next, 10), sessionVersion: { increment: 1 } },
  });
  (await cookies()).set(sessionCookie(updated.id, updated.sessionVersion));
  return Response.json({ ok: true });
}
