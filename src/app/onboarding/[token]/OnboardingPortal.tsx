"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { StepCard } from "@/components/onboarding/StepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, ExternalLink } from "lucide-react";

interface SerializedDocument {
  id: string;
  clientId: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

interface SerializedClient {
  id: string;
  token: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  siret: string | null;
  socials: string | null;
  niche: string | null;
  objective: string | null;
  offer: string | null;
  paymentSchedule: string | null;
  questionnaire: string | null;
  currentStep: number;
  videoWatched: boolean;
  paymentSent: boolean;
  paymentConfirmed: boolean;
  contractSigned: boolean;
  callBooked: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documents: SerializedDocument[];
}

interface SerializedConfig {
  id: string;
  offer: string | null;
  welcomeVideoUrl: string | null;
  contractUrl: string | null;
  guideUrl: string | null;
  calComUrl: string | null;
  usefulLinks: string | null;
  nexusAmount: number | null;
}

interface OnboardingPortalProps {
  client: SerializedClient;
  config: SerializedConfig | null;
}

const STEP_TITLES = [
  "Informations personnelles",
  "Questionnaire",
  "Réservation d'appel",
  "Documents",
];

const QUESTIONNAIRE_SECTIONS = [
  {
    emoji: "🎯",
    title: "Vision & Offre",
    questions: [
      "Quelle est ton offre principale (en une phrase) ?",
      "Quel problème précis résous-tu ?",
      "Quelle transformation permets-tu au client ?",
      "Quelle est ta cible principale (avatar client) ?",
      "Quel est ton positionnement sur le marché ?",
    ],
  },
  {
    emoji: "💰",
    title: "Produit & Pricing",
    questions: [
      "Quels sont tes produits et offres actuels ?",
      "Quel est le prix de chaque offre ?",
      "Proposes-tu du paiement en plusieurs fois ?",
      "Quel est ton panier moyen actuel ?",
      "Quelle offre génère le plus de chiffre d'affaires ?",
    ],
  },
  {
    emoji: "📈",
    title: "Acquisition",
    questions: [
      "Quels sont tes principaux canaux d'acquisition ? (Instagram, Ads, bouche-à-oreille, etc.)",
      "Combien de leads génères-tu par semaine ?",
      "Quel est ton coût d'acquisition client estimé ?",
      "As-tu déjà fait de la publicité ? Si oui, quels résultats ?",
      "Quel est ton principal levier d'acquisition aujourd'hui ?",
    ],
  },
  {
    emoji: "🔄",
    title: "Funnel & Conversion",
    questions: [
      "Décris ton funnel actuel (de leads jusqu'à clients).",
      "Quel est ton taux de conversion leads → calls ?",
      "Quel est ton taux de closing ?",
      "Utilises-tu un setter, un closer, ou les deux ?",
      "Combien de calls fais-tu par semaine ?",
    ],
  },
  {
    emoji: "🎨",
    title: "Contenu & Branding",
    questions: [
      "Sur quelle(s) plateforme(s) es-tu actif ?",
      "Combien de contenus publies-tu par semaine ?",
      "Quel type de contenu fonctionne le mieux ?",
      "As-tu une stratégie de contenu claire ?",
      "Quel est ton principal objectif avec le contenu ?",
    ],
  },
  {
    emoji: "🚀",
    title: "Delivery & Expérience Client",
    questions: [
      "Comment délivres-tu ton service ? (Coaching, formation, done for you, etc.)",
      "Combien de clients peux-tu activer en même temps ?",
      "Quelle est la durée moyenne d'un de tes accompagnements ?",
      "As-tu un process interne documenté ?",
      "Quel est ton problème principal en delivery aujourd'hui ?",
    ],
  },
  {
    emoji: "👥",
    title: "Équipe & Organisation",
    questions: [
      "Combien de personnes sont dans ton équipe ?",
      "Qui fait quoi dans ton équipe ?",
      "As-tu des freelances ou des prestataires ?",
      "Quel est ton rôle principal aujourd'hui ?",
      "Quel est ton plus gros blocage organisationnel ?",
    ],
  },
  {
    emoji: "⚡",
    title: "Problèmes & Priorités",
    questions: [
      "Quel est ton plus gros problème aujourd'hui ?",
      "Que veux-tu débloquer en priorité ?",
      "Qu'as-tu déjà testé sans succès ?",
      "Quel est le principal frein à ta croissance ?",
    ],
  },
];

export function OnboardingPortal({ client, config }: OnboardingPortalProps) {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(client.currentStep);

  // Step 0: Personal info
  const [formData, setFormData] = useState({
    firstName: client.firstName ?? "",
    lastName: client.lastName ?? "",
    phone: client.phone ?? "",
    company: client.company ?? "",
    address: client.address ?? "",
    siret: client.siret ?? "",
    instagram: client.socials?.split(",")[0]?.trim() ?? "",
    linkedin: client.socials?.split(",")[1]?.trim() ?? "",
  });

  // Step 1: Questionnaire
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      return client.questionnaire ? JSON.parse(client.questionnaire) : {};
    } catch {
      return {};
    }
  });

  async function apiCall(endpoint: string, body?: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/onboarding/${token}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Une erreur est survenue");
      }
      const data = await res.json();
      if (data?.client?.currentStep !== undefined) {
        setCurrentStep(data.client.currentStep);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function getStepState(stepIndex: number) {
    if (stepIndex < currentStep) return "completed" as const;
    if (stepIndex === currentStep) return "active" as const;
    return "locked" as const;
  }

  function renderStepContent(stepIndex: number) {
    // Step 0: Personal info
    if (stepIndex === 0) {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apiCall("update-info", {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              company: formData.company,
              address: formData.address,
              siret: formData.siret,
              socials: [formData.instagram, formData.linkedin].filter(Boolean).join(","),
            });
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Prénom *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C]"
                placeholder="Jean"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Nom *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C]"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Téléphone *</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C]"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Email</Label>
              <Input
                value={client.email}
                readOnly
                className="bg-[#0A0F1E] border-[#1E2D45] text-[#94A3B8] rounded-lg cursor-default"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Nom de la société *</Label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
              className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C]"
              placeholder="Ma Société SAS"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Adresse siège social *</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C]"
              placeholder="12 rue de la Paix, 75001 Paris"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#94A3B8]">SIRET *</Label>
            <Input
              value={formData.siret}
              onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
              required
              className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C]"
              placeholder="123 456 789 00012"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">Instagram</Label>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C]"
                placeholder="@votre_compte"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#94A3B8]">LinkedIn</Label>
              <Input
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C]"
                placeholder="URL de votre profil"
              />
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-8 py-3 rounded-lg"
            >
              {loading ? "Enregistrement..." : "Enregistrer mes informations"}
            </Button>
          </div>
        </form>
      );
    }

    // Step 1: Questionnaire
    if (stepIndex === 1) {
      let qIndex = 0;
      return (
        <div className="space-y-8">
          {QUESTIONNAIRE_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-[#C9A84C] font-semibold text-sm tracking-wide uppercase flex items-center gap-2">
                <span>{section.emoji}</span>
                <span>{section.title}</span>
              </h3>
              {section.questions.map((question) => {
                const key = `q${qIndex++}`;
                return (
                  <div key={key} className="space-y-2">
                    <Label className="text-[#94A3B8] text-sm">{question}</Label>
                    <Textarea
                      value={answers[key] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C] min-h-[80px] resize-none"
                      placeholder="Votre réponse..."
                    />
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => apiCall("save-questionnaire", { answers })}
              disabled={loading}
              className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-8 py-3 rounded-lg"
            >
              {loading ? "Enregistrement..." : "Valider le questionnaire"}
            </Button>
          </div>
        </div>
      );
    }

    // Step 2: Call booking
    if (stepIndex === 2) {
      const calUrl = config?.calComUrl;
      return (
        <div className="space-y-6">
          {calUrl ? (
            <div className="rounded-xl overflow-hidden border border-[#1E2D45]">
              <iframe
                src={calUrl}
                className="w-full border-0"
                style={{ height: "600px" }}
                title="Réserver un appel"
              />
            </div>
          ) : (
            <div className="bg-[#111827] border border-[#1E2D45] rounded-xl p-8 text-center">
              <p className="text-[#94A3B8]">
                Le lien de réservation sera bientôt disponible. Vous serez notifié par email.
              </p>
            </div>
          )}
          <div className="flex justify-center">
            <Button
              onClick={() => apiCall("book-call")}
              disabled={loading}
              className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-8 py-3 rounded-lg"
            >
              {loading ? "Chargement..." : "J'ai réservé mon call"}
            </Button>
          </div>
        </div>
      );
    }

    // Step 3: Documents
    if (stepIndex === 3) {
      const usefulLinks = config?.usefulLinks
        ? config.usefulLinks.split("\n").filter(Boolean)
        : [];

      return (
        <div className="space-y-6">
          <p className="text-[#94A3B8]">
            Voici un récapitulatif de vos documents et ressources utiles.
          </p>

          {/* Charte du client idéal — document fixe */}
          <div className="bg-[#111827] border border-[#C9A84C]/30 rounded-xl p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#C9A84C] shrink-0" />
            <div className="flex-1">
              <span className="text-white block text-sm font-medium">La Charte du Client Idéal</span>
              <span className="text-[#94A3B8] text-xs">Document à lire et à garder</span>
            </div>
            <a
              href="/documents/EVO_Charte_Client_Ideal.docx"
              download
              className="text-[#C9A84C] hover:text-[#E8C97A] transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>

          {config?.contractUrl && (
            <div className="bg-[#111827] border border-[#1E2D45] rounded-xl p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#C9A84C] shrink-0" />
              <span className="text-white flex-1">Contrat</span>
              <a href={config.contractUrl} target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:text-[#E8C97A]">
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}

          {config?.guideUrl && (
            <div className="bg-[#111827] border border-[#1E2D45] rounded-xl p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#C9A84C] shrink-0" />
              <span className="text-white flex-1">Guide PDF</span>
              <a href={config.guideUrl} target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:text-[#E8C97A]">
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}

          {client.documents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-medium text-sm">Vos documents</h4>
              {client.documents.map((doc) => (
                <div key={doc.id} className="bg-[#111827] border border-[#1E2D45] rounded-xl p-4 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#94A3B8] shrink-0" />
                  <span className="text-white flex-1 text-sm">{doc.name}</span>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:text-[#E8C97A]">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {usefulLinks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-medium text-sm">Liens utiles</h4>
              {usefulLinks.map((link, i) => {
                const [label, url] = link.includes("|")
                  ? link.split("|").map((s) => s.trim())
                  : [link, link];
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#111827] border border-[#1E2D45] rounded-xl p-4 flex items-center gap-3 hover:border-[#C9A84C]/40 transition-colors block"
                  >
                    <ExternalLink className="w-4 h-4 text-[#C9A84C] shrink-0" />
                    <span className="text-white text-sm">{label}</span>
                  </a>
                );
              })}
            </div>
          )}

          <div className="flex justify-center pt-2">
            <Button
              onClick={() => { window.location.href = `/onboarding/${token}/done`; }}
              disabled={loading}
              className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-8 py-3 rounded-lg"
            >
              Finaliser mon onboarding
            </Button>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] pb-12">
      {/* Header */}
      <div className="flex justify-center pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-wider">
            <span className="text-[#C9A84C]">EVO</span> INCUBATOR
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">Portail d&apos;onboarding</p>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar currentStep={currentStep} />

      {/* Steps */}
      <div className="max-w-2xl mx-auto px-4 space-y-4 mt-6">
        {STEP_TITLES.map((title, index) => {
          const state = getStepState(index);
          return (
            <StepCard key={index} title={title} stepNumber={index} state={state}>
              {state === "active" ? renderStepContent(index) : <div />}
            </StepCard>
          );
        })}
      </div>
    </div>
  );
}
