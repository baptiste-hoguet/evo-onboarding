import { instagramEnabled } from "@/lib/instagram/config";
import { DiagnosticForm } from "./DiagnosticForm";

// Page publique : formulaire en 5 étapes, résultat affiché sur place après envoi.
// La connexion Instagram n'apparaît que si META_APP_ID, META_APP_SECRET et META_LOGIN_CONFIG_ID sont définis (lus au build).
export default function DiagnosticPage() {
  return <DiagnosticForm instagramEnabled={instagramEnabled()} />;
}
