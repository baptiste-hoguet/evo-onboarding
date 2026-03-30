import { prisma } from "@/lib/prisma";
import { CompletionScreen } from "@/components/onboarding/CompletionScreen";
import { sendOnboardingCompleteEmail } from "@/lib/email";

export default async function DonePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { token },
  });

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 evo-gradient">
        <div className="evo-card p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Lien invalide</h1>
          <p className="text-[#94A3B8]">
            Ce lien d&apos;onboarding est invalide ou a expiré.
          </p>
        </div>
      </div>
    );
  }

  if (!client.completedAt) {
    await prisma.client.update({
      where: { id: client.id },
      data: { completedAt: new Date() },
    });

    await prisma.activity.create({
      data: {
        clientId: client.id,
        action: "onboarding_completed",
      },
    });

    const clientName = [client.firstName, client.lastName]
      .filter(Boolean)
      .join(" ") || client.email;
    await sendOnboardingCompleteEmail(client.email, clientName);
  }

  return <CompletionScreen />;
}
