import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Questionnaire } from "../Questionnaire";

export const dynamic = "force-dynamic";

// Lien personnel du client : reprend ses réponses enregistrées
export default async function QuestionnaireResume({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ apercu?: string }>;
}) {
  const [{ id }, { apercu }] = await Promise.all([params, searchParams]);
  const r = await prisma.questionnaireResponse.findUnique({
    where: { id },
    select: { id: true, answers: true, section: true, status: true },
  });
  if (!r) notFound();

  let answers: Record<string, unknown> = {};
  try {
    answers = JSON.parse(r.answers);
  } catch {}

  return (
    <Questionnaire
      initial={{ id: r.id, answers, section: r.section, submitted: r.status === "submitted" }}
      preview={apercu === "1"}
    />
  );
}
