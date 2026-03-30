"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface IBANDisplayProps {
  iban: string;
  amount: string;
  reference: string;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#E8C97A] transition-colors duration-200"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Copie !</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copier {label}</span>
        </>
      )}
    </button>
  );
}

export function IBANDisplay({ iban, amount, reference }: IBANDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="evo-card p-5 space-y-4">
        {/* IBAN */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-[#94A3B8]">IBAN</span>
            <CopyButton text={iban.replace(/\s/g, "")} label="l'IBAN" />
          </div>
          <p className="font-mono-iban text-white text-lg tracking-wider">
            {iban}
          </p>
        </div>

        {/* Amount */}
        <div>
          <span className="text-sm text-[#94A3B8] block mb-1.5">Montant</span>
          <p className="text-[#C9A84C] text-xl font-bold">{amount}</p>
        </div>

        {/* Reference */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-[#94A3B8]">Reference de virement</span>
            <CopyButton text={reference} label="la reference" />
          </div>
          <p className="font-mono-iban text-white text-base tracking-wide">
            {reference}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-200/90">
          Une fois votre virement effectué, cochez la case ci-dessous pour passer à l&apos;étape suivante.
        </p>
      </div>
    </div>
  );
}
