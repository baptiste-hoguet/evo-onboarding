import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CONSTRAINT_KEYS,
  CONSTRAINT_LABELS,
  activityLabel,
  constraintBadgeClass,
  constraintLabel,
  filtersQuery,
  filtersWhere,
  fmtDate,
  isConstraintKey,
  rangeLabel,
  readFilters,
} from "@/lib/diagnostic-admin";

export const dynamic = "force-dynamic";

const LIMIT = 500;

// Hors du rendu : la date de référence est calculée à chaque requête (page dynamique)
function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export default async function DiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const filters = readFilters(await searchParams);
  const where = filtersWhere(filters);
  const isFiltered = Boolean(filters.contrainte || filters.recontact || filters.calendly);

  const [total, lastWeek, clickedCalendly, byConstraint, filteredCount, rows] = await Promise.all([
    prisma.diagnosticLead.count(),
    prisma.diagnosticLead.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.diagnosticLead.count({ where: { calendlyClickAt: { not: null } } }),
    prisma.diagnosticLead.groupBy({ by: ["constraintKey"], _count: { _all: true } }),
    prisma.diagnosticLead.count({ where }),
    prisma.diagnosticLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: {
        id: true, createdAt: true, firstName: true, email: true, instagram: true, activity: true,
        revenueRange: true, goalRange: true, constraintKey: true, score: true, consentRecontact: true, calendlyClickAt: true,
      },
    }),
  ]);

  const calendlyPct = total > 0 ? Math.round((clickedCalendly / total) * 100) : 0;
  const breakdown = byConstraint
    .map((g) => ({ key: g.constraintKey, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  const stats = [
    { label: "Diagnostics", value: total.toLocaleString("fr-FR") },
    { label: "7 derniers jours", value: lastWeek.toLocaleString("fr-FR") },
    { label: "Ont cliqué Calendly", value: `${calendlyPct} %`, hint: `${clickedCalendly} sur ${total}` },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnostics</h1>
          <p className="text-sm text-[#A1A1AA]">Chaque coach qui a fait le Diagnostic express public, avec sa contrainte n°1.</p>
        </div>
        <a
          href={`/api/admin/diagnostics/export${filtersQuery(filters)}`}
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[#C9A84C] text-black text-sm font-semibold hover:bg-[#E8C97A] transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exporter CSV
        </a>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="evo-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-white tabular-nums">{s.value}</p>
            {s.hint && <p className="text-xs text-[#71717A] tabular-nums">{s.hint}</p>}
          </div>
        ))}
      </section>

      {breakdown.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#C9A84C]">Par contrainte n°1</h2>
          <div className="flex flex-wrap gap-2">
            {breakdown.map((b) => (
              <Link
                key={b.key}
                href={`/admin/diagnostics${filtersQuery({ ...filters, contrainte: isConstraintKey(b.key) && filters.contrainte !== b.key ? b.key : null })}`}
                className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-opacity hover:opacity-80 ${constraintBadgeClass(b.key)} ${filters.contrainte && filters.contrainte !== b.key ? "opacity-50" : ""}`}
              >
                {constraintLabel(b.key)}
                <span className="tabular-nums font-semibold">{b.count}</span>
                <span className="tabular-nums opacity-70">{total > 0 ? Math.round((b.count / total) * 100) : 0} %</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <form method="get" className="evo-card p-4 flex flex-col md:flex-row md:items-center gap-3 text-sm">
        <label className="flex items-center gap-2 text-[#A1A1AA]">
          Contrainte
          <select
            name="contrainte"
            defaultValue={filters.contrainte ?? ""}
            className="h-9 rounded-lg bg-[#0A0A0A] border border-[#262626] text-white px-3"
          >
            <option value="">Toutes</option>
            {CONSTRAINT_KEYS.map((k) => (
              <option key={k} value={k}>{CONSTRAINT_LABELS[k]}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-white cursor-pointer">
          <input type="checkbox" name="recontact" value="1" defaultChecked={filters.recontact} className="accent-[#C9A84C] w-4 h-4" />
          Accepte d&apos;être recontacté
        </label>
        <label className="flex items-center gap-2 text-white cursor-pointer">
          <input type="checkbox" name="calendly" value="1" defaultChecked={filters.calendly} className="accent-[#C9A84C] w-4 h-4" />
          A cliqué Calendly
        </label>
        <div className="flex gap-2 md:ml-auto">
          <button type="submit" className="h-9 px-4 rounded-lg border border-[#C9A84C]/40 text-[#E8C97A] hover:bg-[#C9A84C]/10 transition-colors">
            Filtrer
          </button>
          {isFiltered && (
            <Link href="/admin/diagnostics" className="h-9 px-4 inline-flex items-center rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#171717] transition-colors">
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A1A1AA]">
          {isFiltered ? `Résultats filtrés (${filteredCount})` : `Tous les diagnostics (${filteredCount})`}
          {filteredCount > LIMIT && <span className="normal-case font-normal"> · {LIMIT} plus récents affichés, l&apos;export CSV contient tout</span>}
        </h2>

        {rows.length === 0 ? (
          <p className="text-sm text-[#A1A1AA] evo-card p-5">
            {isFiltered ? "Aucun diagnostic ne correspond à ces filtres." : "Aucun diagnostic pour l'instant. Ils apparaîtront ici dès qu'un coach aura fait le Diagnostic express."}
          </p>
        ) : (
          <div className="evo-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#262626] hover:bg-transparent">
                  <TableHead className="text-[#A1A1AA]">Date</TableHead>
                  <TableHead className="text-[#A1A1AA]">Prénom</TableHead>
                  <TableHead className="text-[#A1A1AA]">Email</TableHead>
                  <TableHead className="text-[#A1A1AA]">Instagram</TableHead>
                  <TableHead className="text-[#A1A1AA]">Activité</TableHead>
                  <TableHead className="text-[#A1A1AA]">CA actuel → objectif</TableHead>
                  <TableHead className="text-[#A1A1AA]">Contrainte n°1</TableHead>
                  <TableHead className="text-[#A1A1AA] text-right">Score</TableHead>
                  <TableHead className="text-[#A1A1AA]">Recontact</TableHead>
                  <TableHead className="text-[#A1A1AA]">Calendly cliqué</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-[#262626] hover:bg-[#171717] transition-colors">
                    <TableCell className="text-[#A1A1AA] tabular-nums">{fmtDate(r.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/diagnostics/${r.id}`} className="text-white font-medium hover:text-[#E8C97A] underline-offset-4 hover:underline">
                        {r.firstName || "Sans prénom"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[#A1A1AA] max-w-[14rem] truncate">{r.email}</TableCell>
                    <TableCell className="text-[#A1A1AA]">{r.instagram ? `@${r.instagram}` : <span className="text-[#52525B]">—</span>}</TableCell>
                    <TableCell className="text-white">{activityLabel(r.activity)}</TableCell>
                    <TableCell className="text-white tabular-nums">
                      {rangeLabel(r.revenueRange)} <span className="text-[#C9A84C]">→</span> {rangeLabel(r.goalRange)}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full border ${constraintBadgeClass(r.constraintKey)}`}>{constraintLabel(r.constraintKey)}</span>
                    </TableCell>
                    <TableCell className="text-white tabular-nums text-right">{r.score}</TableCell>
                    <TableCell className={r.consentRecontact ? "text-emerald-400" : "text-[#52525B]"}>{r.consentRecontact ? "oui" : "non"}</TableCell>
                    <TableCell className="text-[#A1A1AA] tabular-nums">{r.calendlyClickAt ? fmtDate(r.calendlyClickAt) : <span className="text-[#52525B]">—</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
