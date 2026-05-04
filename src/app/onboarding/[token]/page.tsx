import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OnboardingPortal } from "./OnboardingPortal";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { token },
    include: { documents: true },
  });

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 evo-gradient">
        <div className="evo-card p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Lien invalide</h1>
          <p className="text-[#94A3B8]">
            Ce lien d&apos;onboarding est invalide ou a expire. Veuillez contacter
            votre conseiller EVO pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  if (client.completedAt !== null) {
    redirect(`/onboarding/${token}/done`);
  }

  // Fetch config for the client's offer (if selected)
  const offerConfig = client.offer
    ? await prisma.config.findFirst({ where: { offer: client.offer } })
    : null;

  // Also fetch global config for nexusAmount
  const globalConfig = await prisma.config.findFirst({ where: { offer: null } });

  // Merge offer config with global config
  const config = offerConfig
    ? {
        ...offerConfig,
        nexusAmount: offerConfig.nexusAmount ?? globalConfig?.nexusAmount ?? null,
      }
    : null;

  // completedAt is null here (guaranteed by the redirect above)
  const serializedClient = {
    id: client.id,
    token: client.token,
    email: client.email,
    firstName: client.firstName,
    lastName: client.lastName,
    phone: client.phone,
    company: client.company,
    address: client.address,
    siret: client.siret,
    socials: client.socials,
    niche: client.niche,
    objective: client.objective,
    offer: client.offer,
    paymentSchedule: client.paymentSchedule,
    questionnaire: client.questionnaire,
    currentStep: client.currentStep,
    videoWatched: client.videoWatched,
    paymentSent: client.paymentSent,
    paymentConfirmed: client.paymentConfirmed,
    contractSigned: client.contractSigned,
    callBooked: client.callBooked,
    completedAt: null as string | null,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    documents: client.documents.map((doc) => ({
      id: doc.id,
      clientId: doc.clientId,
      name: doc.name,
      url: doc.url,
      type: doc.type,
      createdAt: doc.createdAt.toISOString(),
    })),
  };

  const serializedConfig = config
    ? {
        ...config,
        welcomeVideoUrl: config.welcomeVideoUrl,
        contractUrl: config.contractUrl,
        guideUrl: config.guideUrl,
        calComUrl: config.calComUrl,
        usefulLinks: config.usefulLinks,
        nexusAmount: config.nexusAmount,
      }
    : null;

  return (
    <OnboardingPortal client={serializedClient} config={serializedConfig} />
  );
}
