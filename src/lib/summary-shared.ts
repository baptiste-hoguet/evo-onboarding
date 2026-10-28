import type { Summary } from "@/lib/questionnaire-summary";

// Rubriques de la synthèse IA, dans l'ordre d'affichage (page coach + PDF)
export const SUMMARY_BLOCKS: [keyof Summary, string][] = [
  ["profil", "Profil et business"], ["offre", "Offre"], ["avatar", "Marché et avatar"],
  ["acquisition", "Contenu et acquisition"], ["vente", "Publicité et vente"], ["objectifs", "Objectifs et mindset"],
  ["forces", "Forces"], ["vigilance", "Points de vigilance"],
];

export type PdfInput = {
  name: string;
  brand: string | null;
  route: string | null;
  submittedAt: string | null;
  figures: [string, string][];
  summary: Summary;
};
