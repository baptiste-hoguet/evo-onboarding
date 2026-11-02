/**
 * Bibliothèque de textes du Diagnostic express (PLAN.md, section 7).
 *
 * Règles de rédaction (Doctrine EVO) :
 * - une seule contrainte par diagnostic ;
 * - une consigne = une phrase + un chiffre ;
 * - on promet un mécanisme, jamais un chiffre d'affaires (jamais « facile »,
 *   jamais « 10 k€ en 30 jours ») ;
 * - on ne nomme personne ;
 * - on ne renvoie qu'aux leçons publiées (modules 2, 5 et 6), sinon `null`.
 *
 * Les chiffres sont formatés à la française, avec des espaces insécables
 * (U+00A0) pour les milliers et avant « % » et « € » : « 58 % », « 1 200 € ».
 */

import type { ConstraintKey, DiagnosticInput } from "./types";

const NBSP = " ";

// ---------------------------------------------------------------------------
// Formatage des nombres
// ---------------------------------------------------------------------------

/** Nombre à la française : « 1 200 », « 1,4 ». */
export function formatNumber(value: number, maxDecimals = 0): string {
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(value * factor) / factor;
  const negative = rounded < 0;
  const [intPart, decPart] = Math.abs(rounded).toFixed(maxDecimals).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const decimals = decPart ? decPart.replace(/0+$/, "") : "";
  return `${negative ? "-" : ""}${grouped}${decimals ? `,${decimals}` : ""}`;
}

/** Ratio 0-1 en pourcentage : « 58 % ». Une décimale sous 10 % (« 4,6 % »). */
export function formatPct(ratio: number): string {
  const pct = ratio * 100;
  return `${formatNumber(pct, pct < 10 ? 1 : 0)}${NBSP}%`;
}

/** Montant en euros : « 1 200 € ». Centimes seulement sous 10 € (« 2,35 € »). */
export function formatEur(amount: number): string {
  return `${formatNumber(amount, Math.abs(amount) < 10 ? 2 : 0)}${NBSP}€`;
}

/** « 1 vente », « 3 ventes » (0 et 1 au singulier, règle française). */
function count(n: number, singular: string, plural: string): string {
  return `${formatNumber(n)} ${n >= 2 ? plural : singular}`;
}

// ---------------------------------------------------------------------------
// Leçons publiées (PLAN.md, section 7)
// ---------------------------------------------------------------------------

export const LESSONS = {
  module2: "Module 2",
  module5Video: "Module 5, « Tourner une vidéo validée »",
  module5: "Module 5",
  module6Prequalif: "Module 6, « Préqualification et confirmation du RDV »",
  module6Logique: "Module 6, « La logique de l'appel avant le script »",
} as const;

// ---------------------------------------------------------------------------
// Contexte passé par le moteur
// ---------------------------------------------------------------------------

export interface TextContext {
  input: DiagnosticInput; // valeurs déjà nettoyées (finies, positives)
  weeklyCallsNeeded: number | null;
  salesPerMonthNeeded: number | null;
  dmPrice: number | null;
  dmsThreshold: number; // seuil de DM retenu pour la semaine
  conversationsNeeded: number | null; // conversations nécessaires (si l'objectif est connu)
  contenuFocus: "reels" | "stories";
  presenceRatio: number | null;
  closingOk: boolean | null; // null si le closing n'est pas jugeable
  lowConfidence: boolean;
  insufficientStages: number; // étapes du funnel sans assez de données
}

export interface ConstraintTexts {
  title: string;
  message: string;
  action: string;
  lesson: string | null;
  exitCriterion: string | null;
}

const sentences = (...parts: (string | null | false | undefined)[]): string =>
  parts.filter(Boolean).join(" ");

const perDay = (weekly: number) => formatNumber(weekly / 7, 1);

// ---------------------------------------------------------------------------
// Textes par contrainte
// ---------------------------------------------------------------------------

