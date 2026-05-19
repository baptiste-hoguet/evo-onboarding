"use client";

import { useState } from "react";
import type { Player } from "@/lib/undercover/types";

type MrWhiteGuessProps = {
  mrWhite: Player;
  onSubmit: (guess: string) => void;
};

export function MrWhiteGuess({ mrWhite, onSubmit }: MrWhiteGuessProps) {
  const [guess, setGuess] = useState("");

  const submit = () => {
    const value = guess.trim();
    if (!value) return;
    onSubmit(value);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-white-muted mb-2">
          Dernière chance
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {mrWhite.name}, tu étais Mr. White.
        </h2>
        <p className="text-sm text-white-muted">
          Devine le mot des civils pour renverser la partie. Si tu trouves, tu
          gagnes seul. La comparaison ignore les accents et la casse.
        </p>
      </div>

      <div className="evo-card p-6">
        <label
          htmlFor="mrwhite-guess"
          className="text-xs uppercase tracking-widest text-white-muted mb-2 block"
        >
          Ta proposition
        </label>
        <input
          id="mrwhite-guess"
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          autoFocus
          placeholder="Le mot des civils…"
          className="w-full h-14 px-4 rounded-lg bg-input border border-border focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 text-foreground text-xl placeholder:text-white-subtle"
        />
        <div className="text-[10px] text-white-subtle mt-2">
          Indice : c&apos;est le mot qu&apos;essayaient de décrire les civils.
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!guess.trim()}
        className="w-full h-12 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed evo-glow"
      >
        Valider ma réponse
      </button>
    </div>
  );
}
