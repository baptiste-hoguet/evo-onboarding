/**
 * Vérification du moteur du Diagnostic express, sans framework de test.
 * Lancer : npx tsx scripts/diagnostic-check.ts
 */

import assert from "node:assert/strict";
import {
  computeDmPrice,
  computeMonthlyGap,
  computeWeeklyCallsNeeded,
  runDiagnostic,
} from "../src/lib/diagnostic/engine";
import {
  buildCallOfferText,
  formatEur,
  formatNumber,
  formatPct,
  LESSONS,
} from "../src/lib/diagnostic/texts";
import type {
  ConstraintKey,
  DiagnosticInput,
  DiagnosticResult,
} from "../src/lib/diagnostic/types";

const NBSP = " ";

// Profil sain : chaque étape au-dessus de son seuil.
// Objectif 10 000 € à 2 000 € → 5 ventes/mois → 5 calls bookés/semaine.
const healthy: DiagnosticInput = {
  activity: "coach",
  revenueRange: "10-20k",
  goalRange: "10-20k",
  offerPrice: 2000,
  monthlyGoal: 10000,
  salesAtCurrentPrice: 10,
  clientsWithResult: "most",
  reels: 28,
  stories: 21,
  dmsSent: 100,
  newConversations: 20,
  replies: 20,
  callsBooked: 6,
  callsHeld: 5,
  offTargetCalls: 0,
  sales: 2,
  cashCollected: 4000,
  founderSaturated: false,
};

const with_ = (patch: Partial<DiagnosticInput>): DiagnosticInput => ({ ...healthy, ...patch });

const covered = new Set<ConstraintKey>();
const allResults: DiagnosticResult[] = [];
let passed = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function diag(input: DiagnosticInput): DiagnosticResult {
  const r = runDiagnostic(input);
  covered.add(r.constraint);
  allResults.push(r);
  return r;
}

const stage = (r: DiagnosticResult, label: string) => {
  const s = r.stages.find((x) => x.label === label);
  assert.ok(s, `étape « ${label} » absente`);
  return s;
};

// ---------------------------------------------------------------------------
// Formatage
// ---------------------------------------------------------------------------

check("formatage français des nombres", () => {
  assert.equal(formatEur(1200), `1${NBSP}200${NBSP}€`);
  assert.equal(formatEur(10000), `10${NBSP}000${NBSP}€`);
  assert.equal(formatEur(2.35), `2,35${NBSP}€`);
  assert.equal(formatEur(40), `40${NBSP}€`);
  assert.equal(formatPct(0.58), `58${NBSP}%`);
  assert.equal(formatPct(7 / 12), `58${NBSP}%`);
  assert.equal(formatPct(6 / 180), `3,3${NBSP}%`);
  assert.equal(formatPct(0.05), `5${NBSP}%`);
  assert.equal(formatNumber(10 / 7, 1), "1,4");
  assert.equal(formatNumber(1), "1");
  assert.equal(formatNumber(1234567), `1${NBSP}234${NBSP}567`);
});

// ---------------------------------------------------------------------------
// Calculs
// ---------------------------------------------------------------------------

check("calcul inversé", () => {
  // 10 000 / 2 000 = 5 ventes ; /0,3 = 16,7 tenus ; /0,8 = 20,8 bookés ; /4,33 = 4,8 → 5
  assert.equal(computeWeeklyCallsNeeded(2000, 10000), 5);
  // 10 ventes → 41,7 bookés/mois → 9,6 → 10
  assert.equal(computeWeeklyCallsNeeded(1000, 10000), 10);
  assert.equal(computeWeeklyCallsNeeded(0, 10000), null);
  assert.equal(computeWeeklyCallsNeeded(2000, 0), null);
  assert.equal(computeWeeklyCallsNeeded(Number.NaN, 10000), null);
  assert.equal(computeWeeklyCallsNeeded(-500, 10000), null);
});

