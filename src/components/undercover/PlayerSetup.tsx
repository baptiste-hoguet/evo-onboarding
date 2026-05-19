"use client";

import { useState } from "react";
import { validatePlayerNames } from "@/lib/undercover/game-logic";

type PlayerSetupProps = {
  initialNames: string[];
  onConfirm: (names: string[]) => void;
};

export function PlayerSetup({ initialNames, onConfirm }: PlayerSetupProps) {
  const [names, setNames] = useState<string[]>(
    initialNames.length >= 3 ? initialNames : ["", "", ""],
  );
  const [error, setError] = useState<string | null>(null);

  const updateName = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
    setError(null);
  };

  const addPlayer = () => {
    if (names.length >= 20) return;
    setNames((prev) => [...prev, ""]);
  };

  const removePlayer = (index: number) => {
    if (names.length <= 3) return;
    setNames((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const submit = () => {
    const result = validatePlayerNames(names);
    if (!result.ok) {
      setError(result.error ?? "Erreur de validation");
      return;
    }
    onConfirm(names.map((n) => n.trim()));
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Joueurs</h2>
        <p className="text-sm text-white-muted">
          Entre les pseudos — entre 3 et 20 joueurs.
        </p>
      </div>

      <ul className="space-y-2">
        {names.map((name, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="size-9 flex items-center justify-center rounded-lg border border-border bg-secondary text-gold font-mono text-sm shrink-0">
              {index + 1}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => updateName(index, e.target.value)}
              placeholder={`Joueur ${index + 1}`}
              maxLength={20}
              className="flex-1 h-11 px-3 rounded-lg bg-input border border-border focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 text-foreground placeholder:text-white-subtle"
            />
            <button
              type="button"
              onClick={() => removePlayer(index)}
              disabled={names.length <= 3}
              aria-label={`Retirer joueur ${index + 1}`}
              className="size-9 flex items-center justify-center rounded-lg border border-border text-white-muted hover:text-destructive hover:border-destructive/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M5 12h14" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addPlayer}
        disabled={names.length >= 20}
        className="w-full h-11 rounded-lg border-2 border-dashed border-border hover:border-gold/60 hover:text-gold text-white-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="M5 12h14M12 5v14" />
        </svg>
        Ajouter un joueur ({names.length}/20)
      </button>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        className="w-full h-12 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-colors evo-glow"
      >
        Continuer
      </button>
    </div>
  );
}
