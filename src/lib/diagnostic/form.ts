/**
 * Formulaire public du Diagnostic express : options, libellés de consentement,
 * validation serveur, scoring interne et lien Calendly. Partagé client / serveur
 * (aucune dépendance Node ici).
 */
import { CALENDLY_URL } from "./config";
import type { Activity, ClientsWithResult, DiagnosticInput } from "./types";

export const MAX_NUMBER = 100_000;
export const MIN_FILL_MS = 5_000;

export const ACTIVITIES: { value: Activity; label: string }[] = [
  { value: "coach", label: "Coach" },
  { value: "freelance", label: "Freelance" },
  { value: "infopreneur", label: "Infopreneur" },
  { value: "agence", label: "Agence" },
  { value: "autre", label: "Autre" },
];

// Tranches de CA mensuel (actuel et objectif). mid = valeur retenue si pas de montant exact.
export const REVENUE_RANGES = [
  { value: "<1k", label: "Moins de 1 000 €", min: 0, mid: 500 },
  { value: "1-3k", label: "1 000 à 3 000 €", min: 1_000, mid: 2_000 },
  { value: "3-5k", label: "3 000 à 5 000 €", min: 3_000, mid: 4_000 },
  { value: "5-10k", label: "5 000 à 10 000 €", min: 5_000, mid: 7_500 },
  { value: "10-20k", label: "10 000 à 20 000 €", min: 10_000, mid: 15_000 },
  { value: ">20k", label: "Plus de 20 000 €", min: 20_000, mid: 25_000 },
] as const;

export type RevenueRange = (typeof REVENUE_RANGES)[number]["value"];

export const CLIENTS_WITH_RESULT: { value: ClientsWithResult; label: string }[] = [
  { value: "most", label: "La plupart" },
  { value: "half", label: "Environ la moitié" },
  { value: "few", label: "Quelques-uns" },
  { value: "none", label: "Aucun" },
  { value: "no_clients", label: "Pas encore de clients" },
];

// Libellés exacts affichés à côté des cases : enregistrés tels quels avec le lead.
export const CONSENT_LABELS = {
  cgu: "J'accepte les conditions d'utilisation et la politique de confidentialité",
  recontact: "J'accepte d'être recontacté par EVO par email au sujet de ses offres",
} as const;

// Champs chiffrés du DiagnosticInput saisis tels quels (0 .. MAX_NUMBER).
export const NUMERIC_KEYS = [
  "offerPrice",
  "salesAtCurrentPrice",
  "reels",
  "stories",
  "dmsSent",
  "newConversations",
  "replies",
  "callsBooked",
  "callsHeld",
  "offTargetCalls",
  "sales",
  "cashCollected",
] as const;

export type NumericKey = (typeof NUMERIC_KEYS)[number];

/** Corps JSON envoyé par le formulaire à POST /api/diagnostic. */
export interface DiagnosticPayload {
  firstName: string;
  email: string;
  phone?: string;
  instagram?: string;
  activity: Activity;
  revenueRange: RevenueRange;
  goalRange: RevenueRange;
  goalExact?: number | null;
  clientsWithResult: ClientsWithResult;
  founderSaturated: boolean;
  consentCgu: boolean;
  consentRecontact: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  website?: string; // pot de miel : doit rester vide
  elapsedMs: number; // temps passé sur le formulaire
  numbers: Record<NumericKey, number>;
  instagramSnapshotId?: string; // lecture Instagram à rattacher (facultatif)
}

export interface ValidLead {
  firstName: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  activity: Activity;
  revenueRange: RevenueRange;
  goalRange: RevenueRange;
  consentRecontact: boolean;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  instagramSnapshotId: string | null;
  input: DiagnosticInput;
}