check("prix d'un DM", () => {
  assert.equal(computeDmPrice(4000, 100), 40);
  assert.equal(computeDmPrice(1000, 3), 333.33);
  assert.equal(computeDmPrice(0, 100), null);
  assert.equal(computeDmPrice(4000, 0), null);
});

check("écart mensuel à l'objectif", () => {
  assert.equal(computeMonthlyGap(with_({ cashCollected: 0 })), 10000);
  assert.equal(computeMonthlyGap(with_({ cashCollected: 4000 })), 0);
  assert.ok(buildCallOfferText(9012).includes(`9${NBSP}000${NBSP}€`));
  assert.ok(!buildCallOfferText(0).includes("il te manque"));
});

// ---------------------------------------------------------------------------
// Une contrainte par cas
// ---------------------------------------------------------------------------

check("aucune : tout est au-dessus des seuils", () => {
  const r = diag(healthy);
  assert.equal(r.constraint, "aucune");
  assert.equal(r.weeklyCallsNeeded, 5);
  assert.equal(r.dmPrice, 40);
  assert.equal(r.lowConfidence, false);
  assert.equal(r.showCallOffer, false); // 4 000 × 4,33 ≥ 50 % de 10 000
  assert.equal(r.lesson, null);
  assert.ok(r.stages.every((s) => s.status === "ok"));
  assert.ok(r.message.includes("niveau suivant"));
});

check("ordre et contenu de la lecture complète", () => {
  const r = runDiagnostic(healthy);
  assert.deepEqual(
    r.stages.map((s) => s.key),
    [
      "offre",
      "delivrer",
      "contenu",
      "contenu",
      "messages_volume",
      "reponses",
      "conversations_calls",
      "calls_volume",
      "presence",
      "qualification",
      "closing",
      "equipe",
    ],
  );
  assert.equal(stage(r, "Calls bookés (7 jours)").threshold, 5);
  assert.equal(stage(r, "Messages envoyés (7 jours)").threshold, 50);
});

check("equipe : funnel sain mais fondateur saturé", () => {
  const r = diag(with_({ founderSaturated: true }));
  assert.equal(r.constraint, "equipe");
  assert.equal(r.pillar, "equipe");
  assert.equal(stage(r, "Le fondateur fait tout lui-même").status, "alerte");
});

check("offre : moins de 5 ventes au prix actuel", () => {
  const r = diag(with_({ salesAtCurrentPrice: 2 }));
  assert.equal(r.constraint, "offre");
  assert.equal(r.pillar, "valeur");
  assert.equal(r.lesson, LESSONS.module2);
  assert.equal(r.showCallOffer, true);
  assert.ok(r.message.startsWith("2 ventes au prix affiché"));
});

check("offre passe avant tout, même délivrer et le funnel", () => {
  const r = diag(
    with_({ salesAtCurrentPrice: 0, clientsWithResult: "none", reels: 0, founderSaturated: true }),
  );
  assert.equal(r.constraint, "offre");
  assert.ok(r.message.startsWith("Aucune vente"));
});

check("offre : 1 vente au singulier", () => {
  const r = runDiagnostic(with_({ salesAtCurrentPrice: 1 }));
  assert.ok(r.message.startsWith("1 vente au prix affiché"));
});

check("delivrer : peu de clients avec un résultat", () => {
  const r = diag(with_({ clientsWithResult: "few", reels: 0 }));
  assert.equal(r.constraint, "delivrer");
  assert.ok(r.message.startsWith("Moins d'un client sur deux"));
  const none = runDiagnostic(with_({ clientsWithResult: "none" }));
  assert.equal(none.constraint, "delivrer");
  assert.ok(none.message.startsWith("Aucun de tes clients"));
});

check("delivrer : half/most/no_clients ne déclenchent pas", () => {
  assert.equal(runDiagnostic(with_({ clientsWithResult: "half" })).constraint, "aucune");
  const nc = runDiagnostic(with_({ clientsWithResult: "no_clients" }));
  assert.equal(nc.constraint, "aucune");
  assert.equal(stage(nc, "Clients avec un résultat").status, "insuffisant");
});

