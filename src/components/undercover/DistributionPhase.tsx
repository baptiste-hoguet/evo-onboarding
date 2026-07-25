"use client";

import { useState } from "react";
import type { Player } from "@/lib/undercover/types";

type DistributionPhaseProps = {
  player: Player;
  index: number;
  total: number;
  onSeen: () => void;
};

export function DistributionPhase({
  player,
  index,
  total,
  onSeen,
}: DistributionPhaseProps) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[60vh] px-4">
        <div className="text-xs uppercase tracking-widest text-white-muted mb-3">
          Joueur {index + 1} / {total}
        </div>
        <div className="size-16 rounded-full bg-secondary border border-border flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-7 text-gold"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-1">Passe l&apos;appareil à</h2>
        <p className="text-3xl font-bold text-gold mb-8">{player.name}</p>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="w-full max-w-xs h-14 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-colors evo-glow"
        >
          Voir mon mot
        </button>
        <p className="text-xs text-white-muted mt-4 max-w-xs">
          Sois discret. Ne montre pas l&apos;écran aux autres joueurs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[60vh] px-4">
      <div className="text-xs uppercase tracking-widest text-white-muted mb-2">
        {player.name}
      </div>
      {player.role === "mrwhite" ? (
        <>
          <div className="text-lg text-white-muted mb-2">Tu es</div>
          <div className="text-5xl font-bold text-gold mb-4 tracking-tight">
            Mr. White
          </div>
          <p className="text-sm text-white-muted max-w-xs mb-8">
            Tu n&apos;as pas de mot. Écoute les autres et bluffe pour ne pas te
            faire repérer.
          </p>
        </>
      ) : (
        <>
          <div className="text-lg text-white-muted mb-2">Ton mot</div>
          <div className="evo-card px-8 py-6 mb-4 evo-glow">
            <div className="text-4xl font-bold text-gold tracking-tight">
              {player.word}
            </div>
          </div>
          <p className="text-sm text-white-muted max-w-xs mb-8">
            Souviens-toi de ton mot. Ne le dis jamais directement aux autres.
          </p>
        </>
      )}
      <button
        type="button"
        onClick={onSeen}
        className="w-full max-w-xs h-14 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-colors border border-border"
      >
        J&apos;ai vu, cacher
      </button>
    </div>
  );
}
