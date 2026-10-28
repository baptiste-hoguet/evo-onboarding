import { Questionnaire } from "./Questionnaire";

// Lien public : https://…/questionnaire (?apercu=1 pour naviguer sans réponses obligatoires)
export default async function QuestionnaireStart({
  searchParams,
}: {
  searchParams: Promise<{ apercu?: string }>;
}) {
  const { apercu } = await searchParams;
  return <Questionnaire initial={null} preview={apercu === "1"} />;
}
