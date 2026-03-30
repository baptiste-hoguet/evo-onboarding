"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { StepCard } from "@/components/onboarding/StepCard";
import { OfferSelector } from "@/components/onboarding/OfferSelector";
import { VideoEmbed } from "@/components/onboarding/VideoEmbed";
import { IBANDisplay } from "@/components/onboarding/IBANDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  "Choix de l'offre",
  "Vidéo de bienvenue",
  "Informations personnelles",
  "Questionnaire",
  "Contrat",
  "Paiement",
  "Réservation d'appel",
  "Documents",
];

const IBAN = "FR76 2823 3000 0159 3051 1883 723";

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

function getPaymentAmount(offer: string | null, config: SerializedConfig | null): string {
  if (offer === "AGORA") return "15 000 €";
  if (offer === "ATLAS") return "50 000 €";
  if (offer === "NEXUS") {
    const amount = config?.nexusAmount;
    return amount ? `${amount.toLocaleString("fr-FR")} €` : "Montant à confirmer";
  }
  return "";
}

function getPaymentScheduleLabel(schedule: string | null): string {
  switch (schedule) {
    case "2x": return "2 fois";
    case "3x": return "3 fois";
    case "exceptional": return "Échelonnement exceptionnel";
    default: return "1 fois (paiement comptant)";
  }
}

// Signature canvas component
function SignatureCanvas({
  onSign,
}: {
  onSign: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const pos = getPos(e, canvas);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasSignature(true);
    };

    const stopDraw = () => {
      if (isDrawing.current) {
        isDrawing.current = false;
        onSign(canvas.toDataURL("image/png"));
      }
    };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);

    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDraw);
      canvas.removeEventListener("mouseleave", stopDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDraw);
    };
  }, [onSign]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSign("");
  };

  return (
    <div className="space-y-2">
      <div className="relative border border-[#1E2D45] rounded-xl overflow-hidden bg-[#0A0F1E]">
        <canvas
          ref={canvasRef}
          width={560}
          height={160}
          className="w-full touch-none cursor-crosshair"
          style={{ display: "block" }}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[#475569] text-sm">Signez ici avec votre souris ou votre doigt</p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        className="text-xs text-[#94A3B8] hover:text-white transition-colors"
      >
        Effacer la signature
      </button>
    </div>
  );
}

