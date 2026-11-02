/**
 * Outils de l'admin « Diagnostics » : libellés français, lecture défensive des JSON
 * stockés dans DiagnosticLead, filtres partagés entre la liste et l'export CSV.
 */
import type { Prisma } from "@prisma/client";
import type {
  Activity,
  ClientsWithResult,
  ConstraintKey,
  DiagnosticInput,
  DiagnosticResult,
  Pillar,
  StageReading,
  StageStatus,
} from "@/lib/diagnostic/types";

// ── Libellés ────────────────────────────────────────────────────────────────

export const CONSTRAINT_LABELS: Record<ConstraintKey, string> = {
  offre: "Offre (prix)",
  delivrer: "Délivrer (résultats clients)",
  contenu: "Contenu",
  messages_volume: "Volume de messages",
  reponses: "Taux de réponse",
  conversations_calls: "Conversations → calls",
  calls_volume: "Volume de calls",
  presence: "Présence aux calls",
  qualification: "Qualification",
  closing: "Closing",
  equipe: "Équipe",
  aucune: "Aucune contrainte",
};

export const CONSTRAINT_KEYS = Object.keys(CONSTRAINT_LABELS) as ConstraintKey[];

export function isConstraintKey(v: unknown): v is ConstraintKey {
  return typeof v === "string" && (CONSTRAINT_KEYS as string[]).includes(v);
}

export function constraintLabel(key: string | null | undefined): string {
  return isConstraintKey(key) ? CONSTRAINT_LABELS[key] : key || "—";
}

export const PILLAR_LABELS: Record<Pillar, string> = {
  valeur: "Valeur",
  acquisition: "Acquisition",
  conversion: "Conversion",
  delivrer: "Délivrer",
  equipe: "Équipe",
};

const CONSTRAINT_PILLAR: Record<ConstraintKey, Pillar | null> = {
  offre: "valeur",
  delivrer: "delivrer",
  contenu: "acquisition",
  messages_volume: "acquisition",
  reponses: "acquisition",
  conversations_calls: "conversion",
  calls_volume: "conversion",
  presence: "conversion",
  qualification: "conversion",
  closing: "conversion",
  equipe: "equipe",
  aucune: null,
};

const PILLAR_BADGE: Record<Pillar, string> = {
  valeur: "bg-[#C9A84C]/15 text-[#E8C97A] border-[#C9A84C]/30",
  acquisition: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  conversion: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  delivrer: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  equipe: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

/** Classes Tailwind du badge d'une contrainte (couleur du pilier). */
export function constraintBadgeClass(key: string | null | undefined): string {
  if (!isConstraintKey(key)) return "border-[#262626] text-[#A1A1AA]";
  const pillar = CONSTRAINT_PILLAR[key];
  return pillar ? PILLAR_BADGE[pillar] : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
}

export const ACTIVITY_LABELS: Record<Activity, string> = {
  coach: "Coach",
  freelance: "Freelance",
  infopreneur: "Infopreneur",
  agence: "Agence",
  autre: "Autre",
};

export function activityLabel(v: string | null | undefined): string {
  return v && v in ACTIVITY_LABELS ? ACTIVITY_LABELS[v as Activity] : v || "—";
}

export const CLIENTS_WITH_RESULT_LABELS: Record<ClientsWithResult, string> = {
  most: "La plupart",
  half: "Environ la moitié",
  few: "Quelques-uns",
  none: "Aucun",
  no_clients: "Pas encore de clients",
};

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  ok: "OK",
  alerte: "Alerte",
  insuffisant: "Données insuffisantes",
};

export const STAGE_STATUS_BADGE: Record<StageStatus, string> = {
  ok: "border-emerald-500/30 text-emerald-400",
  alerte: "border-red-500/30 text-red-400",
  insuffisant: "border-[#262626] text-[#A1A1AA]",
};

/** "3-5k" → "3–5 k€", "20k+" → "20 k€ et +", "<1k" → "moins de 1 k€" ; sinon la valeur brute. */
export function rangeLabel(raw: string | null | undefined): string {
  if (!raw) return "—";
  const s = raw.trim();
  let m = s.match(/^(\d+(?:[.,]\d+)?)\s*k?\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*k$/i);
  if (m) return `${m[1]}–${m[2]} k€`;
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*k\s*\+$/i);
  if (m) return `${m[1]} k€ et +`;
  m = s.match(/^(?:<|-|moins de\s*)(\d+(?:[.,]\d+)?)\s*k$/i);
  if (m) return `moins de ${m[1]} k€`;
  return s;
}

// ── Formats ─────────────────────────────────────────────────────────────────

const TZ = "Europe/Paris";

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });

export const fmtDateTime = (d: Date) =>
  d.toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ });

/** Format compact pour le CSV : 02/11/2026 18:45 */
export const fmtDateTimeCsv = (d: Date) =>
  d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ });

export const fmtNumber = (n: number, maxDigits = 0) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: maxDigits });

export const fmtEur = (n: number, maxDigits = 0) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: maxDigits });

export function fmtStageValue(v: number | null, unit: StageReading["unit"]): string {
  if (v === null || !Number.isFinite(v)) return "—";
  if (unit === "pct") return `${fmtNumber(v * 100, 1)} %`;
  if (unit === "eur") return fmtEur(v, 2);
  return fmtNumber(v, 1);
}

// ── Lecture défensive des JSON ──────────────────────────────────────────────

function parseObject(json: string | null | undefined): Record<string, unknown> | null {
  if (!json) return null;
  try {
    const v: unknown = JSON.parse(json);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);

/** Chiffres déclarés : chaque champ est vérifié, les champs invalides sont ignorés. */
export function parseInput(json: string | null | undefined): Partial<DiagnosticInput> | null {
  const o = parseObject(json);
  if (!o) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "number" ? Number.isFinite(v) : typeof v === "string" || typeof v === "boolean") out[k] = v;
  }
  return out as Partial<DiagnosticInput>;
}

const PILLARS: Pillar[] = ["valeur", "acquisition", "conversion", "delivrer", "equipe"];
const STATUSES: StageStatus[] = ["ok", "alerte", "insuffisant"];
const UNITS: StageReading["unit"][] = ["pct", "count", "eur"];

function parseStage(v: unknown): StageReading | null {
  if (!v || typeof v !== "object") return null;
  const s = v as Record<string, unknown>;
  const label = str(s.label) ?? (isConstraintKey(s.key) ? CONSTRAINT_LABELS[s.key] : null);
  if (!label) return null;
  return {
    key: isConstraintKey(s.key) ? s.key : "aucune",
    pillar: PILLARS.includes(s.pillar as Pillar) ? (s.pillar as Pillar) : "acquisition",
    label,
    value: num(s.value),
    threshold: num(s.threshold),
    unit: UNITS.includes(s.unit as StageReading["unit"]) ? (s.unit as StageReading["unit"]) : "count",
    status: STATUSES.includes(s.status as StageStatus) ? (s.status as StageStatus) : "insuffisant",
  };
}

/** Résultat figé : champ par champ, avec valeurs neutres si le JSON est abîmé. */
export function parseResult(json: string | null | undefined): DiagnosticResult | null {
  const o = parseObject(json);
  if (!o) return null;
  return {
    constraint: isConstraintKey(o.constraint) ? o.constraint : "aucune",
    pillar: PILLARS.includes(o.pillar as Pillar) ? (o.pillar as Pillar) : "acquisition",
    title: str(o.title) ?? "",
    message: str(o.message) ?? "",
    action: str(o.action) ?? "",
    lesson: str(o.lesson),
    exitCriterion: str(o.exitCriterion),
    stages: Array.isArray(o.stages) ? o.stages.map(parseStage).filter((x): x is StageReading => x !== null) : [],
    lowConfidence: bool(o.lowConfidence) ?? false,
    dmPrice: num(o.dmPrice),
    weeklyCallsNeeded: num(o.weeklyCallsNeeded),
    showCallOffer: bool(o.showCallOffer) ?? false,
  };
}

/** Libellés exacts des cases cochées : {cgu, recontact}. */
export function parseConsentLabels(json: string | null | undefined): { cgu: string | null; recontact: string | null } {
  const o = parseObject(json);
  return { cgu: str(o?.cgu), recontact: str(o?.recontact) };
}

// ── Filtres (liste + export) ────────────────────────────────────────────────

export interface DiagnosticFilters {
  contrainte: ConstraintKey | null;
  recontact: boolean;
  calendly: boolean;
}

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

export function readFilters(params: RawParams): DiagnosticFilters {
  const get = (k: string) => {
    const v = params instanceof URLSearchParams ? params.get(k) : params[k];
    return Array.isArray(v) ? v[0] : v ?? undefined;
  };
  const c = get("contrainte");
  return {
    contrainte: isConstraintKey(c) ? c : null,
    recontact: get("recontact") === "1",
    calendly: get("calendly") === "1",
  };
}

export function filtersWhere(f: DiagnosticFilters): Prisma.DiagnosticLeadWhereInput {
  return {
    ...(f.contrainte ? { constraintKey: f.contrainte } : {}),
    ...(f.recontact ? { consentRecontact: true } : {}),
    ...(f.calendly ? { calendlyClickAt: { not: null } } : {}),
  };
}

export function filtersQuery(f: DiagnosticFilters): string {
  const q = new URLSearchParams();
  if (f.contrainte) q.set("contrainte", f.contrainte);
  if (f.recontact) q.set("recontact", "1");
  if (f.calendly) q.set("calendly", "1");
  const s = q.toString();
  return s ? `?${s}` : "";
}