export function buildTexts(key: ConstraintKey, ctx: TextContext): ConstraintTexts {
  const i = ctx.input;

  switch (key) {
    case "offre": {
      const salesText =
        i.salesAtCurrentPrice === 0
          ? "Aucune vente au prix affiché depuis le lancement."
          : `${count(i.salesAtCurrentPrice, "vente", "ventes")} au prix affiché depuis le lancement.`;
      return {
        title: "Ta contrainte n°1 : ton offre",
        message: sentences(
          salesText,
          "Tant qu'il n'y en a pas 5, ta contrainte est ton offre.",
          "Plus de trafic vers une offre qui ne se vend pas, c'est accélérer vers le mur.",
        ),
        action:
          "Demain, tu proposes ton offre, au prix affiché, à 5 personnes qui ont exactement le problème qu'elle règle.",
        lesson: LESSONS.module2,
        exitCriterion: "Tu passes à la suite à 5 ventes au prix affiché.",
      };
    }

    case "delivrer": {
      const opening =
        i.clientsWithResult === "none"
          ? "Aucun de tes clients n'a encore obtenu son résultat."
          : "Moins d'un client sur deux obtient son résultat.";
      return {
        title: "Ta contrainte n°1 : le résultat de tes clients",
        message: sentences(
          opening,
          "Tant que c'est le cas, chaque nouvelle vente use ta réputation.",
          "Avant de vendre plus, tu fais réussir ceux qui ont déjà payé.",
        ),
        action:
          "Demain, tu fixes à chaque client en cours un premier résultat concret à obtenir en 7 jours.",
        lesson: null,
        exitCriterion:
          "Tu passes à la suite quand au moins un client sur deux obtient son résultat à 30 jours.",
      };
    }

    case "contenu": {
      if (ctx.contenuFocus === "stories") {
        return {
          title: "Ta contrainte n°1 : tes stories",
          message: sentences(
            `${count(i.stories, "story", "stories")} cette semaine, soit ${perDay(i.stories)} par jour.`,
            "Le repère EVO, c'est au moins 3 par jour.",
            "Tes reels attirent.",
            "Tes stories entretiennent le lien qui mène au message.",
          ),
          action:
            "Demain, tu publies 3 stories : une qui montre ton expertise, une qui montre ton quotidien, une qui invite à t'écrire.",
          lesson: LESSONS.module5,
          exitCriterion:
            "Tu passes à la suite quand tu tiens 3 stories par jour trois semaines d'affilée.",
        };
      }
      return {
        title: "Ta contrainte n°1 : le volume de contenu",
        message: sentences(
          `${count(i.reels, "reel", "reels")} cette semaine, soit ${perDay(i.reels)} par jour.`,
          "Le rythme EVO, c'est 4 par jour, avec plusieurs accroches chacun.",
          "Ton problème n'est pas encore ce que tu dis.",
          "C'est combien de fois tu le dis.",
        ),
        action: "Demain, tu tournes en batch de quoi tenir 4 reels par jour pendant une semaine.",
        lesson: LESSONS.module5Video,
        exitCriterion:
          "Tu passes à la suite quand tu tiens 4 reels par jour trois semaines d'affilée.",
      };
    }

    case "messages_volume": {
      const fromGoal =
        ctx.weeklyCallsNeeded !== null &&
        ctx.conversationsNeeded !== null &&
        ctx.conversationsNeeded >= ctx.dmsThreshold;
      return {
        title: "Ta contrainte n°1 : le nombre de messages envoyés",
        message: sentences(
          `${count(i.dmsSent, "message envoyé", "messages envoyés")} cette semaine.`,
          fromGoal
            ? `Ton objectif demande ${count(ctx.weeklyCallsNeeded ?? 0, "call booké", "calls bookés")} par semaine.`
            : null,
          fromGoal
            ? `Même si chaque message ouvrait une conversation, il en faudrait au moins ${formatNumber(ctx.dmsThreshold)}.`
            : `Sous ${formatNumber(ctx.dmsThreshold)} messages par semaine, le reste du funnel n'a rien à convertir.`,
          ctx.dmPrice !== null
            ? `Chaque message que tu n'envoies pas te coûte ${formatEur(ctx.dmPrice)}.`
            : null,
          "Ton problème n'est pas encore ce que tu écris.",
          "C'est à combien de personnes tu l'écris.",
        ),
        action: `Demain, tu envoies ${count(Math.ceil(ctx.dmsThreshold / 7), "message", "messages")}, nouveaux et relances compris.`,
        lesson: null,
        exitCriterion: `Tu passes à la suite quand tu envoies au moins ${formatNumber(ctx.dmsThreshold)} messages par semaine, trois semaines d'affilée.`,
      };
    }

    case "reponses": {
      const rate = i.dmsSent > 0 ? i.replies / i.dmsSent : 0;
      return {
        title: "Ta contrainte n°1 : ton taux de réponse",
        message: sentences(
          `${count(i.dmsSent, "message envoyé", "messages envoyés")}, ${count(i.replies, "réponse", "réponses")}.`,
          `${formatPct(rate)}.`,
          `Sous 5${NBSP}%, c'est le message.`,
          `Si ça reste sous 5${NBSP}% après le changement, c'est la cible qu'on revoit.`,
        ),
        action: `Ce soir, tu réécris ton premier message ; demain, tu envoies la nouvelle version au même volume, ${count(Math.ceil(i.dmsSent / 7), "message", "messages")}.`,
        lesson: null,
        exitCriterion: `Tu passes à la suite quand ton taux de réponse dépasse 5${NBSP}% trois semaines d'affilée.`,
      };
    }

    case "conversations_calls":
      return {
        title: "Ta contrainte n°1 : passer de la conversation au call",
        message: sentences(
          `${count(i.newConversations, "conversation", "conversations")}, ${count(i.callsBooked, "call booké", "calls bookés")}.`,
          "Les gens te répondent.",
          "Tu ne les emmènes pas jusqu'au rendez-vous.",
          "Le repère EVO, c'est au moins une conversation sur cinq qui devient un call.",
        ),
        action:
          "Demain, chaque conversation qualifiée se termine par une proposition d'appel claire, avec 2 créneaux au choix.",
        lesson: null,
        exitCriterion:
          "Tu passes à la suite quand au moins une conversation sur cinq devient un call, trois semaines d'affilée.",
      };

    case "calls_volume": {
      const needed = ctx.weeklyCallsNeeded ?? 0;
      const gap = Math.max(1, needed - i.callsBooked);
      return {
        title: "Ta contrainte n°1 : le nombre de calls bookés",
        message: sentences(
          `Ton objectif de ${formatEur(i.monthlyGoal)} par mois, avec une offre à ${formatEur(i.offerPrice)}, demande ${count(ctx.salesPerMonthNeeded ?? 0, "vente", "ventes")} par mois.`,
          `Avec 30${NBSP}% de closing et 80${NBSP}% de présence, ça fait ${count(needed, "call", "calls")} à booker par semaine.`,
          `Tu en as booké ${formatNumber(i.callsBooked)}.`,
          "Ta contrainte n'est pas ce qui se passe pendant l'appel.",
          "C'est le nombre d'appels.",
        ),
        action: `Demain, tu proposes un appel à chaque conversation ouverte, jusqu'à ${count(gap, "call", "calls")} de plus cette semaine.`,
        lesson: null,
        exitCriterion: `Tu passes à la suite quand tu bookes ${count(needed, "call", "calls")} par semaine, trois semaines d'affilée.`,
      };
    }

    case "presence": {
      const rate = i.callsBooked > 0 ? Math.min(1, i.callsHeld / i.callsBooked) : 0;
      return {
        title: "Ta contrainte n°1 : la présence aux calls",
        message: sentences(
          `Cette semaine, ${count(i.callsBooked, "call booké", "calls bookés")}, ${formatNumber(i.callsHeld)} ${i.callsHeld >= 2 ? "tenus" : "tenu"}.`,
          `Ta présence est à ${formatPct(rate)}.`,
          `Le repère EVO, c'est 80${NBSP}%.`,
          "Ta contrainte est avant l'appel, pas pendant.",
        ),
        action:
          "Demain, chaque prospect qui réserve reçoit un message de confirmation dans l'heure, et un rappel 2 heures avant l'appel.",
        lesson: LESSONS.module6Prequalif,
        exitCriterion: `Tu passes à la suite quand tu tiens 80${NBSP}% trois semaines d'affilée.`,
      };
    }

    case "qualification": {
      const offTarget = Math.min(i.offTargetCalls, i.callsHeld);
      return {
        title: "Ta contrainte n°1 : la qualification de tes prospects",
        message: sentences(
          `Tu fais du volume : ${count(i.callsHeld, "call tenu", "calls tenus")}.`,
          `${formatNumber(offTarget)} ${offTarget >= 2 ? "étaient" : "était"} hors cible : pas de budget, pas de problème à régler.`,
          ctx.closingOk === true
            ? "Ton closing n'est pas en cause."
            : "Avant de juger ton closing, regarde qui tu appelles.",
          ctx.closingOk === true ? "Ta qualification l'est." : "Ta contrainte est la qualification.",
        ),
        action: "Demain, tu ajoutes 2 questions de filtre avant de proposer le call.",
        lesson: LESSONS.module6Prequalif,
        exitCriterion:
          "Tu passes à la suite avec moins d'un call hors cible sur cinq, trois semaines d'affilée.",
      };
    }

    case "closing": {
      const salesOnCalls = Math.min(i.sales, i.callsHeld);
      return {
        title: "Ta contrainte n°1 : le closing",
        message: sentences(
          ctx.presenceRatio !== null
            ? `Tes prospects viennent : ${formatPct(ctx.presenceRatio)} de présence.`
            : `Tes prospects viennent : ${count(i.callsHeld, "call tenu", "calls tenus")}.`,
          `Ils ne signent pas : ${count(salesOnCalls, "vente", "ventes")} sur ${count(i.callsHeld, "call", "calls")}.`,
          "Ta contrainte est pendant l'appel.",
          ctx.lowConfidence
            ? `Sur ${count(i.callsHeld, "call", "calls")}, c'est une tendance, pas encore une certitude : il en faut 10 pour juger un closing.`
            : null,
        ),
        action:
          "Demain, tu réécoutes 2 appels non signés et tu notes où le prospect a décroché : la douleur, l'engagement ou le prix.",
        lesson: LESSONS.module6Logique,
        exitCriterion:
          "Tu passes à la suite quand au moins un call tenu sur quatre signe, trois semaines d'affilée.",
      };
    }

    case "equipe":
      return {
        title: "Ta contrainte n°1 : ton équipe",
        message: sentences(
          "Chaque étape de ton funnel tient son seuil.",
          "Ce qui bloque maintenant, c'est que tu fais tout toi-même.",
          "Ton activité ne peut pas aller plus loin que tes heures.",
        ),
        action:
          "Demain, tu écris la procédure de 1 tâche que tu répètes chaque semaine, pour pouvoir la confier.",
        lesson: null,
        exitCriterion:
          "Tu passes à la suite quand une tâche répétitive tourne sans toi, avec un rapport quotidien reçu.",
      };

    case "aucune":
      return {
        title: "Pas de contrainte sous le seuil cette semaine",
        message: sentences(
          ctx.insufficientStages > 0
            ? "Chaque étape lisible de ton funnel est au-dessus de son seuil."
            : "Chaque étape de ton funnel est au-dessus de son seuil.",
          "C'est le signe d'un mécanisme qui tourne.",
          ctx.insufficientStages === 1
            ? "1 étape manque encore de données pour être jugée."
            : ctx.insufficientStages > 1
              ? `${formatNumber(ctx.insufficientStages)} étapes manquent encore de données pour être jugées.`
              : null,
          `Le niveau suivant : viser 30${NBSP}% de closing au lieu du seuil de 20${NBSP}%.`,
        ),
        action: `Demain, tu gardes exactement le même rythme : ${count(Math.ceil(i.dmsSent / 7), "message", "messages")} par jour.`,
        lesson: null,
        exitCriterion:
          "Tu passes au niveau suivant après trois semaines d'affilée au-dessus de chaque seuil.",
      };
  }
}

// ---------------------------------------------------------------------------
// Proposition d'accompagnement (PLAN.md, section 7)
// Affichée par l'interface seulement si `showCallOffer` est vrai ET que
// l'utilisateur a donné son accord pour être recontacté.
// ---------------------------------------------------------------------------

export function buildCallOfferText(monthlyGap: number): string {
  const gap = Math.max(0, Math.round(monthlyGap / 100) * 100);
  return sentences(
    gap > 0 ? `À ce rythme, il te manque ${formatEur(gap)} par mois pour ton objectif.` : null,
    "Ta contrainte est identifiée.",
    "Si tu veux qu'on la lise avec toi, l'équipe EVO te prend 30 minutes.",
  );
}
