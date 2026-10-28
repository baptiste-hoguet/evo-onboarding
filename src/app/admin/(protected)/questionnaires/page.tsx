import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CopyLink } from "./CopyLink";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

function draftName(answers: string) {
  try {
    const a = JSON.parse(answers);
    return [a["1.prenom"], a["1.nom"]].filter((x) => typeof x === "string" && x.trim()).join(" ") || null;
  } catch {
    return null;
  }
}

export default async function QuestionnairesPage() {
  const h = await headers();
  const publicUrl = `${h.get("x-forwarded-proto") || "https"}://${h.get("host")}/questionnaire`;
  const rows = await prisma.questionnaireResponse.findMany({
    orderBy: [{ submittedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    take: 200,
    select: {
      id: true, status: true, firstName: true, lastName: true, brand: true, email: true, route: true,
      section: true, answers: true, summaryAt: true, submittedAt: true, updatedAt: true,
    },
  });
  const sent = rows.filter((r) => r.status === "submitted");
  const drafts = rows.filter((r) => r.status !== "submitted");

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Questionnaires</h1>
        <p className="text-sm text-[#A1A1AA]">Les réponses arrivent ici dès qu&apos;un client clique sur « Envoyer », avec la synthèse IA.</p>
      </div>

      <CopyLink url={publicUrl} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#C9A84C]">Reçus ({sent.length})</h2>
        {sent.length === 0 ? (
          <p className="text-sm text-[#A1A1AA] evo-card p-5">Aucun questionnaire reçu pour l&apos;instant. Copie le lien ci-dessus et envoie-le à ton premier client.</p>
        ) : (
          <div className="evo-card divide-y divide-[#262626] overflow-hidden">
            {sent.map((r) => (
              <Link key={r.id} href={`/admin/questionnaires/${r.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-4 hover:bg-[#171717] transition-colors">
                <div className="flex-1 min-w-[12rem]">
                  <p className="text-white font-medium">{[r.firstName, r.lastName].filter(Boolean).join(" ") || "Sans nom"}</p>
                  <p className="text-sm text-[#A1A1AA] truncate">{[r.brand, r.email].filter(Boolean).join(" · ")}</p>
                </div>
                {r.route && <span className="text-xs px-2 py-1 rounded-full border border-[#C9A84C]/30 text-[#E8C97A]">{r.route}</span>}
                <span className={`text-xs px-2 py-1 rounded-full border ${r.summaryAt ? "border-emerald-500/30 text-emerald-400" : "border-[#262626] text-[#A1A1AA]"}`}>
                  {r.summaryAt ? "Synthèse prête" : "Synthèse en cours"}
                </span>
                <span className="text-sm text-[#A1A1AA] tabular-nums w-28 text-right">{r.submittedAt && fmt(r.submittedAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {drafts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A1A1AA]">En cours de remplissage ({drafts.length})</h2>
          <div className="evo-card divide-y divide-[#262626] overflow-hidden">
            {drafts.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3 text-sm">
                <p className="flex-1 min-w-[12rem] text-white">{draftName(r.answers) || "Pas encore de nom"}</p>
                <span className="text-[#A1A1AA]">Section {r.section + 1}/10</span>
                <span className="text-[#A1A1AA] tabular-nums w-28 text-right">Modifié le {fmt(r.updatedAt)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
