import { instagramEnabled, instagramPublic } from "@/lib/instagram/config";
import { DiagnosticForm } from "./DiagnosticForm";

// Page publique : formulaire en 5 étapes, résultat affiché sur place après envoi.
// La connexion Instagram n'apparaît que si META_APP_ID, META_APP_SECRET et META_LOGIN_CONFIG_ID sont définis (lus au build),
// et, tant que l'app n'est pas validée par Meta, seulement avec META_INSTAGRAM_PUBLIC=1 ou ?beta=instagram.
export default function DiagnosticPage() {
  return <DiagnosticForm instagramEnabled={instagramEnabled()} instagramPublic={instagramPublic()} />;
}