export type Validation = { ok: true; lead: ValidLead } | { ok: false; error: string; spam?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INSTAGRAM_RE = /^[a-z0-9._]{1,30}$/;

/** "@Mon.Compte", "instagram.com/mon.compte/" → "mon.compte" */
export function normalizeInstagram(raw: string): string {
  let v = raw.trim().toLowerCase();
  const m = v.match(/instagram\.com\/([^/?#\s]+)/);
  if (m) v = m[1];
  return v.replace(/^@+/, "").replace(/\/+$/, "");
}

export function isValidInstagram(v: string) {
  return INSTAGRAM_RE.test(v);
}

export function isValidEmail(v: string) {
  return v.length <= 254 && EMAIL_RE.test(v);
}

export function isValidPhone(v: string) {
  return /^[0-9 +().-]{6,30}$/.test(v) && (v.match(/\d/g)?.length ?? 0) >= 6;
}

export function rangeFor(value: string) {
  return REVENUE_RANGES.find((r) => r.value === value);
}

/** Tranche correspondant à un montant mensuel exact. */
export function rangeOfAmount(amount: number): RevenueRange {
  let found: RevenueRange = REVENUE_RANGES[0].value;
  for (const r of REVENUE_RANGES) if (amount >= r.min) found = r.value;
  return found;
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
}

function num(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (v < 0 || v > MAX_NUMBER) return null;
  return Math.round(v);
}

/** Validation serveur complète du formulaire. Ne renvoie jamais de donnée personnelle dans l'erreur. */
export function validatePayload(body: unknown): Validation {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "Requête invalide." };
  const b = body as Record<string, unknown>;

  // Anti-spam : pot de miel rempli ou formulaire envoyé trop vite.
  if (typeof b.website === "string" && b.website.trim() !== "") return { ok: false, error: "Envoi refusé.", spam: true };
  if (typeof b.elapsedMs !== "number" || !Number.isFinite(b.elapsedMs) || b.elapsedMs < MIN_FILL_MS) {
    return { ok: false, error: "Envoi trop rapide. Relis tes réponses puis renvoie.", spam: true };
  }

  const firstName = str(b.firstName, 60);
  if (!firstName) return { ok: false, error: "Prénom manquant." };

  const email = str(b.email, 254)?.toLowerCase() ?? null;
  if (!email || !isValidEmail(email)) return { ok: false, error: "Email invalide." };

  let phone: string | null = null;
  if (b.phone !== undefined && b.phone !== null && b.phone !== "") {
    phone = str(b.phone, 30);
    if (!phone || !isValidPhone(phone)) return { ok: false, error: "Téléphone invalide." };
  }

  let instagram: string | null = null;
  if (typeof b.instagram === "string" && b.instagram.trim() !== "") {
    instagram = normalizeInstagram(b.instagram);
    if (!isValidInstagram(instagram)) return { ok: false, error: "Compte Instagram invalide." };
  }

  const activity = ACTIVITIES.find((a) => a.value === b.activity)?.value;
  if (!activity) return { ok: false, error: "Activité invalide." };

  const revenue = rangeFor(String(b.revenueRange));
  if (!revenue) return { ok: false, error: "CA mensuel invalide." };

  let goalExact: number | null = null;
  if (b.goalExact !== undefined && b.goalExact !== null) {
    goalExact = num(b.goalExact);
    if (goalExact === null) return { ok: false, error: "Objectif de CA invalide." };
    if (goalExact === 0) goalExact = null;
  }
  const goal = goalExact !== null ? rangeFor(rangeOfAmount(goalExact)) : rangeFor(String(b.goalRange));
  if (!goal) return { ok: false, error: "Objectif de CA invalide." };

  const clientsWithResult = CLIENTS_WITH_RESULT.find((c) => c.value === b.clientsWithResult)?.value;
  if (!clientsWithResult) return { ok: false, error: "Résultats clients invalides." };

  if (typeof b.founderSaturated !== "boolean") return { ok: false, error: "Réponse manquante : fais-tu encore tout toi-même ?" };

  if (!b.numbers || typeof b.numbers !== "object") return { ok: false, error: "Chiffres manquants." };
  const raw = b.numbers as Record<string, unknown>;
  const numbers = {} as Record<NumericKey, number>;
  for (const k of NUMERIC_KEYS) {
    const n = num(raw[k]);
    if (n === null) return { ok: false, error: "Un des chiffres est invalide : mets un nombre entre 0 et 100 000." };
    numbers[k] = n;
  }
  if (numbers.offTargetCalls > numbers.callsHeld) {
    return { ok: false, error: "Les calls hors cible ne peuvent pas dépasser les calls tenus." };
  }

  if (b.consentCgu !== true) return { ok: false, error: "Accepte les conditions d'utilisation pour continuer." };
  const consentRecontact = b.consentRecontact === true;

  const input: DiagnosticInput = {
    activity,
    revenueRange: revenue.value,
    goalRange: goal.value,
    monthlyGoal: goalExact ?? goal.mid,
    clientsWithResult,
    founderSaturated: b.founderSaturated,
    ...numbers,
  };

  return {
    ok: true,
    lead: {
      firstName,
      email,
      phone,
      instagram,
      activity,
      revenueRange: revenue.value,
      goalRange: goal.value,
      consentRecontact,
      utmSource: str(b.utmSource, 100),
      utmMedium: str(b.utmMedium, 100),
      utmCampaign: str(b.utmCampaign, 100),
      instagramSnapshotId:
        typeof b.instagramSnapshotId === "string" && /^[a-z0-9]{10,40}$/i.test(b.instagramSnapshotId) ? b.instagramSnapshotId : null,
      input,
    },
  };
}

/** Scoring interne (questionnaire uniquement, jamais affiché au coach). */
export function computeScore(lead: Pick<ValidLead, "revenueRange" | "activity" | "consentRecontact">): number {
  let score = 0;
  if (lead.revenueRange === "3-5k" || lead.revenueRange === "5-10k") score += 3;
  else if (lead.revenueRange === "10-20k") score += 2;
  if (lead.activity === "coach" || lead.activity === "infopreneur" || lead.activity === "agence") score += 2;
  if (lead.consentRecontact) score += 2;
  return score;
}

/** Lien Calendly pré-rempli, avec l'UTM campaign = clé de la contrainte. */
export function calendlyHref(firstName: string, email: string, constraintKey: string): string {
  const url = new URL(CALENDLY_URL);
  url.searchParams.set("name", firstName);
  url.searchParams.set("email", email);
  url.searchParams.set("utm_source", "diagnostic");
  url.searchParams.set("utm_medium", "evo-inc");
  url.searchParams.set("utm_campaign", constraintKey);
  return url.toString();
}
