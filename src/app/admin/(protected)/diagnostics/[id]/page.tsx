import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { DiagnosticInput } from "@/lib/diagnostic/types";
import {
  CLIENTS_WITH_RESULT_LABELS,
  PILLAR_LABELS,
  STAGE_STATUS_BADGE,
  STAGE_STATUS_LABELS,
  activityLabel,
  constraintBadgeClass,
  constraintLabel,
  fmtDateTime,
  fmtEur,
  fmtNumber,
  fmtStageValue,
  parseConsentLabels,
  parseInput,
  parseResult,
  rangeLabel,
} from "@/lib/diagnostic-admin";

export const dynamic = "force-dynamic";

type InputKey = keyof DiagnosticInput;
type Field = { key: InputKey; label: string; kind: "eur" | "count" | "bool" | "activity" | "range" | "clients" };

const PROFILE_FIELDS: Field[] = [
  { key: "activity", label: "Activité", kind: "activity" },
  { key: "revenueRange", label: "CA mensuel actuel", kind: "range" },
  { key: "goalRange", label: "Objectif de CA à 6 mois", kind: "range" },
  { key: "monthlyGoal", label: "Objectif de CA mensuel", kind: "eur" },
  { key: "offerPrice", label: "Prix de l'offre principale", kind: "eur" },
  { key: "salesAtCurrentPrice", label: "Ventes au prix actuel depuis le lancement", kind: "count" },
  { key: "clientsWithResult", label: "Clients qui obtiennent le résultat promis", kind: "clients" },
  { key: "founderSaturated", label: "Le fondateur fait tout lui-même", kind: "bool" },
];

const WEEK_FIELDS: Field[] = [
  { key: "reels", label: "Reels publiés", kind: "count" },
  { key: "stories", label: "Stories publiées", kind: "count" },
  { key: "dmsSent", label: "Messages envoyés (nouveaux + relances)", kind: "count" },
  { key: "newConversations", label: "Nouvelles conversations", kind: "count" },
  { key: "replies", label: "Réponses reçues", kind: "count" },
  { key: "callsBooked", label: "Calls bookés", kind: "count" },
  { key: "callsHeld", label: "Calls tenus", kind: "count" },
  { key: "offTargetCalls", label: "Calls tenus hors cible", kind: "count" },
  { key: "sales", label: "Ventes", kind: "count" },
  { key: "cashCollected", label: "Cash encaissé", kind: "eur" },
];

const KNOWN_KEYS = new Set<string>([...PROFILE_FIELDS, ...WEEK_FIELDS].map((f) => f.key));

function fieldValue(input: Partial<DiagnosticInput>, f: Field): string | null {
  const v = input[f.key] as unknown;
  if (v === undefined || v === null || v === "") return null;
  switch (f.kind) {
    case "eur":
      return typeof v === "number" ? fmtEur(v) : String(v);
    case "count":
      return typeof v === "number" ? fmtNumber(v, 1) : String(v);
    case "bool":
      return typeof v === "boolean" ? (v ? "Oui" : "Non") : String(v);
    case "activity":
      return activityLabel(String(v));
    case "range":
      return rangeLabel(String(v));
    case "clients":
      return CLIENTS_WITH_RESULT_LABELS[v as keyof typeof CLIENTS_WITH_RESULT_LABELS] ?? String(v);
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[2fr_3fr] gap-1 sm:gap-6 py-3 text-sm">
      <dt className="text-[#A1A1AA]">{label}</dt>
      <dd className="text-white break-words">{children}</dd>
    </div>
  );
}

const Empty = ({ text = "—" }: { text?: string }) => <span className="text-[#52525B] italic">{text}</span>;

function YesNo({ value }: { value: boolean }) {
  return <span className={value ? "text-emerald-400" : "text-[#A1A1AA]"}>{value ? "Oui" : "Non"}</span>;
}

function FieldList({ title, fields, input }: { title: string; fields: Field[]; input: Partial<DiagnosticInput> }) {
  return (
    <div className="evo-card">
      <h3 className="px-5 pt-4 text-sm font-semibold uppercase tracking-wider text-[#C9A84C]">{title}</h3>
      <dl className="px-5 pb-2 divide-y divide-[#262626]">
        {fields.map((f) => {
          const v = fieldValue(input, f);
          return <Row key={f.key} label={f.label}>{v ? <span className="tabular-nums">{v}</span> : <Empty text="Non renseigné" />}</Row>;
        })}
      </dl>
    </div>
  );
}

