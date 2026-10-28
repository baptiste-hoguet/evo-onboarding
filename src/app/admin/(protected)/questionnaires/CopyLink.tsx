"use client";

import { useState } from "react";

// Lien public du questionnaire, à coller dans le chat du client
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState<"ok" | "manual" | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      setCopied("manual");
    }
    setTimeout(() => setCopied(null), 2500);
  }

  return (
    <div className="evo-card p-5 space-y-3">
      <div>
        <p className="text-sm font-medium text-white">Lien du questionnaire d&apos;onboarding</p>
        <p className="text-sm text-[#A1A1AA]">
          Envoie ce lien à ton client sur WhatsApp ou par message. Chaque client obtient son propre lien de reprise en
          cliquant sur « Commencer ».
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Lien du questionnaire"
          className="flex-1 min-w-0 h-11 px-4 rounded-lg bg-[#0A0A0A] border border-[#262626] text-white text-sm font-mono"
        />
        <button
          onClick={copy}
          className="h-11 px-5 rounded-lg bg-[#C9A84C] text-black font-semibold text-sm hover:bg-[#E8C97A] transition-colors"
        >
          {copied === "ok" ? "Lien copié ✓" : "Copier le lien"}
        </button>
      </div>
      {copied === "manual" && (
        <p className="text-xs text-[#A1A1AA]">La copie automatique est bloquée : sélectionne le lien et copie-le.</p>
      )}
    </div>
  );
}
