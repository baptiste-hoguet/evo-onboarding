import { readSignedRequest } from "@/lib/instagram/meta-callback";
import { deleteInstagramDataForUser } from "@/lib/instagram/store";

// Appelé par Meta quand un compte retire l'accès à l'app : on supprime ses données Instagram.
export async function POST(request: Request) {
  const payload = await readSignedRequest(request);
  if (!payload) return Response.json({ error: "signed_request invalide." }, { status: 400 });
  try {
    await deleteInstagramDataForUser(payload.user_id);
    return Response.json({ ok: true });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : "unknown";
    console.error("instagram: désautorisation non traitée", code);
    return Response.json({ ok: false }, { status: 503 });
  }
}
