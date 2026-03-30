"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    offer: "",
    firstName: "",
    lastName: "",
    paymentSchedule: "1x",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.offer) {
      toast.error("Email et offre sont requis");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      const data = await res.json();
      setGeneratedLink(data.link);
      if (data.emailSent === false) {
        toast.warning("Client créé, mais l'email n'a pas pu être envoyé. Partagez le lien manuellement.");
      } else {
        toast.success("Client créé et email envoyé avec succès");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Lien copié dans le presse-papier");
    }
  };

  if (generatedLink) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Client créé</h1>
        <div className="evo-card p-6 space-y-4">
          <p className="text-[#94A3B8] text-sm">
            Le client a été créé avec succès. Partagez ce lien d&apos;accès :
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={generatedLink}
              className="bg-[#0A0F1E] border-[#1E2D45] text-white rounded-lg font-mono text-sm"
            />
            <Button
              onClick={copyLink}
              className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] rounded-lg shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </Button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin")}
              className="border-[#1E2D45] text-[#94A3B8] hover:text-white hover:bg-[#1A2438] rounded-lg"
            >
              Retour au dashboard
            </Button>
            <Button
              onClick={() => {
                setGeneratedLink(null);
                setForm({ email: "", offer: "", firstName: "", lastName: "", paymentSchedule: "1x" });
              }}
              className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] rounded-lg"
            >
              Créer un autre client
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin")}
          className="text-[#94A3B8] hover:text-white hover:bg-[#1A2438] rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <h1 className="text-2xl font-bold text-white">Nouveau client</h1>
      </div>

      <div className="evo-card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#94A3B8]">
              Email <span className="text-red-400">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="client@email.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
              className="bg-[#111827] border-[#1E2D45] text-white placeholder:text-[#475569] rounded-lg focus:ring-[#C9A84C] focus:border-[#C9A84C]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer" className="text-[#94A3B8]">
              Offre <span className="text-red-400">*</span>
            </Label>
            <Select
              value={form.offer}
              onValueChange={(value) => setForm((p) => ({ ...p, offer: value ?? "" }))}
            >
              <SelectTrigger className="bg-[#111827] border-[#1E2D45] text-white rounded-lg">
                <SelectValue placeholder="Sélectionner une offre" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1E2D45]">
                <SelectItem value="AGORA">AGORA</SelectItem>
                <SelectItem value="NEXUS">NEXUS</SelectItem>
                <SelectItem value="ATLAS">ATLAS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentSchedule" className="text-[#94A3B8]">
              Échelonnement de paiement
            </Label>
            <Select
              value={form.paymentSchedule}
              onValueChange={(value) => setForm((p) => ({ ...p, paymentSchedule: value ?? "1x" }))}
            >
              <SelectTrigger className="bg-[#111827] border-[#1E2D45] text-white rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1E2D45]">
                <SelectItem value="1x">1 fois (paiement comptant)</SelectItem>
                <SelectItem value="2x">2 fois</SelectItem>
                <SelectItem value="3x">3 fois</SelectItem>
                <SelectItem value="exceptional">Cas exceptionnel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-[#94A3B8]">
                Prénom
              </Label>
              <Input
                id="firstName"
                placeholder="Jean"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                className="bg-[#111827] border-[#1E2D45] text-white placeholder:text-[#475569] rounded-lg focus:ring-[#C9A84C] focus:border-[#C9A84C]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-[#94A3B8]">
                Nom
              </Label>
              <Input
                id="lastName"
                placeholder="Dupont"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                className="bg-[#111827] border-[#1E2D45] text-white placeholder:text-[#475569] rounded-lg focus:ring-[#C9A84C] focus:border-[#C9A84C]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] rounded-lg font-semibold h-11"
          >
            {loading ? "Création..." : "Créer le client"}
          </Button>
        </form>
      </div>
    </div>
  );
}
