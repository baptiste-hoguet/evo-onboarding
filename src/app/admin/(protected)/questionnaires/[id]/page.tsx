import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseReadable, parseSummary } from "@/lib/questionnaire-summary";
import { SummaryPanel } from "./SummaryPanel";

export const dynamic = "force-dynamic";

export default async function QuestionnaireDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.questionnaireResponse.findUnique({ where: { id } });
  if (!r || r.status !== "submitted") notFound();

  const { reponses, chiffres } = parseReadable(r.readable);
  const name = [r.firstName, r.lastName].filter(Boolean).join(" ") || "Client";
  const sections = new Map<string, typeof reponses>();
  for (const x of reponses) {
    const k = `${x.section}. ${x.sectionTitre}`;
    sections.set(k, [...(sections.get(k) || []), x]);
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-2">
        <Link href="/admin/questionnaires" className="text-sm text-[#A1A1AA] hover:text-white">← Questionnaires</Link>
        <h1 className="text-2xl font-bold text-white">{name}</h1>
        <p className="text-sm text-[#A1A1AA]">
          {[r.brand, r.email, r.submittedAt && `envoyé le ${r.submittedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })}`].filter(Boolean).join(" · ")}
        </p>
        {r.route && (
          <p className="inline-block text-xs px-2 py-1 rounded-full border border-[#C9A84C]/30 text-[#E8C97A]">Parcours : {r.route}</p>
        )}
      </div>

      <SummaryPanel
        id={r.id}
        initialSummary={parseSummary(r.summary)}
        submittedAt={r.submittedAt?.toISOString() ?? null}
        pdf={{ name, brand: r.brand, route: r.route, submittedAt: r.submittedAt?.toISOString() ?? null, figures: chiffres }}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Toutes les réponses</h2>
        {[...sections].map(([title, xs]) => (
          <details key={title} className="evo-card group" open={false}>
            <summary className="cursor-pointer list-none px-5 py-4 flex justify-between items-center text-white font-medium">
              {title}
              <span className="text-[#A1A1AA] text-sm group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <dl className="px-5 pb-4 divide-y divide-[#262626]">
              {xs.map((x) => (
                <div key={x.n} className="grid sm:grid-cols-[2fr_3fr] gap-1 sm:gap-6 py-3 text-sm">
                  <dt className="text-[#A1A1AA]">{x.numero}. {x.question}</dt>
                  <dd className={`whitespace-pre-wrap break-words ${x.reponse ? "text-white" : "text-[#52525B] italic"}`}>{x.reponse || "Pas de réponse"}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </section>
    </div>
  );
}
