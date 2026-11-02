/**
 * Contrat partagé du Diagnostic express (moteur, formulaire public, admin).
 * Toutes les valeurs « semaine » portent sur les 7 derniers jours.
 */

export type Activity = "coach" | "freelance" | "infopreneur" | "agence" | "autre";

export type ClientsWithResult = "most" | "half" | "few" | "none" | "no_clients";

export interface DiagnosticInput {
  activity: Activity;
  revenueRange: string; // ex. "3-5k"
  goalRange: string; // ex. "10-20k"
  offerPrice: number; // prix de l'offre principale, en €
  monthlyGoal: number; // objectif de CA mensuel, en € (milieu de la tranche si non précisé)
  salesAtCurrentPrice: number; // ventes réalisées au prix actuel depuis le lancement (étape 0)
  clientsWithResult: ClientsWithResult; // Délivrer
  // 7 derniers jours
  reels: number;
  stories: number;
  dmsSent: number; // messages envoyés, nouveaux + relances
  newConversations: number;
  replies: number;
  callsBooked: number;
  callsHeld: number;
  offTargetCalls: number; // calls tenus avec des prospects hors cible
  sales: number;
  cashCollected: number; // € encaissés
  founderSaturated: boolean; // Équipe : le fondateur fait tout lui-même
}

export type Pillar = "valeur" | "acquisition" | "conversion" | "delivrer" | "equipe";

export type ConstraintKey =
  | "offre" // Valeur : l'offre ne se vend pas au prix
  | "delivrer" // clients sans résultat
  | "contenu" // pas assez de reels / stories
  | "messages_volume" // pas assez de DM envoyés
  | "reponses" // taux de réponse bas
  | "conversations_calls" // les conversations ne deviennent pas des calls
  | "calls_volume" // calls bookés sous le calcul inversé
  | "presence" // présence basse
  | "qualification" // trop de calls hors cible
  | "closing" // closing bas
  | "equipe" // tout va bien mais le fondateur est saturé
  | "aucune"; // tout est au-dessus des seuils

export type StageStatus = "ok" | "alerte" | "insuffisant"; // insuffisant = pas assez de données

export interface StageReading {
  key: ConstraintKey;
  pillar: Pillar;
  label: string; // ex. "Présence aux calls"
  value: number | null; // valeur mesurée (ratio 0-1 ou volume)
  threshold: number | null; // seuil d'alerte
  unit: "pct" | "count" | "eur";
  status: StageStatus;
}

export interface DiagnosticResult {
  constraint: ConstraintKey;
  pillar: Pillar;
  title: string; // ex. "Ta contrainte n°1 : la présence aux calls"
  message: string; // texte EVO avec les chiffres remplis (une idée par phrase)
  action: string; // l'action pour demain, une phrase
  lesson: string | null; // renvoi vers une leçon EVO publiée, ou null
  exitCriterion: string | null; // critère de sortie
  stages: StageReading[]; // lecture complète du funnel, dans l'ordre
  lowConfidence: boolean; // vrai si trop peu de données (ex. moins de 10 calls pour juger le closing)
  dmPrice: number | null; // prix d'un DM = cash encaissé ÷ DM envoyés
  weeklyCallsNeeded: number | null; // calcul inversé : calls à booker par semaine pour l'objectif
  showCallOffer: boolean; // afficher la proposition d'appel EVO (écart à l'objectif important)
}