check("contenu : pas assez de reels", () => {
  const r = diag(with_({ reels: 7 }));
  assert.equal(r.constraint, "contenu");
  assert.equal(r.lesson, LESSONS.module5Video);
  assert.ok(r.message.startsWith("7 reels cette semaine, soit 1 par jour."));
});

check("contenu : pas assez de stories", () => {
  const r = diag(with_({ stories: 10 }));
  assert.equal(r.constraint, "contenu");
  assert.equal(r.title, "Ta contrainte n°1 : tes stories");
  assert.ok(r.message.includes("soit 1,4 par jour"));
});

check("contenu : reels et stories bas, le plus loin du seuil gagne", () => {
  const r = runDiagnostic(with_({ reels: 26, stories: 7 }));
  assert.equal(r.title, "Ta contrainte n°1 : tes stories");
  const r2 = runDiagnostic(with_({ reels: 7, stories: 20 }));
  assert.equal(r2.title, "Ta contrainte n°1 : le volume de contenu");
});

check("messages_volume : sous le plancher de 50", () => {
  const r = diag(with_({ dmsSent: 30, replies: 6 }));
  assert.equal(r.constraint, "messages_volume");
  assert.ok(r.message.includes("Sous 50 messages"));
  assert.ok(r.message.includes(`te coûte 133${NBSP}€`)); // 4 000 / 30
  assert.ok(r.action.includes("8 messages")); // ceil(50 / 7)
});

check("messages_volume : seuil tiré du calcul inversé", () => {
  // 20 000 / 500 = 40 ventes → 39 calls/semaine ; taux conv→call 0,3 → 130 conversations
  const r = diag(with_({ offerPrice: 500, monthlyGoal: 20000, dmsSent: 100, replies: 20 }));
  assert.equal(r.weeklyCallsNeeded, 39);
  assert.equal(r.constraint, "messages_volume");
  assert.equal(stage(r, "Messages envoyés (7 jours)").threshold, 130);
  assert.ok(r.message.includes("il en faudrait au moins 130"));
});

check("messages_volume : un mauvais taux conv→call ne gonfle pas le seuil", () => {
  // 40 conversations, 2 calls (1 sur 20) : le seuil reste calculé à 1 sur 5
  const r = runDiagnostic(with_({ newConversations: 40, callsBooked: 2, callsHeld: 2 }));
  assert.equal(stage(r, "Messages envoyés (7 jours)").threshold, 50);
  assert.equal(r.constraint, "conversations_calls");
});

check("reponses : taux de réponse sous 5 %", () => {
  const r = diag(with_({ dmsSent: 180, replies: 6 }));
  assert.equal(r.constraint, "reponses");
  assert.ok(r.message.startsWith("180 messages envoyés, 6 réponses. 3,3"));
  assert.ok(r.action.includes("26 messages")); // ceil(180 / 7)
});

check("reponses : insuffisant sous 20 DM", () => {
  const r = runDiagnostic(with_({ dmsSent: 10, replies: 0 }));
  assert.equal(stage(r, "Taux de réponse").status, "insuffisant");
  assert.equal(r.constraint, "messages_volume");
});

check("conversations_calls : moins d'une conversation sur cinq", () => {
  const r = diag(with_({ newConversations: 40, callsBooked: 2, callsHeld: 2, sales: 0 }));
  assert.equal(r.constraint, "conversations_calls");
  assert.ok(r.message.startsWith("40 conversations, 2 calls bookés."));
});

check("conversations_calls : insuffisant sous 5 conversations", () => {
  const r = runDiagnostic(with_({ newConversations: 4, callsBooked: 6 }));
  assert.equal(stage(r, "Conversations → calls bookés").status, "insuffisant");
  assert.equal(r.constraint, "aucune");
  assert.equal(r.lowConfidence, true);
});

