"use client";

import { useState } from "react";
import { Check, Sparkles, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Offer = "AGORA" | "NEXUS" | "ATLAS";

interface OfferSelectorProps {
  onSelect: (offer: Offer) => void;
  loading?: boolean;
}

const OFFERS: {
  id: Offer;
  name: string;
  subtitle: string;
  price: string;
  icon: React.ReactNode;
  features: string[];
}[] = [
  {
    id: "AGORA",
    name: "Agora",
    subtitle: "Accompagnement Premium",
    price: "15 000 \u20AC",
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      "Coaching personnalise",
      "Acces communaute",
      "Ressources exclusives",
    ],
  },
  {
    id: "NEXUS",
    name: "Nexus",
    subtitle: "Accompagnement au % revenus",
    price: "% revenus",
    icon: <TrendingUp className="w-6 h-6" />,
    features: [
      "Paiement flexible",
      "Accompagnement complet",
      "Aligne sur vos resultats",
    ],
  },
  {
    id: "ATLAS",
    name: "Atlas",
    subtitle: "Accompagnement Elite",
    price: "50 000 \u20AC",
    icon: <Crown className="w-6 h-6" />,
    features: [
      "Accompagnement VIP",
      "Acces illimite",
      "Support prioritaire",
    ],
  },
];

export function OfferSelector({ onSelect, loading }: OfferSelectorProps) {
  const [selected, setSelected] = useState<Offer | null>(null);

  return (
    <div className="space-y-6">
      <p className="text-[#94A3B8] text-center">
        Choisissez votre offre pour demarrer votre parcours avec EVO.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OFFERS.map((offer) => {
          const isSelected = selected === offer.id;
          return (
            <button
              key={offer.id}
              onClick={() => setSelected(offer.id)}
              className={`
                relative evo-card p-6 text-left transition-all duration-200 cursor-pointer
                hover:border-[#C9A84C]/60 hover:evo-glow
                ${
                  isSelected
                    ? "border-[#C9A84C] bg-[#C9A84C]/10 evo-glow"
                    : ""
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-[#0A0F1E]" />
                </div>
              )}

              <div
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-4
                  ${
                    isSelected
                      ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                      : "bg-[#1E2D45]/50 text-[#94A3B8]"
                  }
                `}
              >
                {offer.icon}
              </div>

              <h4
                className={`text-lg font-bold mb-1 transition-colors duration-200 ${
                  isSelected ? "text-[#C9A84C]" : "text-white"
                }`}
              >
                {offer.name}
              </h4>
              <p className="text-sm text-[#94A3B8] mb-3">{offer.subtitle}</p>
              <p
                className={`text-xl font-bold mb-4 ${
                  isSelected ? "text-[#E8C97A]" : "text-white"
                }`}
              >
                {offer.price}
              </p>

              <ul className="space-y-2">
                {offer.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/60" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={() => onSelect(selected)}
            disabled={loading}
            className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-8 py-3 rounded-lg text-base transition-all duration-200"
          >
            {loading ? "Chargement..." : "Commencer mon onboarding"}
          </Button>
        </div>
      )}
    </div>
  );
}
