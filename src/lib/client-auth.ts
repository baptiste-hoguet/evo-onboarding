import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Session de l'espace client : cookie signé « id.version.expiration.signature » (HMAC-SHA256)
export const CLIENT_COOKIE = "evo_espace";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function secret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET manquant");
  return s;
}
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function sessionCookie(accountId: string, version: number) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${accountId}.${version}.${exp}`;
  return {
    name: CLIENT_COOKIE,
    value: `${payload}.${sign(payload)}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

function verify(token: string | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [id, v, exp, sig] = parts;
  const expected = Buffer.from(sign(`${id}.${v}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return { id, version: Number(v) };
}

// Compte connecté (ou null). La version invalide les anciennes sessions après un changement de mot de passe.
export async function getClientAccount() {
  const s = verify((await cookies()).get(CLIENT_COOKIE)?.value);
  if (!s) return null;
  const account = await prisma.clientAccount.findUnique({ where: { id: s.id } });
  if (!account || account.sessionVersion !== s.version) return null;
  return account;
}

const WORDS = "orbite cuivre lagune saphir boreal comete falaise cedre ardoise velours horizon minuit granit lumen azur rivage etoile pollen sommet ambre opale nacre zephyr indigo".split(" ");

// Mot de passe lisible et aléatoire, ex. « Cuivre-Lagune-Saphir-47 »
export function generatePassword() {
  const w = () => { const x = WORDS[randomInt(WORDS.length)]; return x[0].toUpperCase() + x.slice(1); };
  return `${w()}-${w()}-${w()}-${randomInt(10, 100)}`;
}
