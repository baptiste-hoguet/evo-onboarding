import { headers } from "next/headers";

// Adresse publique de l'app (pour les liens dans les emails) : APP_URL, sinon l'hôte de la requête
export async function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") || "https"}://${h.get("host")}`;
}
