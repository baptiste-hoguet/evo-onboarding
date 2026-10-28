import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getClientAccount } from "@/lib/client-auth";
import { getItemForAccount } from "@/lib/journey";

// Délivre un jeton d'envoi direct vers le stockage privé (PDF, 10 Mo max), uniquement pour une fiche du client connecté
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const account = await getClientAccount();
        if (!account) throw new Error("Session expirée, reconnecte-toi.");
        const itemId = clientPayload || "";
        const found = await getItemForAccount(account.id, itemId);
        if (!found || found.item.type !== "deliverable") throw new Error("Fiche introuvable.");
        if (found.item.locked) throw new Error("Cette étape n'est pas encore débloquée.");
        if (found.item.deliverable?.status === "validee") throw new Error("Cette fiche est déjà validée.");
        if (!pathname.startsWith(`livrables/${account.id}/${itemId}/`)) throw new Error("Chemin de fichier invalide.");
        const maxMB = Number(found.item.config.maxMB) || 10;
        return { allowedContentTypes: ["application/pdf"], maximumSizeInBytes: maxMB * 1024 * 1024, addRandomSuffix: true };
      },
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Envoi impossible." }, { status: 400 });
  }
}
