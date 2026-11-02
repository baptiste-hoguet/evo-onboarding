import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  activityLabel,
  constraintLabel,
  filtersWhere,
  fmtDateTimeCsv,
  parseInput,
  parseResult,
  rangeLabel,
  readFilters,
} from "@/lib/diagnostic-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Une cellule CSV pour Excel FR : séparateur « ; », guillemets si besoin,
// et neutralisation des formules (=, +, -, @) saisies par les visiteurs.
function cell(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "boolean" ? (v ? "oui" : "non") : typeof v === "number" ? String(v).replace(".", ",") : v;
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const round2 = (n: number | null | undefined) => (typeof n === "number" ? Math.round(n * 100) / 100 : null);

const COLUMNS = [
  "Date", "Prénom", "Email", "Téléphone", "Instagram", "Activité", "CA actuel", "Objectif",
  "Objectif mensuel (€)", "Prix de l'offre (€)", "Contrainte n°1 (clé)", "Contrainte n°1", "Titre du résultat", "Score",
  "Prix d'un DM (€)", "Calls/semaine nécessaires", "Consentement CGU", "Consentement recontact", "Date du consentement",
  "UTM source", "UTM medium", "UTM campagne", "Calendly cliqué le", "ID",
];

// Export CSV des leads du Diagnostic express — réservé à l'équipe connectée
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Non autorisé" }, { status: 401 });

  const filters = readFilters(new URL(request.url).searchParams);
  const leads = await prisma.diagnosticLead.findMany({ where: filtersWhere(filters), orderBy: { createdAt: "desc" } });

  const lines = [COLUMNS.map(cell).join(";")];
  for (const l of leads) {
    const input = parseInput(l.input);
    const result = parseResult(l.result);
    lines.push(
      [
        fmtDateTimeCsv(l.createdAt),
        l.firstName,
        l.email,
        l.phone,
        l.instagram ? `@${l.instagram}` : null,
        activityLabel(l.activity),
        rangeLabel(l.revenueRange),
        rangeLabel(l.goalRange),
        typeof input?.monthlyGoal === "number" ? input.monthlyGoal : null,
        typeof input?.offerPrice === "number" ? input.offerPrice : null,
        l.constraintKey,
        constraintLabel(l.constraintKey),
        result?.title || null,
        l.score,
        round2(result?.dmPrice),
        round2(result?.weeklyCallsNeeded),
        l.consentCgu,
        l.consentRecontact,
        l.consentAt ? fmtDateTimeCsv(l.consentAt) : null,
        l.utmSource,
        l.utmMedium,
        l.utmCampaign,
        l.calendlyClickAt ? fmtDateTimeCsv(l.calendlyClickAt) : null,
        l.id,
      ]
        .map(cell)
        .join(";"),
    );
  }

  const day = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }); // AAAA-MM-JJ
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diagnostics-evo-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
