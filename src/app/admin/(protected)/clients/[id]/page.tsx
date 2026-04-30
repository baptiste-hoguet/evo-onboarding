"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Activity {
  id: string;
  action: string;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

interface ClientDetail {
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
  signatureData: string | null;
  currentStep: number;
  videoWatched: boolean;
  paymentSent: boolean;
  paymentConfirmed: boolean;
  contractSigned: boolean;
  callBooked: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  activities: Activity[];
  documents: Document[];
}

const offerColors: Record<string, string> = {
  AGORA: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  NEXUS: "bg-[#C9A84C]/20 text-[#E8C97A] border-[#C9A84C]/30",
  ATLAS: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

const steps = [
  { key: "offer", label: "Offre sélectionnée" },
  { key: "videoWatched", label: "Vidéo visionnée" },
  { key: "contractSigned", label: "Contrat signé" },
  { key: "paymentSent", label: "Virement attesté" },
  { key: "callBooked", label: "Appel réservé" },
];

const paymentScheduleLabels: Record<string, string> = {
  "1x": "1 fois (comptant)",
  "2x": "2 fois",
  "3x": "3 fois",
  "exceptional": "Cas exceptionnel",
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const clientId = params.id as string;

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) throw new Error("Client introuvable");
      const data = await res.json();
      setClient(data);
    } catch {
      toast.error("Erreur lors du chargement du client");
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const confirmPayment = async () => {
    setActionLoading("payment");
    try {
      const res = await fetch(`/api/clients/${clientId}/confirm-payment`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success("Virement confirmé ✅");
      fetchClient();
    } catch {
      toast.error("Erreur lors de la confirmation");
    } finally {
      setActionLoading(null);
    }
  };

  const resendLink = async () => {
    setActionLoading("resend");
    try {
      const res = await fetch(`/api/clients/${clientId}/resend-link`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      await navigator.clipboard.writeText(data.link).catch(() => {});
      toast.success("Email renvoyé + lien copié");
      fetchClient();
    } catch {
      toast.error("Erreur lors du renvoi du lien");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteClient = async () => {
    setActionLoading("delete");
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success("Client supprimé");
      router.push("/admin");
    } catch {
      toast.error("Erreur lors de la suppression");
      setActionLoading(null);
    }
  };

  const copyPortalLink = async () => {
    if (!client) return;
    const link = `${window.location.origin}/onboarding/${client.token}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    toast.success("Lien copié");
  };

  const getStepStatus = (stepKey: string): boolean => {
    if (!client) return false;
    if (stepKey === "offer") return !!client.offer;
    return client[stepKey as keyof ClientDetail] as boolean;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) return null;

  const clientName =
    client.firstName || client.lastName
      ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
      : client.email;

  const portalLink = `${typeof window !== "undefined" ? window.location.origin : ""}/onboarding/${client.token}`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin")}
          className="text-[#94A3B8] hover:text-white hover:bg-[#1A2438] rounded-lg p-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{clientName}</h1>
            {client.completedAt && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 rounded-md">
                Terminé
              </Badge>
            )}
          </div>
          <p className="text-[#94A3B8] text-sm">{client.email}</p>
        </div>
        {client.offer && (
          <Badge
            variant="outline"
            className={`${offerColors[client.offer] || ""} rounded-md text-sm shrink-0`}
          >
            {client.offer}
          </Badge>
        )}
      </div>

      {/* Portal link */}
      <div className="evo-card p-4 flex items-center gap-3">
        <svg className="w-4 h-4 text-[#C9A84C] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span className="text-[#94A3B8] text-xs font-mono truncate flex-1">{portalLink}</span>
        <Button
          variant="ghost"
          onClick={copyPortalLink}
          className="text-[#94A3B8] hover:text-white hover:bg-[#1A2438] rounded-lg h-7 px-2 text-xs shrink-0"
        >
          Copier
        </Button>
      </div>

      {/* Info card */}
      <div className="evo-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Informations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <InfoField label="Email" value={client.email} />
          <InfoField label="Téléphone" value={client.phone} />
          <InfoField label="Entreprise" value={client.company} />
          <InfoField label="Adresse siège" value={client.address} />
          <InfoField label="SIRET" value={client.siret} />
          <InfoField label="Réseaux sociaux" value={client.socials} />
          <InfoField label="Échelonnement" value={client.paymentSchedule ? paymentScheduleLabels[client.paymentSchedule] ?? client.paymentSchedule : null} />
          <InfoField
            label="Créé le"
            value={new Date(client.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          {client.completedAt && (
            <InfoField
              label="Onboarding terminé le"
              value={new Date(client.completedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          )}
        </div>
        {client.objective && (
          <div className="mt-4">
            <dt className="text-[#475569] text-xs uppercase tracking-wider">Objectif</dt>
            <dd className="text-white mt-1 text-sm leading-relaxed">{client.objective}</dd>
          </div>
        )}
      </div>

      {/* Contrat généré */}
      <div className="evo-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Contrat</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <a
            href={`/api/onboarding/${client.token}/generate-contract`}
            download
            className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Télécharger le contrat rempli (.docx)
          </a>
          {client.contractSigned && (
            <span className="text-[#10B981] text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Contrat signé
            </span>
          )}
        </div>
        {client.signatureData && (
          <div className="mt-4">
            <p className="text-[#94A3B8] text-xs mb-2">Signature électronique :</p>
            <div className="bg-[#0A0F1E] border border-[#1E2D45] rounded-xl p-4 inline-block">
              <img src={client.signatureData} alt="Signature" className="max-w-xs h-auto" />
            </div>
            <p className="text-[#475569] text-xs mt-2">Signé électroniquement lors de l&apos;onboarding</p>
          </div>
        )}
      </div>

      {/* Progress steps */}
      <div className="evo-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Progression</h2>
        <div className="space-y-3">
          {steps.map((step, i) => {
            const completed = getStepStatus(step.key);
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    completed
                      ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                      : "bg-[#1A2438] text-[#475569]"
                  }`}
                >
                  {completed ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-medium">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-sm ${completed ? "text-white" : "text-[#475569]"}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="evo-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={resendLink}
            disabled={actionLoading === "resend"}
            className="border-[#1E2D45] text-[#94A3B8] hover:text-white hover:bg-[#1A2438] rounded-lg"
          >
            {actionLoading === "resend" ? "Envoi..." : "Renvoyer le lien d'accès"}
          </Button>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg"
                />
              }
            >
              Supprimer le client
            </DialogTrigger>
            <DialogContent className="bg-[#111827] border-[#1E2D45] text-white">
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription className="text-[#94A3B8]">
                  Cette action est irréversible. Toutes les données de{" "}
                  <strong className="text-white">{clientName}</strong> seront
                  définitivement supprimées.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  className="border-[#1E2D45] text-[#94A3B8] hover:text-white hover:bg-[#1A2438] rounded-lg"
                >
                  Annuler
                </Button>
                <Button
                  onClick={deleteClient}
                  disabled={actionLoading === "delete"}
                  className="bg-red-500 text-white hover:bg-red-600 rounded-lg"
                >
                  {actionLoading === "delete" ? "Suppression..." : "Supprimer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Documents */}
      {client.documents.length > 0 && (
        <div className="evo-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Documents</h2>
          <div className="space-y-2">
            {client.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A2438] transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1A2438] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{doc.name}</p>
                  <p className="text-xs text-[#475569]">
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <svg className="w-4 h-4 text-[#475569] group-hover:text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-[#1E2D45]" />

      {/* Activity timeline */}
      <div className="evo-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Historique des actions</h2>
        {client.activities.length === 0 ? (
          <p className="text-[#475569] text-sm">Aucune activité enregistrée</p>
        ) : (
          <div className="space-y-0">
            {[...client.activities].reverse().map((activity, i) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#C9A84C] mt-2 shrink-0" />
                  {i < client.activities.length - 1 && (
                    <div className="w-px flex-1 bg-[#1E2D45] mt-1 mb-0" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm text-white">{activity.action}</p>
                  <p className="text-xs text-[#475569] mt-0.5">
                    {new Date(activity.createdAt).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[#475569] text-xs uppercase tracking-wider">{label}</dt>
      <dd className="text-white mt-0.5 text-sm">
        {value || <span className="text-[#475569]">--</span>}
      </dd>
    </div>
  );
}
