"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface OfferConfig {
  id?: string;
  offer: string;
  welcomeVideoUrl: string;
  contractUrl: string;
  guideUrl: string;
  calComUrl: string;
  usefulLinks: string;
}

interface GlobalConfig {
  id?: string;
  nexusAmount: number;
  slackInviteUrl: string;
}

const defaultOfferConfig = (offer: string): OfferConfig => ({
  offer,
  welcomeVideoUrl: "",
  contractUrl: "",
  guideUrl: "",
  calComUrl: "",
  usefulLinks: "",
});

export default function ConfigPage() {
  const [configs, setConfigs] = useState<Record<string, OfferConfig>>({
    AGORA: defaultOfferConfig("AGORA"),
    NEXUS: defaultOfferConfig("NEXUS"),
    ATLAS: defaultOfferConfig("ATLAS"),
  });
  const [global, setGlobal] = useState<GlobalConfig>({
    nexusAmount: 0,
    slackInviteUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        const newConfigs = { ...configs };
        let globalData = { ...global };

        for (const config of data) {
          if (config.offer && (config.offer === "AGORA" || config.offer === "NEXUS" || config.offer === "ATLAS")) {
            newConfigs[config.offer] = {
              id: config.id,
              offer: config.offer,
              welcomeVideoUrl: config.welcomeVideoUrl || "",
              contractUrl: config.contractUrl || "",
              guideUrl: config.guideUrl || "",
              calComUrl: config.calComUrl || "",
              usefulLinks: config.usefulLinks || "",
            };
          } else if (!config.offer) {
            globalData = {
              id: config.id,
              nexusAmount: config.nexusAmount || 0,
              slackInviteUrl: config.slackInviteUrl || "",
            };
          }
        }

        setConfigs(newConfigs);
        setGlobal(globalData);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveOfferConfig = async (offer: string) => {
    setSaving(offer);
    try {
      const config = configs[offer];
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, offer }),
      });
      if (!res.ok) throw new Error("Erreur");
      const updated = await res.json();
      setConfigs((prev) => ({
        ...prev,
        [offer]: { ...prev[offer], id: updated.id },
      }));
      toast.success(`Configuration ${offer} sauvegardée`);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(null);
    }
  };

  const saveGlobalConfig = async () => {
    setSaving("global");
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...global,
          offer: null,
          nexusAmount: Number(global.nexusAmount),
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      const updated = await res.json();
      setGlobal((prev) => ({ ...prev, id: updated.id }));
      toast.success("Configuration globale sauvegardée");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(null);
    }
  };

  const updateOfferField = (
    offer: string,
    field: keyof OfferConfig,
    value: string
  ) => {
    setConfigs((prev) => ({
      ...prev,
      [offer]: { ...prev[offer], [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-[#94A3B8]">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-white">Configuration</h1>

      <Tabs defaultValue="AGORA" className="space-y-4">
        <TabsList className="bg-[#111827] border border-[#1E2D45] rounded-lg p-1">
          <TabsTrigger
            value="AGORA"
            className="rounded-md data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
          >
            AGORA
          </TabsTrigger>
          <TabsTrigger
            value="NEXUS"
            className="rounded-md data-[state=active]:bg-[#C9A84C]/20 data-[state=active]:text-[#E8C97A]"
          >
            NEXUS
          </TabsTrigger>
          <TabsTrigger
            value="ATLAS"
            className="rounded-md data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400"
          >
            ATLAS
          </TabsTrigger>
        </TabsList>

        {(["AGORA", "NEXUS", "ATLAS"] as const).map((offer) => (
          <TabsContent key={offer} value={offer}>
            <div className="evo-card p-6 space-y-5">
              <h2 className="text-lg font-semibold text-white">
                Configuration {offer}
              </h2>

              <div className="space-y-2">
                <Label className="text-[#94A3B8]">URL Vidéo de bienvenue</Label>
                <Input
                  placeholder="https://..."
                  value={configs[offer].welcomeVideoUrl}
                  onChange={(e) =>
                    updateOfferField(offer, "welcomeVideoUrl", e.target.value)
                  }
                  className="bg-[#111827] border-[#1E2D45] text-white placeholder:text-[#475569] rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#94A3B8]">URL Contrat</Label>
                <Input
                  placeholder="https://..."
                  value={configs[offer].contractUrl}
                  onChange={(e) =>
                    updateOfferField(offer, "contractUrl", e.target.value)
                  }
                  className="bg-[#111827] border-[#1E2D45] text-white placeholder:text-[#475569] rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#94A3B8]">URL Guide</Label>
                <Input
                  placeholder="https://..."
                  value={configs[offer].guideUrl}
                  onChange={(e) =>
                    updateOfferField(offer, "guideUrl", e.target.value)
                  }
                  className="bg-[#111827] border-[#1E2D45] text-white placeholder:text-[#475569] rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#94A3B8]">URL Cal.com</Label>
                <Input
                  placeholder="https://cal.com/..."
                  value={configs[offer].calComUrl}
                  onChange={(e) =>
                    updateOfferField(offer, "calComUrl", e.target.value)
                  }
                  className="bg-[#111827] border-[#1E2D45] text-white placeholder:text-[#475569] rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#94A3B8]">Liens utiles</Label>
                <Textarea
                  placeholder="Un lien par ligne..."
                  rows={4}
                  value={configs[offer].usefulLinks}
                  onChange={(e) =>
                    updateOfferField(offer, "usefulLinks", e.target.value)
                  }
                  className="bg-[#111827] border-[#1E2D45] text-white placeholder:text-[#475569] rounded-lg resize-none"
                />
              </div>

              <Button
                onClick={() => saveOfferConfig(offer)}
                disabled={saving === offer}
                className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] rounded-lg font-semibold"
              >
                {saving === offer ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Separator className="bg-[#1E2D45]" />

      {/* Global config */}
      <div className="evo-card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white">Configuration globale</h2>

        <div className="space-y-2">
          <Label className="text-[#94A3B8]">Montant NEXUS (&euro;)</Label>
          <Input
            type="number"
            placeholder="0"
            value={global.nexusAmount || ""}
            onChange={(e) =>
              setGlobal((p) => ({ ...p, nexusAmount: Number(e.target.value) }))
            }
            className="bg-[#111827] border-[#1E2D45] text-white placeholder:text-[#475569] rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#94A3B8]">URL Invitation Slack</Label>
          <Input
            placeholder="https://join.slack.com/..."
            value={global.slackInviteUrl}
            onChange={(e) =>
              setGlobal((p) => ({ ...p, slackInviteUrl: e.target.value }))
            }
            className="bg-[#111827] border-[#1E2D45] text-white placeholder:text-[#475569] rounded-lg"
          />
        </div>

        <Button
          onClick={saveGlobalConfig}
          disabled={saving === "global"}
          className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] rounded-lg font-semibold"
        >
          {saving === "global" ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
}
