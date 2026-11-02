/**
 * Moteur du Diagnostic express : règles fixes, aucune IA (PLAN.md, sections 2 et 6).
 *
 * Diagnostic ponctuel sur les 7 derniers jours (pas de suivi quotidien).
 *
 * Ordre de lecture :
 * 1. Valeur : moins de 5 ventes au prix actuel → `offre`, quoi qu'il arrive.
 * 2. Délivrer : moins d'un client sur deux avec un résultat (`few` ou `none`)
 *    → `delivrer`. `no_clients` ne déclenche pas cette règle.
 * 3. Funnel, de l'amont vers l'aval, on prend la PREMIÈRE étape en alerte :
 *    contenu → messages_volume → reponses → conversations_calls → calls_volume
 *    → presence → qualification → closing.
 *    Une étape « insuffisant » (pas assez de données) est sautée.
 * 4. Égalité : la lecture ordonnée ne laisse jamais deux étapes à égalité.
 *    La règle « l'indicateur le plus loin de son seuil gagne » (PLAN.md 6.4)
 *    ne sert qu'à l'intérieur de l'étape contenu, qui a deux indicateurs
 *    (reels et stories) : si les deux sont en alerte, on garde celui dont le
 *    rapport valeur ÷ seuil est le plus bas (reels en cas d'égalité stricte).
 * 5. Tout est au-dessus des seuils et le fondateur est saturé → `equipe`.
 * 6. Sinon → `aucune`.
 */

import { buildTexts, type TextContext } from "./texts";
import type {
  ConstraintKey,
  DiagnosticInput,
  DiagnosticResult,
  Pillar,
  StageReading,
} from "./types";

// ---------------------------------------------------------------------------
// Seuils (PLAN.md, section 6)
// ---------------------------------------------------------------------------

export const THRESHOLDS = {
  salesAtCurrentPrice: 5, // Valeur : < 5 ventes au prix actuel
  reelsPerDay: 4, // Contenu : < 4 reels par jour (28 / semaine)
  storiesPerDay: 3, // Contenu : < 3 stories par jour (21 / semaine)
  dmsPerWeekFloor: 50, // Messages : plancher absolu par semaine
  replyRate: 0.05, // Réponses : < 5 %
  conversationToCall: 1 / 5, // Conversations → calls : < 1 sur 5
  presence: 0.8, // Présence : < 80 %
  offTargetRate: 1 / 5, // Qualification : > 1 call hors cible sur 5
  closing: 0.2, // Closing : < 20 %
} as const;

/** Minimum de données avant de juger une étape. */
export const MIN_DATA = {
  dmsForReplyRate: 20,
  conversationsForCallRate: 5,
  callsBookedForPresence: 3,
  callsHeldForQualification: 3,
  callsHeldForClosing: 3,
  callsHeldForConfidentClosing: 10, // sous 10 calls tenus, closing jugé avec lowConfidence
} as const;

/** Hypothèses du calcul inversé (Module 6, leçon 7-3). */
export const INVERSE_CALC = {
  targetClosing: 0.3,
  targetPresence: 0.8,
  weeksPerMonth: 4.33,
} as const;

const CALL_OFFER_GAP_RATIO = 0.5; // cash mensualisé < 50 % de l'objectif → écart « grand »

const EPSILON = 1e-9;
const ceil = (x: number) => Math.ceil(x - EPSILON);

// ---------------------------------------------------------------------------
// Calculs exportés (réutilisables par l'interface)
// ---------------------------------------------------------------------------

