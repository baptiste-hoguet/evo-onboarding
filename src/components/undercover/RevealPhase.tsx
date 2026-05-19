"use client";

import { useEffect, useState } from "react";
import type { Player } from "@/lib/undercover/types";

type RevealPhaseProps = {
  eliminated: Player;
  voteCounts: Record<string, number>;
  players: Player[];
  onContinue: () => void;
  continueLabel: string;
};

const ROLE_LABEL: Record<Player["role"], string> = {
  civilian: "Civil",
  undercover: "Undercover",
  mrwhite: "Mr. White",
};

const ROLE_ACCENT: Record<Player["role"], string> = {
  civilian: "text-foreground",
  undercover: "text-gold",
  mrwhite: "text-white",
};

export function RevealPhase({
  eliminated,
  voteCounts,
  players,
  onContinue,
  continueLabel,
}: RevealPhaseProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, []);

  const playerById = new Map(players.map((p) => [p.id, p]));
  const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-white-muted mb-2">
          Élimination
        </div>
        <h2 className="text-2xl font-bold">{eliminated.name} est éliminé</h2>
      </div>

      <div className="evo-card p-8 text-center evo-glow">
        <div className="text-xs uppercase tracking-widest text-white-muted mb-3">
          Son rôle était
        </div>
        <div
          className={`text-4xl font-bold mb-4 transition-all duration-500 ${revealed ? "opacity-100 scale-100" : "opacity-0 scale-75"} ${ROLE_ACCENT[eliminated.role]}`}
        >
          {ROLE_LABEL[eliminated.role]}
        </div>
        {eliminated.role !== "mrwhite" && (
          <div
            className={`text-sm text-white-muted transition-opacity duration-700 delay-200 ${revealed ? "opacity-100" : "opacity-0"}`}
          >
            Son mot était{" "}
            <span className="text-foreground font-semibold">
              « {eliminated.word} »
            </span>
          </div>
        )}
      </div>

      <div className="evo-card p-4">
        <div className="text-xs uppercase tracking-widest text-white-muted mb-3 px-1">
          Résultats du vote
        </div>
        <ul className="space-y-1">
          {sortedVotes.map(([targetId, count]) => {
            const target = playerById.get(targetId);
            if (!target) return null;
            return (
              <li
                key={targetId}
                className="flex items-center justify-between px-2 py-1.5"
              >
                <span className="text-sm">{target.name}</span>
                <span className="text-sm font-mono text-gold">
                  {count} vote{count > 1 ? "s" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full h-12 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-colors evo-glow"
      >
        {continueLabel}
      </button>
    </div>
  );
}
