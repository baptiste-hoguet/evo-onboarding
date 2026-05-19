"use client";

import type { Player } from "@/lib/undercover/types";

type DescriptionPhaseProps = {
  players: Player[];
  speakingOrder: string[];
  round: number;
  onContinue: () => void;
};

export function DescriptionPhase({
  players,
  speakingOrder,
  round,
  onContinue,
}: DescriptionPhaseProps) {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const orderedPlayers = speakingOrder
    .map((id) => playerById.get(id))
    .filter((p): p is Player => Boolean(p));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-white-muted mb-1">
          Tour {round}
        </div>
        <h2 className="text-2xl font-bold mb-1">Ordre de parole</h2>
        <p className="text-sm text-white-muted">
          Chacun donne un mot ou une phrase décrivant son mot — sans le
          prononcer.
        </p>
      </div>

      <ol className="space-y-2">
        {orderedPlayers.map((player, index) => (
          <li
            key={player.id}
            className="flex items-center gap-3 evo-card px-4 py-3"
          >
            <span className="size-9 rounded-full bg-gold/15 text-gold font-mono font-bold text-sm flex items-center justify-center shrink-0">
              {index + 1}
            </span>
            <span className="text-base font-medium text-foreground">
              {player.name}
            </span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={onContinue}
        className="w-full h-12 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-colors evo-glow"
      >
        Passer au vote
      </button>
    </div>
  );
}
