import { cookies } from "next/headers";
import { CLIENT_COOKIE } from "@/lib/client-auth";

export async function POST() {
  (await cookies()).delete(CLIENT_COOKIE);
  return Response.json({ ok: true });
}
