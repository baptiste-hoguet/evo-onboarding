import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sessionCookie } from "@/lib/client-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return Response.json({ error: "Renseigne ton email et ton mot de passe." }, { status: 400 });

  const account = await prisma.clientAccount.findUnique({ where: { email } });
  const ok = !!account && (await bcrypt.compare(password, account.passwordHash));
  if (!account || !ok) return Response.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });

  await prisma.clientAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
  (await cookies()).set(sessionCookie(account.id, account.sessionVersion));
  return Response.json({ ok: true });
}