export default async function DiagnosticDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.diagnosticLead.findUnique({ where: { id } });
  if (!lead) notFound();

  const input = parseInput(lead.input);
  const result = parseResult(lead.result);
  const consentLabels = parseConsentLabels(lead.consentLabels);
  const extraInputKeys = input ? Object.keys(input).filter((k) => !KNOWN_KEYS.has(k)) : [];
  const utm = [
    ["Source", lead.utmSource],
    ["Medium", lead.utmMedium],
    ["Campagne", lead.utmCampaign],
  ] as const;
  const lessonIsLink = result?.lesson ? /^(https?:\/\/|\/)/.test(result.lesson) : false;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-2">
        <Link href="/admin/diagnostics" className="text-sm text-[#A1A1AA] hover:text-white">← Diagnostics</Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">{lead.firstName || "Sans prénom"}</h1>
          <a
            href={`/diagnostic/${lead.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-[#C9A84C]/40 text-[#E8C97A] text-sm hover:bg-[#C9A84C]/10 transition-colors"
          >
            Voir la page du coach ↗
          </a>
        </div>
        <p className="text-sm text-[#A1A1AA]">
          {[activityLabel(lead.activity), `diagnostic du ${fmtDateTime(lead.createdAt)}`].join(" · ")}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2 py-1 rounded-full border ${constraintBadgeClass(lead.constraintKey)}`}>
            Contrainte n°1 : {constraintLabel(lead.constraintKey)}
          </span>
          <span className="text-xs px-2 py-1 rounded-full border border-[#262626] text-[#A1A1AA]">Score : {lead.score}</span>
          {lead.calendlyClickAt && (
            <span className="text-xs px-2 py-1 rounded-full border border-emerald-500/30 text-emerald-400">
              Calendly cliqué le {fmtDateTime(lead.calendlyClickAt)}
            </span>
          )}
        </div>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="evo-card">
          <h2 className="px-5 pt-4 text-sm font-semibold uppercase tracking-wider text-[#C9A84C]">Identité</h2>
          <dl className="px-5 pb-2 divide-y divide-[#262626]">
            <Row label="Prénom">{lead.firstName || <Empty />}</Row>
            <Row label="Email">
              <a href={`mailto:${lead.email}`} className="hover:text-[#E8C97A] underline-offset-4 hover:underline">{lead.email}</a>
            </Row>
            <Row label="Téléphone">
              {lead.phone ? <a href={`tel:${lead.phone.replace(/\s+/g, "")}`} className="hover:text-[#E8C97A]">{lead.phone}</a> : <Empty text="Non communiqué" />}
            </Row>
            <Row label="Instagram">
              {lead.instagram ? (
                <a
                  href={`https://www.instagram.com/${encodeURIComponent(lead.instagram)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E8C97A] underline-offset-4 hover:underline"
                >
                  @{lead.instagram}
                </a>
              ) : (
                <Empty text="Non communiqué" />
              )}
            </Row>
            <Row label="Calendly">{lead.calendlyClickAt ? `Cliqué le ${fmtDateTime(lead.calendlyClickAt)}` : <Empty text="Pas cliqué" />}</Row>
          </dl>
        </div>

        <div className="evo-card">
          <h2 className="px-5 pt-4 text-sm font-semibold uppercase tracking-wider text-[#C9A84C]">Source (UTM)</h2>
          <dl className="px-5 pb-2 divide-y divide-[#262626]">
            {utm.map(([label, v]) => (
              <Row key={label} label={label}>{v || <Empty />}</Row>
            ))}
          </dl>
        </div>
      </section>

      <section className="evo-card">
        <h2 className="px-5 pt-4 text-sm font-semibold uppercase tracking-wider text-[#C9A84C]">Consentements</h2>
        <dl className="px-5 pb-2 divide-y divide-[#262626]">
          <Row label="Conditions (CGU)">
            <YesNo value={lead.consentCgu} />
            {consentLabels.cgu && <p className="mt-1 text-[#A1A1AA] whitespace-pre-wrap">« {consentLabels.cgu} »</p>}
          </Row>
          <Row label="Accepte d'être recontacté">
            <YesNo value={lead.consentRecontact} />
            {consentLabels.recontact && <p className="mt-1 text-[#A1A1AA] whitespace-pre-wrap">« {consentLabels.recontact} »</p>}
          </Row>
          <Row label="Date du consentement">{lead.consentAt ? fmtDateTime(lead.consentAt) : <Empty />}</Row>
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Résultat du diagnostic</h2>
        {!result ? (
          <p className="text-sm text-[#A1A1AA] evo-card p-5">Le résultat enregistré est illisible.</p>
        ) : (
          <>
            <div className="evo-card evo-glow p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${constraintBadgeClass(result.constraint)}`}>{constraintLabel(result.constraint)}</span>
                <span className="text-xs px-2 py-1 rounded-full border border-[#262626] text-[#A1A1AA]">Pilier : {PILLAR_LABELS[result.pillar]}</span>
                {result.lowConfidence && (
                  <span className="text-xs px-2 py-1 rounded-full border border-amber-500/30 text-amber-400">Peu de données : lecture à confirmer</span>
                )}
              </div>
              {result.title && <h3 className="text-xl font-bold text-white">{result.title}</h3>}
              {result.message && <p className="text-sm text-[#D4D4D8] whitespace-pre-wrap leading-relaxed">{result.message}</p>}
              <dl className="divide-y divide-[#262626] border-t border-[#262626]">
                <Row label="Action pour demain">{result.action || <Empty />}</Row>
                <Row label="Leçon EVO">
                  {result.lesson ? (
                    lessonIsLink ? (
                      <a href={result.lesson} target="_blank" rel="noopener noreferrer" className="text-[#E8C97A] underline-offset-4 hover:underline break-all">{result.lesson}</a>
                    ) : (
                      result.lesson
                    )
                  ) : (
                    <Empty text="Aucune" />
                  )}
                </Row>
                <Row label="Critère de sortie">{result.exitCriterion || <Empty text="Aucun" />}</Row>
                <Row label="Proposition d'appel EVO affichée"><YesNo value={result.showCallOffer} /></Row>
              </dl>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="evo-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Prix d&apos;un DM</p>
                <p className="mt-1 text-2xl font-bold text-white tabular-nums">{result.dmPrice !== null ? fmtEur(result.dmPrice, 2) : "—"}</p>
                <p className="text-xs text-[#71717A]">Cash encaissé ÷ messages envoyés</p>
              </div>
              <div className="evo-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Calls / semaine nécessaires</p>
                <p className="mt-1 text-2xl font-bold text-white tabular-nums">{result.weeklyCallsNeeded !== null ? fmtNumber(result.weeklyCallsNeeded, 1) : "—"}</p>
                <p className="text-xs text-[#71717A]">Calcul inversé depuis l&apos;objectif mensuel</p>
              </div>
            </div>

            <div className="evo-card overflow-hidden">
              <h3 className="px-5 pt-4 pb-2 text-sm font-semibold uppercase tracking-wider text-[#C9A84C]">Lecture du funnel</h3>
              {result.stages.length === 0 ? (
                <p className="px-5 pb-4 text-sm text-[#A1A1AA]">Aucune étape enregistrée.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#262626] text-left text-[#A1A1AA]">
                        <th className="px-5 py-2 font-medium">Étape</th>
                        <th className="px-3 py-2 font-medium">Pilier</th>
                        <th className="px-3 py-2 font-medium text-right">Mesuré</th>
                        <th className="px-3 py-2 font-medium text-right">Seuil</th>
                        <th className="px-5 py-2 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626]">
                      {result.stages.map((s, i) => (
                        <tr key={`${s.key}-${i}`} className={s.key === result.constraint ? "bg-[#C9A84C]/5" : ""}>
                          <td className="px-5 py-2.5 text-white">
                            {s.label}
                            {s.key === result.constraint && <span className="ml-2 text-xs text-[#E8C97A]">contrainte n°1</span>}
                          </td>
                          <td className="px-3 py-2.5 text-[#A1A1AA]">{PILLAR_LABELS[s.pillar]}</td>
                          <td className="px-3 py-2.5 text-white tabular-nums text-right">{fmtStageValue(s.value, s.unit)}</td>
                          <td className="px-3 py-2.5 text-[#A1A1AA] tabular-nums text-right">{fmtStageValue(s.threshold, s.unit)}</td>
                          <td className="px-5 py-2.5">
                            <span className={`text-xs px-2 py-1 rounded-full border ${STAGE_STATUS_BADGE[s.status]}`}>{STAGE_STATUS_LABELS[s.status]}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Chiffres déclarés</h2>
        {!input ? (
          <p className="text-sm text-[#A1A1AA] evo-card p-5">Les chiffres enregistrés sont illisibles.</p>
        ) : (
          <div className="grid gap-4">
            <FieldList title="Profil et offre" fields={PROFILE_FIELDS} input={input} />
            <FieldList title="Les 7 derniers jours" fields={WEEK_FIELDS} input={input} />
            {extraInputKeys.length > 0 && (
              <div className="evo-card">
                <h3 className="px-5 pt-4 text-sm font-semibold uppercase tracking-wider text-[#A1A1AA]">Autres champs</h3>
                <dl className="px-5 pb-2 divide-y divide-[#262626]">
                  {extraInputKeys.map((k) => (
                    <Row key={k} label={k}>{String((input as Record<string, unknown>)[k])}</Row>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
