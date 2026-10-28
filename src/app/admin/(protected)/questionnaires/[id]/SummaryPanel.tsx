"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Summary } from "@/lib/questionnaire-summary";
import { SUMMARY_BLOCKS, type PdfInput } from "@/lib/summary-shared";

type Props = {
  id: string;
  initialSummary: Summary | null;
  submittedAt: string | null;
  pdf: Omit<PdfInput, "summary">;
};

// La synthèse est lancée automatiquement à l'envoi ; on patiente ~2 min avant de proposer de la relancer
const WAIT_MS = 2 * 60 * 1000;

export function SummaryPanel({ id, initialSummary, submittedAt, pdf }: Props) {
  const router = useRouter();
  // Synthèse régénérée ici, sinon celle reçue du serveur (mise à jour par router.refresh)
  const [local, setSummary] = useState<Summary | null>(null);
  const summary = local ?? initialSummary;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(
    !initialSummary && !!submittedAt && Date.now() - new Date(submittedAt).getTime() < WAIT_MS
  );

  // Synthèse en cours côté serveur : on rafraîchit la page jusqu'à ce qu'elle arrive
  useEffect(() => {
    if (summary || !waiting) return;
    const tick = setInterval(() => router.refresh(), 5000);
    const stop = setTimeout(() => setWaiting(false), Math.max(0, WAIT_MS - (Date.now() - new Date(submittedAt || 0).getTime())));
    return () => { clearInterval(tick); clearTimeout(stop); };
  }, [summary, waiting, submittedAt, router]);

  async function generate() {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/questionnaires/${id}/summary`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "La synthèse n'a pas pu être générée.");
      setSummary(data.summary);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "La synthèse n'a pas pu être générée.");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!summary) return;
    const { buildSummaryPdf, summaryFilename } = await import("@/lib/summary-pdf");
    buildSummaryPdf({ ...pdf, summary }).save(summaryFilename(pdf.name));
  }

  return (
    <section className="evo-card p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A84C]">Synthèse IA</p>
          <h2 className="text-lg font-semibold text-white">Résumé pour l&apos;équipe</h2>
        </div>
        {summary && (
          <div className="flex gap-2">
            <button
              onClick={generate}
              disabled={busy}
              className="h-10 px-4 rounded-lg border border-[#262626] text-sm text-[#A1A1AA] hover:text-white hover:bg-[#171717] disabled:opacity-50"
            >
              {busy ? "Génération…" : "Régénérer"}
            </button>
            <button
              onClick={download}
              className="h-10 px-4 rounded-lg bg-[#C9A84C] text-black font-semibold text-sm hover:bg-[#E8C97A]"
            >
              Télécharger le PDF
            </button>
          </div>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      {!summary && (busy || waiting) && (
        <p role="status" className="text-sm text-[#A1A1AA] flex items-center gap-3">
          <span className="w-4 h-4 rounded-full border-2 border-[#262626] border-t-[#C9A84C] animate-spin" />
          La synthèse est en cours de rédaction. Ça prend généralement 20 à 60 secondes.
        </p>
      )}

      {!summary && !busy && !waiting && (
        <div className="space-y-3">
          <p className="text-sm text-[#A1A1AA]">La synthèse n&apos;est pas encore disponible pour ce questionnaire.</p>
          <button onClick={generate} className="h-10 px-4 rounded-lg bg-[#C9A84C] text-black font-semibold text-sm hover:bg-[#E8C97A]">
            Générer la synthèse
          </button>
        </div>
      )}

      {summary && (
        <div className="space-y-5">
          <p className="text-white leading-relaxed">{summary.resume}</p>

          {pdf.figures.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {pdf.figures.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#262626] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA]">{label}</p>
                  <p className="text-white font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
            {SUMMARY_BLOCKS.map(([k, label]) => {
              const items = summary[k] as string[];
              return items.length ? (
                <div key={k}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C9A84C] mb-2">{label}</h3>
                  <ul className="space-y-1.5 text-sm text-[#D4D4D8] list-disc pl-5">
                    {items.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              ) : null;
            })}
          </div>

          {summary.priorites.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C9A84C] mb-2">Priorités du premier mois</h3>
              <ol className="space-y-1.5 text-sm text-[#D4D4D8] list-decimal pl-5">
                {summary.priorites.map((x, i) => <li key={i}>{x}</li>)}
              </ol>
            </div>
          )}
          {summary.questions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C9A84C] mb-2">À creuser au premier call</h3>
              <ul className="space-y-1.5 text-sm text-[#D4D4D8] list-disc pl-5">
                {summary.questions.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
          <p className="text-xs text-[#52525B]">Synthèse générée par IA à partir des réponses du client. À vérifier avant de la transmettre.</p>
        </div>
      )}
    </section>
  );
}
