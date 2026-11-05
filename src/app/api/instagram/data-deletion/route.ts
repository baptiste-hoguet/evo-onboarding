import { baseUrl } from "@/lib/base-url";
import { readSignedRequest } from "@/lib/instagram/meta-callback";
import { deleteInstagramDataForUser, recordDeletion } from "@/lib/instagram/store";

// Demande de suppression des données envoyée par Meta. Suppression immédiate, puis
// réponse attendue par Meta : { url, confirmation_code } (page de suivi publique).
export async function POST(request: Request) {
  const payload = await readSignedRequest(request);
  if (!payload) return Response.json({ error: "signed_request invalide." }, { status: 400 });
  try {
    const deleted = await deleteInstagramDataForUser(payload.user_id);
    const code = await recordDeletion(deleted);
    const base = await baseUrl();
    return Response.json({ url: `${base}/confidentialite/suppression?code=${code}`, confirmation_code: code });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : "unknown";
    console.error("instagram: suppression non traitée", code);
    return Response.json({ error: "Suppression impossible pour le moment." }, { status: 503 });
  }
}
