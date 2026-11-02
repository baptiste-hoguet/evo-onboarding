import type { DiagnosticInput, DiagnosticResult } from "./types";

// Stub provisoire : remplacé par le vrai moteur (règles fixes, PLAN.md sections 6 et 7).
export function runDiagnostic(input: DiagnosticInput): DiagnosticResult {
  void input;
  return {
    constraint: "aucune",
    pillar: "acquisition",
    title: "Diagnostic en cours de construction",
    message: "Le moteur de diagnostic n'est pas encore branché.",
    action: "Reviens bientôt.",
    lesson: null,
    exitCriterion: null,
    stages: [],
    lowConfidence: true,
    dmPrice: null,
    weeklyCallsNeeded: null,
    showCallOffer: true,
  };
}