export function OnboardingPortal({ client, config }: OnboardingPortalProps) {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(client.currentStep);

  // Step 2: Personal info
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

  // Step 3: Questionnaire
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      return client.questionnaire ? JSON.parse(client.questionnaire) : {};
    } catch {
      return {};
    }
  });

  // Step 5: Payment
  const [paymentChecked, setPaymentChecked] = useState(false);

  // Step 4: Contract signature
  const [signatureData, setSignatureData] = useState("");

  const handleSign = useCallback((dataUrl: string) => {
    setSignatureData(dataUrl);
  }, []);

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

  async function downloadContractPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const gold = [201, 168, 76] as [number, number, number];
    const dark = [10, 15, 30] as [number, number, number];
    const gray = [148, 163, 184] as [number, number, number];

    // Background
    doc.setFillColor(...dark);
    doc.rect(0, 0, 210, 297, "F");

    // Header band
    doc.setFillColor(...gold);
    doc.rect(0, 0, 210, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(10, 15, 30);
    doc.text("EVO INCUBATOR", 14, 14);

    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text(`Contrat — Offre ${client.offer || ""}`, 14, 32);
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 14, 39);

    // Separator
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.4);
    doc.line(14, 44, 196, 44);

    let y = 52;
    const addSection = (title: string, lines: [string, string][]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...gold);
      doc.text(title, 14, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      for (const [label, value] of lines) {
        doc.setTextColor(...gray);
        doc.text(`${label} :`, 16, y);
        doc.setTextColor(255, 255, 255);
        doc.text(value || "—", 70, y);
        y += 6;
      }
      y += 4;
    };

    addSection("Informations du client", [
      ["Nom", `${client.firstName || ""} ${client.lastName || ""}`.trim()],
      ["Email", client.email],
      ["Téléphone", client.phone || ""],
      ["Société", client.company || ""],
      ["Adresse siège", client.address || ""],
      ["SIRET", client.siret || ""],
    ]);

    addSection("Détails du contrat", [
      ["Offre", client.offer || ""],
      ["Montant", getPaymentAmount(client.offer, config)],
      ["Échelonnement", getPaymentScheduleLabel(client.paymentSchedule)],
      ["Référence", `EVO-${client.token.slice(0, 8).toUpperCase()}`],
    ]);

    // Signature
    if (signatureData && signatureData.startsWith("data:image/png")) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...gold);
      doc.text("Signature du client", 14, y);
      y += 6;
      doc.addImage(signatureData, "PNG", 14, y, 80, 25);
      y += 30;
    }

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text("EVO INCUBATOR — Document généré automatiquement", 14, 287);

    doc.save(`contrat-evo-${client.token.slice(0, 8)}.pdf`);
  }

  function renderStepContent(stepIndex: number) {
    // Step 0: Offer selection
    if (stepIndex === 0) {
      return (
        <OfferSelector
          onSelect={(offer) => apiCall("select-offer", { offer })}
          loading={loading}
        />
      );
    }

    // Step 1: Video
    if (stepIndex === 1) {
      const videoUrl = config?.welcomeVideoUrl || "";
      const watchUrl = videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      return (
        <div className="space-y-6">
          {/* Lien direct vers la vidéo (toujours accessible) */}
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full aspect-video bg-[#111827] border border-[#1E2D45] rounded-xl hover:border-[#C9A84C]/40 transition-colors group"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-red-500 transition-colors">
                <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-white font-medium">Regarder la vidéo de bienvenue</p>
              <p className="text-[#94A3B8] text-sm">Cliquez pour ouvrir dans YouTube</p>
            </div>
          </a>
          <div className="flex justify-center relative z-10">
            <a
              href={`/api/onboarding/${token}/watch-video-redirect`}
              className="inline-block bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              J&apos;ai regardé la vidéo ✓
            </a>
          </div>
        </div>
      );
    }

    // Step 2: Personal info
    if (stepIndex === 2) {
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
              <Label className="text-[#94A3B8]">Téléphone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            <Label className="text-[#94A3B8]">Nom de la société</Label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C]"
              placeholder="Ma Société SAS"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Adresse siège social</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-[#111827] border-[#1E2D45] text-white rounded-lg focus:border-[#C9A84C]"
              placeholder="12 rue de la Paix, 75001 Paris"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#94A3B8]">SIRET</Label>
            <Input
              value={formData.siret}
              onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
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

    // Step 3: Questionnaire
    if (stepIndex === 3) {
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

    // Step 4: Contract
    if (stepIndex === 4) {
      return (
        <div className="space-y-6">
          {/* Contract summary */}
          <div className="bg-[#111827] border border-[#1E2D45] rounded-xl p-5 space-y-3">
            <h4 className="text-[#C9A84C] font-semibold text-sm uppercase tracking-wide">Récapitulatif du contrat</h4>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-[#94A3B8]">Client</span>
              <span className="text-white">{[client.firstName, client.lastName].filter(Boolean).join(" ") || client.email}</span>
              <span className="text-[#94A3B8]">Société</span>
              <span className="text-white">{client.company || "—"}</span>
              <span className="text-[#94A3B8]">SIRET</span>
              <span className="text-white">{client.siret || "—"}</span>
              <span className="text-[#94A3B8]">Offre</span>
              <span className="text-white">{client.offer}</span>
              <span className="text-[#94A3B8]">Montant</span>
              <span className="text-white">{getPaymentAmount(client.offer, config)}</span>
              <span className="text-[#94A3B8]">Échelonnement</span>
              <span className="text-white">{getPaymentScheduleLabel(client.paymentSchedule)}</span>
            </div>
          </div>

          {/* Download button */}
          <Button
            type="button"
            variant="outline"
            onClick={downloadContractPdf}
            className="w-full border-[#1E2D45] text-[#C9A84C] hover:bg-[#C9A84C]/10 rounded-lg flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Télécharger le contrat PDF
          </Button>

          {/* Signature */}
          <div className="space-y-3">
            <h4 className="text-white font-medium text-sm">Signature électronique</h4>
            <p className="text-[#94A3B8] text-xs">
              En signant, vous acceptez les termes et conditions du contrat EVO INCUBATOR.
            </p>
            <SignatureCanvas onSign={handleSign} />
          </div>

          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => {
                if (!signatureData) {
                  toast.error("Veuillez signer le contrat avant de valider");
                  return;
                }
                apiCall("sign-contract", { signatureData });
              }}
              disabled={loading || !signatureData}
              className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-8 py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? "Validation..." : "Valider et signer le contrat"}
            </Button>
            <button
              onClick={() => apiCall("skip-contract")}
              disabled={loading}
              className="text-[#475569] hover:text-[#94A3B8] text-sm underline underline-offset-2 transition-colors"
            >
              Ignorer cette étape
            </button>
          </div>
        </div>
      );
    }

    // Step 5: Payment (attestation only)
    if (stepIndex === 5) {
      // NEXUS = paiement au pourcentage, pas de virement
      if (client.offer === "NEXUS") {
        return (
          <div className="space-y-6">
            <div className="bg-[#111827] border border-[#C9A84C]/30 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💼</span>
                <h4 className="text-[#C9A84C] font-semibold text-base">Offre NEXUS — Paiement au pourcentage</h4>
              </div>
              <p className="text-[#94A3B8] text-sm leading-relaxed">
                Dans le cadre de l&apos;offre NEXUS, aucun virement bancaire n&apos;est requis à cette étape.
                La rémunération d&apos;EVO INCUBATOR est calculée au pourcentage de tes résultats,
                selon les modalités définies dans ton contrat.
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => apiCall("payment-sent")}
                disabled={loading}
                className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-8 py-3 rounded-lg"
              >
                {loading ? "Chargement..." : "Continuer →"}
              </Button>
            </div>
          </div>
        );
      }

      const reference = `EVO-${client.token.slice(0, 8).toUpperCase()}`;
      return (
        <div className="space-y-6">
          <IBANDisplay
            iban={IBAN}
            amount={getPaymentAmount(client.offer, config)}
            reference={reference}
          />
          {client.paymentSchedule && client.paymentSchedule !== "1x" && (
            <div className="bg-[#111827] border border-[#1E2D45] rounded-xl p-4 text-sm">
              <span className="text-[#94A3B8]">Échelonnement : </span>
              <span className="text-[#C9A84C] font-medium">{getPaymentScheduleLabel(client.paymentSchedule)}</span>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Checkbox
              id="paymentCheck"
              checked={paymentChecked}
              onCheckedChange={(checked) => setPaymentChecked(checked === true)}
              className="border-[#1E2D45] data-[state=checked]:bg-[#C9A84C] data-[state=checked]:border-[#C9A84C] mt-0.5"
            />
            <Label htmlFor="paymentCheck" className="text-white cursor-pointer">
              J&apos;atteste avoir effectué mon virement bancaire
            </Label>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => apiCall("payment-sent")}
              disabled={loading || !paymentChecked}
              className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-8 py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Confirmer mon virement"}
            </Button>
          </div>
        </div>
      );
    }

    // Step 6: Call booking
    if (stepIndex === 6) {
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

    // Step 7: Documents
    if (stepIndex === 7) {
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