check("calls_volume : calls bookés sous le calcul inversé", () => {
  const r = diag(with_({ newConversations: 10, callsBooked: 2, callsHeld: 2, sales: 1 }));
  assert.equal(r.constraint, "calls_volume");
  assert.ok(r.message.includes(`objectif de 10${NBSP}000${NBSP}€`));
  assert.ok(r.message.includes(`offre à 2${NBSP}000${NBSP}€`));
  assert.ok(r.message.includes("5 calls à booker par semaine"));
  assert.ok(r.action.includes("3 calls de plus"));
});

check("calls_volume : sauté si prix ou objectif à 0", () => {
  for (const patch of [{ offerPrice: 0 }, { monthlyGoal: 0 }]) {
    const r = runDiagnostic(
      with_({ ...patch, newConversations: 10, callsBooked: 2, callsHeld: 2, sales: 1 }),
    );
    assert.equal(r.weeklyCallsNeeded, null);
    assert.equal(stage(r, "Calls bookés (7 jours)").status, "insuffisant");
    assert.equal(r.constraint, "aucune");
    assert.equal(r.lowConfidence, true); // présence, qualification, closing non jugeables
  }
});

check("presence : sous 80 %", () => {
  const r = diag(with_({ callsBooked: 12, callsHeld: 7, newConversations: 30, sales: 3 }));
  assert.equal(r.constraint, "presence");
  assert.equal(r.pillar, "conversion");
  assert.ok(r.message.includes(`Ta présence est à 58${NBSP}%`));
  assert.equal(r.lesson, LESSONS.module6Prequalif);
});

check("presence : plafonnée à 100 % si plus de calls tenus que bookés", () => {
  const r = runDiagnostic(with_({ callsBooked: 6, callsHeld: 8, sales: 3 }));
  assert.equal(stage(r, "Présence aux calls").value, 1);
});

check("qualification : trop de calls hors cible (closing bas)", () => {
  const r = diag(
    with_({ callsBooked: 15, callsHeld: 14, offTargetCalls: 6, sales: 1, newConversations: 50 }),
  );
  assert.equal(r.constraint, "qualification");
  assert.ok(r.message.startsWith("Tu fais du volume : 14 calls tenus. 6 étaient hors cible"));
  assert.ok(r.message.includes("Avant de juger ton closing"));
  assert.equal(r.showCallOffer, true);
});

check("qualification : closing correct", () => {
  const r = runDiagnostic(
    with_({ callsBooked: 15, callsHeld: 14, offTargetCalls: 6, sales: 5, newConversations: 50 }),
  );
  assert.equal(r.constraint, "qualification");
  assert.ok(r.message.includes("Ton closing n'est pas en cause. Ta qualification l'est."));
});

check("closing : sous 20 %, données suffisantes", () => {
  const r = diag(with_({ callsBooked: 13, callsHeld: 11, sales: 1, newConversations: 40 }));
  assert.equal(r.constraint, "closing");
  assert.equal(r.lowConfidence, false);
  assert.ok(r.message.startsWith(`Tes prospects viennent : 85${NBSP}% de présence.`));
  assert.ok(r.message.includes("1 vente sur 11 calls"));
  assert.equal(r.lesson, LESSONS.module6Logique);
  assert.equal(r.showCallOffer, true);
});

check("closing : moins de 10 calls tenus → lowConfidence", () => {
  const r = diag(with_({ callsBooked: 6, callsHeld: 5, sales: 0 }));
  assert.equal(r.constraint, "closing");
  assert.equal(r.lowConfidence, true);
  assert.ok(r.message.includes("il en faut 10"));
});

check("closing : insuffisant sous 3 calls tenus", () => {
  const r = runDiagnostic(with_({ callsBooked: 6, callsHeld: 2, sales: 0 }));
  assert.equal(stage(r, "Closing").status, "insuffisant");
  assert.equal(r.constraint, "presence"); // 2 / 6 = 33 %
});

// ---------------------------------------------------------------------------
// Cas limites
// ---------------------------------------------------------------------------

