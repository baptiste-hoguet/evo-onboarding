import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

export type Reponse = { n: number; numero: number; section: number; sectionTitre: string; question: string; reponse: string };
export type Readable = { reponses: Reponse[]; chiffres: [string, string][] };
export type Summary = {
  resume: string;
  profil: string[];
  offre: string[];
  avatar: string[];
  acquisition: string[];
  vente: string[];
  objectifs: string[];
  forces: string[];
  vigilance: string[];
  priorites: string[];
  questions: string[];
};

const LISTS = ["profil", "offre", "avatar", "acquisition", "vente", "objectifs", "forces", "vigilance", "priorites", "questions"] as const;

// Format imposé à la réponse de Claude (sorties structurées) : correspond au type Summary.
const SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    resume: { type: "string" },
    ...Object.fromEntries(LISTS.map((k) => [k, { type: "array", items: { type: "string" } }])),
  },
  required: ["resume", ...LISTS],
  additionalProperties: false,
};

export function parseReadable(raw: string | null): Readable {
  try {
    const r = JSON.parse(raw || "");
    return { reponses: Array.isArray(r?.reponses) ? r.reponses : [], chiffres: Array.isArray(r?.chiffres) ? r.chiffres : [] };
  } catch {
    return { reponses: [], chiffres: [] };
  }
}

export function parseSummary(raw: string | null): Summary | null {
  try {
    const s = JSON.parse(raw || "");
    if (!s || typeof s.resume !== "string") return null;
    const out = { resume: s.resume } as Summary;
    for (const k of LISTS) out[k] = Array.isArray(s[k]) ? s[k].filter((x: unknown) => typeof x === "string" && x.trim()) : [];
    return out;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `Tu es consultant senior chez EVO, un incubateur qui accompagne des coachs et infopreneurs (offre, contenu, publicité, setting, closing).
Un nouveau client vient de remplir son questionnaire d'onboarding. Tu rédiges pour l'équipe EVO une synthèse interne, en français, claire et factuelle, qui tient sur 1 à 2 pages A4.

Règles :
- Appuie-toi uniquement sur les réponses fournies. N'invente aucun chiffre. Si une information manque, dis-le brièvement ("non renseigné").
- Parle du client à la 3e personne en utilisant son prénom. N'emploie jamais de pronom genré (il, elle) : répète le prénom ou tourne la phrase autrement.
- Puces courtes : 25 mots maximum chacune.
- Sois concret et utile pour un coach qui prépare le premier call.

Réponds uniquement avec un objet JSON de cette forme :
{"resume": "3 à 4 phrases qui résument la situation, l'offre et l'ambition",
 "profil": ["2 à 4 puces"], "offre": ["2 à 4 puces"], "avatar": ["2 à 3 puces"],
 "acquisition": ["2 à 4 puces sur contenu et leads"], "vente": ["2 à 4 puces sur pub, setting, closing"],
 "objectifs": ["2 à 4 puces sur objectifs, engagement, préférences de feedback"],
 "forces": ["2 à 4 puces"], "vigilance": ["2 à 4 puces : risques, incohérences, blocages"],
 "priorites": ["3 priorités recommandées pour le premier mois, dans l'ordre"],
 "questions": ["3 à 5 questions à creuser lors du premier call"]}`;

// Génère (ou régénère) la synthèse IA d'un questionnaire envoyé et l'enregistre
export async function generateQuestionnaireSummary(id: string): Promise<Summary> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Clé API Claude manquante (ANTHROPIC_API_KEY).");

  const r = await prisma.questionnaireResponse.findUnique({ where: { id } });
  if (!r) throw new Error("Questionnaire introuvable");
  if (r.status !== "submitted") throw new Error("Le questionnaire n'a pas encore été envoyé.");

  const { reponses } = parseReadable(r.readable);
  const bySection = new Map<string, Reponse[]>();
  for (const x of reponses) {
    const key = `${x.section}. ${x.sectionTitre}`;
    bySection.set(key, [...(bySection.get(key) || []), x]);
  }
  const body = [...bySection]
    .map(([t, xs]) => `## ${t}\n` + xs.map((x) => `- ${x.question} : ${x.reponse.replace(/\n/g, " ; ") || "(pas de réponse)"}`).join("\n"))
    .join("\n\n");
  const name = [r.firstName, r.lastName].filter(Boolean).join(" ") || "Client";

  const client = new Anthropic();
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // Si Claude refuse la requête, l'API la relance sur le modèle de repli recommandé par Anthropic.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SUMMARY_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Client : ${name}${r.brand ? " — " + r.brand : ""}\nParcours déterminé par le questionnaire : ${r.route || "non déterminé"}\n\n<reponses>\n${body}\n</reponses>`,
        },
      ],
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new Error("Clé API Claude invalide.");
    if (e instanceof Anthropic.RateLimitError) throw new Error("Claude est momentanément saturé. Réessaie dans une minute.");
    if (e instanceof Anthropic.APIError) throw new Error(`Erreur Claude (${e.status ?? "réseau"}). ${e.message.slice(0, 200)}`);
    throw e;
  }

  if (response.stop_reason === "refusal") throw new Error("Claude a refusé de générer la synthèse. Relance la génération.");
  const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  const summary = parseSummary(text);
  if (!summary) throw new Error("La réponse de l'IA est incomplète. Relance la génération.");

  await prisma.questionnaireResponse.update({
    where: { id },
    data: { summary: JSON.stringify(summary), summaryAt: new Date() },
  });
  return summary;
}
