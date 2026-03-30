"use client";

import { Check, Lock, Loader2 } from "lucide-react";

type StepState = "completed" | "active" | "locked" | "waiting";

interface StepCardProps {
  title: string;
  stepNumber: number;
  state: StepState;
  waitingMessage?: string;
  children: React.ReactNode;
}

export function StepCard({
  title,
  stepNumber,
  state,
  waitingMessage = "En attente...",
  children,
}: StepCardProps) {
  if (state === "locked") {
    return (
      <div className="evo-card p-5 opacity-40 pointer-events-none transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-[#1E2D45] bg-[#111827] flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
          </div>
          <h3 className="text-[#94A3B8] font-medium">
            Étape {stepNumber} — {title}
          </h3>
        </div>
      </div>
    );
  }

  if (state === "completed") {
    return (
      <div className="evo-card p-5 transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-emerald-400 font-medium">
            Étape {stepNumber} — {title}
          </h3>
          <span className="ml-auto text-xs text-[#94A3B8]">Terminé</span>
        </div>
      </div>
    );
  }

  if (state === "waiting") {
    return (
      <div className="evo-card p-6 border-[#C9A84C]/50 evo-glow transition-all duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] flex items-center justify-center">
            <span className="text-sm font-semibold text-[#C9A84C]">
              {stepNumber}
            </span>
          </div>
          <h3 className="text-white font-semibold text-lg">
            Étape {stepNumber} — {title}
          </h3>
        </div>
        <div className="flex items-center justify-center gap-3 py-8 text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
          <span>{waitingMessage}</span>
        </div>
      </div>
    );
  }

  // active state
  return (
    <div className="evo-card p-6 border-[#C9A84C]/50 evo-glow transition-all duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] flex items-center justify-center">
          <span className="text-sm font-semibold text-[#C9A84C]">
            {stepNumber}
          </span>
        </div>
        <h3 className="text-white font-semibold text-lg">
          Etape {stepNumber} — {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