check("tout à zéro : pas de NaN, pas de division par zéro", () => {
  const zero: DiagnosticInput = {
    ...healthy,
    offerPrice: 0,
    monthlyGoal: 0,
    salesAtCurrentPrice: 0,
    clientsWithResult: "no_clients",
    reels: 0,
    stories: 0,
    dmsSent: 0,
    newConversations: 0,
    replies: 0,
    callsBooked: 0,
    callsHeld: 0,
    offTargetCalls: 0,
    sales: 0,
    cashCollected: 0,
  };
  const r = runDiagnostic(zero);
  assert.equal(r.constraint, "offre");
  assert.equal(r.dmPrice, null);
  assert.equal(r.weeklyCallsNeeded, null);
  assert.equal(r.showCallOffer, true);
  for (const s of r.stages) {
    if (s.value !== null) assert.ok(Number.isFinite(s.value), `${s.label} non fini`);
  }
  for (const label of ["Taux de réponse", "Conversations → calls bookés", "Présence aux calls", "Closing"]) {
    assert.equal(stage(r, label).value, null);
    assert.equal(stage(r, label).status, "insuffisant");
  }
  assert.ok(!/NaN|Infinity|undefined/.test(r.message + r.action));

  // Même profil vide mais offre validée : le funnel parle, sans NaN
  const r2 = runDiagnostic({ ...zero, salesAtCurrentPrice: 8 });
  assert.equal(r2.constraint, "contenu");
  assert.ok(!/NaN|Infinity|undefined/.test(r2.message + r2.action));
});

check("entrées invalides (NaN, négatives) nettoyées", () => {
  const r = runDiagnostic(
    with_({ dmsSent: Number.NaN, replies: -3, cashCollected: Number.POSITIVE_INFINITY }),
  );
  assert.equal(r.constraint, "messages_volume");
  assert.equal(r.dmPrice, null);
  assert.ok(!/NaN|Infinity/.test(r.message + r.action));
});

check("showCallOffer : écart à l'objectif", () => {
  // 1 000 × 4,33 = 4 330 < 5 000 → écart grand
  assert.equal(runDiagnostic(with_({ cashCollected: 1000 })).showCallOffer, true);
  // 1 200 × 4,33 = 5 196 ≥ 5 000
  assert.equal(runDiagnostic(with_({ cashCollected: 1200 })).showCallOffer, false);
  // objectif inconnu : pas d'écart calculable
  assert.equal(runDiagnostic(with_({ monthlyGoal: 0, cashCollected: 0 })).showCallOffer, false);
});

// ---------------------------------------------------------------------------
// Doctrine sur tous les textes produits
// ---------------------------------------------------------------------------

check("chaque ConstraintKey est couverte", () => {
  const all: ConstraintKey[] = [
    "offre",
    "delivrer",
    "contenu",
    "messages_volume",
    "reponses",
    "conversations_calls",
    "calls_volume",
    "presence",
    "qualification",
    "closing",
    "equipe",
    "aucune",
  ];
  assert.deepEqual([...covered].sort(), [...all].sort());
});

check("doctrine : textes propres, leçons publiées uniquement", () => {
  const allowedLessons = new Set<string | null>([...Object.values(LESSONS), null]);
  for (const r of allResults) {
    const text = [r.title, r.message, r.action, r.exitCriterion ?? ""].join(" ");
    assert.ok(r.title && r.message && r.action, `texte vide pour ${r.constraint}`);
    assert.ok(!/facile/i.test(text), `« facile » dans ${r.constraint}`);
    assert.ok(!/k€|en 30 jours/i.test(text), `promesse chiffrée dans ${r.constraint}`);
    assert.ok(!/NaN|Infinity|undefined|null/.test(text), `valeur brute dans ${r.constraint}`);
    assert.ok(!/\d %|\d €/.test(text), `espace sécable avant une unité dans ${r.constraint}`);
    assert.ok(allowedLessons.has(r.lesson), `leçon non publiée : ${r.lesson}`);
    assert.ok(/\d/.test(r.action), `l'action de ${r.constraint} n'a pas de chiffre`);
  }
});

console.log(`\n${passed} vérifications passées.`);