function clean(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function sanitize(input: DiagnosticInput): DiagnosticInput {
  return {
    ...input,
    offerPrice: clean(input.offerPrice),
    monthlyGoal: clean(input.monthlyGoal),
    salesAtCurrentPrice: clean(input.salesAtCurrentPrice),
    reels: clean(input.reels),
    stories: clean(input.stories),
    dmsSent: clean(input.dmsSent),
    newConversations: clean(input.newConversations),
    replies: clean(input.replies),
    callsBooked: clean(input.callsBooked),
    callsHeld: clean(input.callsHeld),
    offTargetCalls: clean(input.offTargetCalls),
    sales: clean(input.sales),
    cashCollected: clean(input.cashCollected),
    founderSaturated: Boolean(input.founderSaturated),
  };
}

/** Ventes nécessaires par mois (arrondi au supérieur), ou null si prix ou objectif à 0. */
export function salesPerMonthNeeded(offerPrice: number, monthlyGoal: number): number | null {
  const price = clean(offerPrice);
  const goal = clean(monthlyGoal);
  if (price === 0 || goal === 0) return null;
  return ceil(goal / price);
}

/**
 * Calcul inversé : objectif ÷ prix = ventes / mois ; ÷ 30 % de closing = calls tenus ;
 * ÷ 80 % de présence = calls bookés ; ÷ 4,33 = par semaine ; arrondi au supérieur.
 * Le calcul part des ventes non arrondies (l'arrondi n'a lieu qu'à la fin).
 */
export function computeWeeklyCallsNeeded(offerPrice: number, monthlyGoal: number): number | null {
  const price = clean(offerPrice);
  const goal = clean(monthlyGoal);
  if (price === 0 || goal === 0) return null;
  const salesPerMonth = goal / price;
  const callsHeldPerMonth = salesPerMonth / INVERSE_CALC.targetClosing;
  const callsBookedPerMonth = callsHeldPerMonth / INVERSE_CALC.targetPresence;
  return ceil(callsBookedPerMonth / INVERSE_CALC.weeksPerMonth);
}

/** Prix d'un DM = cash encaissé ÷ DM envoyés (null si l'un des deux vaut 0). */
export function computeDmPrice(cashCollected: number, dmsSent: number): number | null {
  const cash = clean(cashCollected);
  const dms = clean(dmsSent);
  if (cash === 0 || dms === 0) return null;
  return Math.round((cash / dms) * 100) / 100;
}

/** Écart mensuel à l'objectif = objectif − cash de la semaine × 4,33 (≥ 0). */
export function computeMonthlyGap(input: DiagnosticInput): number {
  const i = sanitize(input);
  return Math.max(0, i.monthlyGoal - i.cashCollected * INVERSE_CALC.weeksPerMonth);
}

/**
 * Seuil de DM par semaine.
 *
 * Règle retenue : on ne peut pas ouvrir N conversations avec moins de N messages.
 * - conversations nécessaires = calls à booker par semaine ÷ taux conversations → calls,
 *   où le taux est celui de l'utilisateur s'il est jugeable (≥ 5 conversations),
 *   mais jamais moins que le repère 1 sur 5 : un mauvais taux est traité plus bas,
 *   à l'étape `conversations_calls`, il ne doit pas gonfler le seuil de messages ;
 * - seuil = max(50, conversations nécessaires). 50 / semaine (≈ 7 / jour) est le
 *   plancher absolu, et le seul seuil quand le calcul inversé est impossible.
 * Ce seuil ne dépend pas du taux DM → réponse de l'utilisateur : sinon il
 * absorberait les problèmes de message, traités à l'étape `reponses`.
 */
function dmsThreshold(
  i: DiagnosticInput,
  weeklyCallsNeeded: number | null,
): { threshold: number; conversationsNeeded: number | null } {
  if (weeklyCallsNeeded === null) {
    return { threshold: THRESHOLDS.dmsPerWeekFloor, conversationsNeeded: null };
  }
  const ownRate =
    i.newConversations >= MIN_DATA.conversationsForCallRate
      ? i.callsBooked / i.newConversations
      : 0;
  const rate = Math.min(1, Math.max(ownRate, THRESHOLDS.conversationToCall));
  const conversationsNeeded = ceil(weeklyCallsNeeded / rate);
  return {
    threshold: Math.max(THRESHOLDS.dmsPerWeekFloor, conversationsNeeded),
    conversationsNeeded,
  };
}

// ---------------------------------------------------------------------------
// Lecture des étapes
// ---------------------------------------------------------------------------

type Direction = "min" | "max"; // min : alerte sous le seuil ; max : alerte au-dessus

interface StageSpec {
  key: ConstraintKey;
  pillar: Pillar;
  label: string;
  unit: StageReading["unit"];
  value: number | null;
  threshold: number | null;
  enoughData: boolean;
  direction: Direction;
}

function read(spec: StageSpec): StageReading {
  let status: StageReading["status"];
  if (!spec.enoughData || spec.value === null || spec.threshold === null) {
    status = "insuffisant";
  } else if (spec.direction === "min") {
    status = spec.value < spec.threshold ? "alerte" : "ok";
  } else {
    status = spec.value > spec.threshold ? "alerte" : "ok";
  }
  return {
    key: spec.key,
    pillar: spec.pillar,
    label: spec.label,
    value: spec.value,
    threshold: spec.threshold,
    unit: spec.unit,
    status,
  };
}

const ratio = (num: number, den: number, cap = true): number | null =>
  den > 0 ? (cap ? Math.min(1, num / den) : num / den) : null;

// ---------------------------------------------------------------------------
// Moteur
// ---------------------------------------------------------------------------

export function runDiagnostic(rawInput: DiagnosticInput): DiagnosticResult {
  const i = sanitize(rawInput);

  const weeklyCallsNeeded = computeWeeklyCallsNeeded(i.offerPrice, i.monthlyGoal);
  const dmPrice = computeDmPrice(i.cashCollected, i.dmsSent);
  const dms = dmsThreshold(i, weeklyCallsNeeded);

  // Valeur et Délivrer
  const offre = read({
    key: "offre",
    pillar: "valeur",
    label: "Ventes au prix actuel",
    unit: "count",
    value: i.salesAtCurrentPrice,
    threshold: THRESHOLDS.salesAtCurrentPrice,
    enoughData: true,
    direction: "min",
  });

  const delivrer: StageReading = {
    key: "delivrer",
    pillar: "delivrer",
    label: "Clients avec un résultat",
    value: null, // réponse déclarative, pas de chiffre mesuré
    threshold: 0.5,
    unit: "pct",
    status:
      i.clientsWithResult === "no_clients"
        ? "insuffisant"
        : i.clientsWithResult === "few" || i.clientsWithResult === "none"
          ? "alerte"
          : "ok",
  };

  // Funnel, de l'amont vers l'aval
  const reels = read({
    key: "contenu",
    pillar: "acquisition",
    label: "Reels par jour",
    unit: "count",
    value: i.reels / 7,
    threshold: THRESHOLDS.reelsPerDay,
    enoughData: true,
    direction: "min",
  });
  const stories = read({
    key: "contenu",
    pillar: "acquisition",
    label: "Stories par jour",
    unit: "count",
    value: i.stories / 7,
    threshold: THRESHOLDS.storiesPerDay,
    enoughData: true,
    direction: "min",
  });
  const messages = read({
    key: "messages_volume",
    pillar: "acquisition",
    label: "Messages envoyés (7 jours)",
    unit: "count",
    value: i.dmsSent,
    threshold: dms.threshold,
    enoughData: true,
    direction: "min",
  });
  const reponses = read({
    key: "reponses",
    pillar: "acquisition",
    label: "Taux de réponse",
    unit: "pct",
    value: ratio(i.replies, i.dmsSent),
    threshold: THRESHOLDS.replyRate,
    enoughData: i.dmsSent >= MIN_DATA.dmsForReplyRate,
    direction: "min",
  });
  const conversationsCalls = read({
    key: "conversations_calls",
    pillar: "acquisition",
    label: "Conversations → calls bookés",
    unit: "pct",
    value: ratio(i.callsBooked, i.newConversations),
    threshold: THRESHOLDS.conversationToCall,
    enoughData: i.newConversations >= MIN_DATA.conversationsForCallRate,
    direction: "min",
  });
  const callsVolume = read({
    key: "calls_volume",
    pillar: "acquisition",
    label: "Calls bookés (7 jours)",
    unit: "count",
    value: i.callsBooked,
    threshold: weeklyCallsNeeded,
    enoughData: weeklyCallsNeeded !== null,
    direction: "min",
  });
  const presence = read({
    key: "presence",
    pillar: "conversion",
    label: "Présence aux calls",
    unit: "pct",
    value: ratio(i.callsHeld, i.callsBooked),
    threshold: THRESHOLDS.presence,
    enoughData: i.callsBooked >= MIN_DATA.callsBookedForPresence,
    direction: "min",
  });
  const qualification = read({
    key: "qualification",
    pillar: "conversion",
    label: "Calls hors cible",
    unit: "pct",
    value: ratio(i.offTargetCalls, i.callsHeld),
    threshold: THRESHOLDS.offTargetRate,
    enoughData: i.callsHeld >= MIN_DATA.callsHeldForQualification,
    direction: "max",
  });
  const closing = read({
    key: "closing",
    pillar: "conversion",
    label: "Closing",
    unit: "pct",
    value: ratio(i.sales, i.callsHeld),
    threshold: THRESHOLDS.closing,
    enoughData: i.callsHeld >= MIN_DATA.callsHeldForClosing,
    direction: "min",
  });

  const equipe: StageReading = {
    key: "equipe",
    pillar: "equipe",
    label: "Le fondateur fait tout lui-même",
    value: null,
    threshold: null,
    unit: "count",
    status: i.founderSaturated ? "alerte" : "ok",
  };

  const funnel = [
    reels,
    stories,
    messages,
    reponses,
    conversationsCalls,
    callsVolume,
    presence,
    qualification,
    closing,
  ];
  const stages = [offre, delivrer, ...funnel, equipe];

  // Choix de la contrainte
  let constraint: ConstraintKey;
  if (offre.status === "alerte") {
    constraint = "offre";
  } else if (delivrer.status === "alerte") {
    constraint = "delivrer";
  } else {
    const first = funnel.find((s) => s.status === "alerte");
    if (first) constraint = first.key;
    else constraint = i.founderSaturated ? "equipe" : "aucune";
  }

  // Étape contenu : reels ou stories (le plus loin de son seuil, PLAN.md 6.4)
  let contenuFocus: TextContext["contenuFocus"] = "reels";
  if (reels.status !== "alerte" && stories.status === "alerte") contenuFocus = "stories";
  else if (reels.status === "alerte" && stories.status === "alerte") {
    const reelsGap = i.reels / 7 / THRESHOLDS.reelsPerDay;
    const storiesGap = i.stories / 7 / THRESHOLDS.storiesPerDay;
    contenuFocus = storiesGap < reelsGap ? "stories" : "reels";
  }

  const insufficientStages = funnel.filter((s) => s.status === "insuffisant").length;
  const lowConfidence =
    (constraint === "closing" && i.callsHeld < MIN_DATA.callsHeldForConfidentClosing) ||
    ((constraint === "aucune" || constraint === "equipe") && insufficientStages > 0);

  const pillarByKey: Record<ConstraintKey, Pillar> = {
    offre: "valeur",
    delivrer: "delivrer",
    contenu: "acquisition",
    messages_volume: "acquisition",
    reponses: "acquisition",
    conversations_calls: "acquisition",
    calls_volume: "acquisition",
    presence: "conversion",
    qualification: "conversion",
    closing: "conversion",
    equipe: "equipe",
    aucune: "conversion", // pas de pilier en défaut : on pointe le niveau suivant (closing 30 %)
  };

  const texts = buildTexts(constraint, {
    input: i,
    weeklyCallsNeeded,
    salesPerMonthNeeded: salesPerMonthNeeded(i.offerPrice, i.monthlyGoal),
    dmPrice,
    dmsThreshold: dms.threshold,
    conversationsNeeded: dms.conversationsNeeded,
    contenuFocus,
    presenceRatio: presence.status === "insuffisant" ? null : presence.value,
    closingOk: closing.status === "insuffisant" ? null : closing.status === "ok",
    lowConfidence,
    insufficientStages,
  });

  // Proposition d'appel : écart à l'objectif grand, ou contrainte où un regard
  // extérieur aide le plus (offre, qualification, closing). Toujours calculée,
  // l'interface l'affiche seulement avec l'accord de contact.
  const largeGap =
    i.monthlyGoal > 0 &&
    i.cashCollected * INVERSE_CALC.weeksPerMonth < CALL_OFFER_GAP_RATIO * i.monthlyGoal;
  const showCallOffer =
    largeGap || constraint === "offre" || constraint === "closing" || constraint === "qualification";

  return {
    constraint,
    pillar: pillarByKey[constraint],
    ...texts,
    stages,
    lowConfidence,
    dmPrice,
    weeklyCallsNeeded,
    showCallOffer,
  };
}
