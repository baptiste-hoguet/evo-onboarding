"use client";

import type { Player, Winner } from "@/lib/undercover/types";

type GameOverProps = {
  winner: Winner;
  players: Player[];
  wordPair: { civilian: string; undercover: string };
  onReplay: () => void;
  onNewGame: () => void;
};

const WINNER_TITLE: Record<Winner, string> = {
  civilians: "Les civils gagnent",
  undercovers: "Les undercovers gagnent",
  mrwhite: "Mr. White gagne seul",
};

const WINNER_TAGLINE: Record<Winner, string> = {
  civilians: "Tous les infiltrés ont été démasqués.",
  undercovers: "Les infiltrés ont pris le dessus.",
  mrwhite: "Bluff réussi. Tout le monde s'est fait avoir.",
};

const ROLE_LABEL = {
  civilian: "Civil",
  undercover: "Undercover",
  mrwhite: "Mr. White",
} as const;

const ROLE_ACCENT = {
  civilian: "text-white-muted",
  undercover: "text-gold",
  mrwhite: "text-white",
} as const;

export function GameOver({
  winner,
  players,
  wordPair,
  onReplay,
  onNewGame,
}: GameOverProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="evo-card p-8 text-center evo-glow">
        <div className="text-xs uppercase tracking-widest text-white-muted mb-2">
          Fin de partie
        </div>
        <h2 className="text-3xl font-bold text-gold mb-2">
          {WINNER_TITLE[winner]}
        </h2>
        <p className="text-sm text-white-muted">{WINNER_TAGLINE[winner]}</p>
      </div>

      <div className="evo-card p-5">
        <div className="text-xs uppercase tracking-widest text-white-muted mb-3">
          Mots
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-secondary border border-border p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-white-muted mb-1">
              Civils
            </div>
            <div className="font-semibold text-foreground">
              {wordPair.civilian}
            </div>
          </div>
          <div className="rounded-lg bg-secondary border border-border p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-white-muted mb-1">
              Undercover
            </div>
            <div className="font-semibold text-gold">{wordPair.undercover}</div>
          </div>
        </div>
      </div>

      <div className="evo-card p-4">
        <div className="text-xs uppercase tracking-widest text-white-muted mb-3 px-1">
          Tous les rôles
        </div>
        <ul className="space-y-1">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between px-2 py-2 border-b border-border/40 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${p.alive ? "bg-success" : "bg-evo-error"}`}
                  aria-hidden
                />
                <span
                  className={`text-sm ${p.alive ? "text-foreground" : "text-white-muted line-through"}`}
                >
                  {p.name}
                </span>
              </div>
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${ROLE_ACCENT[p.role]}`}
              >
                {ROLE_LABEL[p.role]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onNewGame}
          className="flex-1 h-12 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors font-medium"
        >
          Nouvelle partie
        </button>
        <button
          type="button"
          onClick={onReplay}
          className="flex-1 h-12 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-colors evo-glow"
        >
          Rejouer
        </button>
      </div>
    </div>
  );
}
