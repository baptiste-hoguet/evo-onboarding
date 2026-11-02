import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { DiagnosticResult } from "@/lib/diagnostic/types";
import { DiagnosticFooter, DiagnosticTop } from "../Chrome";
import { ResultView } from "../ResultView";

export const dynamic = "force-dynamic";

// Page personnelle (lien non devinable) : jamais indexée.
export const metadata: Metadata = {
  title: "Ton diagnostic express · EVO Incubator",
  robots: { index: false, follow: false },
};

export default async function DiagnosticResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) notFound();

  const lead = await prisma.diagnosticLead.findUnique({
    where: { id },
    select: { id: true, firstName: true, email: true, result: true },
  });
  if (!lead) notFound();

  let result: DiagnosticResult;
  try {
    result = JSON.parse(lead.result) as DiagnosticResult;
  } catch {
    notFound();
  }

  return (
    <>
      <DiagnosticTop />
      <main className="dg">
        <ResultView result={result} leadId={lead.id} firstName={lead.firstName} email={lead.email} />
        <DiagnosticFooter />
      </main>
    </>
  );
}
