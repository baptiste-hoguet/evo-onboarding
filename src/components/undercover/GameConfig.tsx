"use client";

import { useState } from "react";
import { maxUndercovers } from "@/lib/undercover/game-logic";
import { pickRandomWordPair } from "@/lib/undercover/words";
import type { WordPair } from "@/lib/undercover/types";

type GameConfigProps = {
  playerCount: number;
  initialNumUndercovers: number;
  initialHasMrWhite: boolean;
  initialWordPair: WordPair | null;
  onBack: () => void;
  onConfirm: (config: {
    numUndercovers: number;
    hasMrWhite: boolean;
    wordPair: WordPair;
  }) => void;
};

type WordMode = "random" | "manual";

export function GameConfig({
  playerCount,
  initialNumUndercovers,
  initialHasMrWhite,
  initialWordPair,
  onBack,
  onConfirm,
}: GameConfigProps) {
  const cap = maxUndercovers(playerCount);
  const [numUndercovers, setNumUndercovers] = useState(
    Math.min(initialNumUndercovers, cap),
  );
  const [hasMrWhite, setHasMrWhite] = useState(initialHasMrWhite);
  const [wordMode, setWordMode] = useState<WordMode>("random");
  const [randomPair, setRandomPair] = useState<WordPair>(
    initialWordPair ?? pickRandomWordPair(),
  );
  const [manualCivilian, setManualCivilian] = useState("");
  const [manualUndercover, setManualUndercover] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mrWhiteCount = hasMrWhite ? 1 : 0;
  const civilianCount = playerCount - numUndercovers - mrWhiteCount;

  const submit = () => {
    let pair: WordPair;
    if (wordMode === "manual") {
      const c = manualCivilian.trim();
      const u = manualUndercover.trim();
      if (!c || !u) {
        setError("Saisis les deux mots.");
        return;
      }
      if (c.toLocaleLowerCase("fr-FR") === u.toLocaleLowerCase("fr-FR")) {
        setError("Les deux mots doivent être différents.");
        return;
      }
      pair = { civilian: c, undercover: u };
    } else {
      pair = randomPair;
    }
    if (civilianCount < 1) {
      setError("Trop d'infiltrés. Réduis le nombre d'undercovers.");
      return;
    }
    onConfirm({ numUndercovers, hasMrWhite, wordPair: pair });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Configuration
        </h2>
        <p className="text-sm text-white-muted">
          Règle la composition de la partie.
        </p>
      </div>

      <div className="evo-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Undercovers</div>
            <div className="text-xs text-white-muted">
              Maximum {cap} pour {playerCount} joueurs
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNumUndercovers((n) => Math.max(1, n - 1))}
              aria-label="Moins d'undercover"
              className="size-9 rounded-lg border border-border hover:border-gold hover:text-gold text-white-muted transition-colors"
            >
              −
            </button>
            <span className="text-2xl font-bold text-gold w-8 text-center tabular-nums">
              {numUndercovers}
            </span>
            <button
              type="button"
              onClick={() => setNumUndercovers((n) => Math.min(cap, n + 1))}
              aria-label="Plus d'undercover"
              className="size-9 rounded-lg border border-border hover:border-gold hover:text-gold text-white-muted transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <div className="text-sm font-semibold">Mr. White</div>
            <div className="text-xs text-white-muted">
              Bluffeur sans aucun mot
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hasMrWhite}
            onClick={() => setHasMrWhite((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition-colors ${hasMrWhite ? "bg-gold" : "bg-secondary border border-border"}`}
          >
            <span
              className={`absolute top-0.5 size-6 rounded-full bg-white transition-transform ${hasMrWhite ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-around gap-2 text-center">
          <div>
            <div className="text-xl font-bold text-foreground tabular-nums">
              {civilianCount}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white-muted">
              Civils
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-gold tabular-nums">
              {numUndercovers}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white-muted">
              Undercover
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground tabular-nums">
              {mrWhiteCount}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white-muted">
              Mr. White
            </div>
          </div>
        </div>
      </div>

      <div className="evo-card p-5 space-y-4">
        <div>
          <div className="text-sm font-semibold mb-3">Mots à deviner</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWordMode("random")}
              className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${wordMode === "random" ? "border-gold bg-gold/10 text-gold" : "border-border bg-secondary text-white-muted hover:text-foreground"}`}
            >
              Aléatoire
            </button>
            <button
              type="button"
              onClick={() => setWordMode("manual")}
              className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${wordMode === "manual" ? "border-gold bg-gold/10 text-gold" : "border-border bg-secondary text-white-muted hover:text-foreground"}`}
            >
              Manuel
            </button>
          </div>
        </div>

        {wordMode === "random" && (
          <div>
            <div className="rounded-lg bg-secondary border border-border p-4 text-center">
              <div className="text-xs text-white-muted mb-2 uppercase tracking-wider">
                Paire sélectionnée
              </div>
              <div className="text-lg font-semibold">
                <span className="text-foreground">{randomPair.civilian}</span>
                <span className="text-white-subtle mx-2">/</span>
                <span className="text-foreground">{randomPair.undercover}</span>
              </div>
              <div className="text-[10px] text-white-subtle mt-1">
                Tu ne sauras pas lequel est le mot civil
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRandomPair(pickRandomWordPair())}
              className="mt-2 w-full h-9 rounded-lg text-sm text-gold hover:bg-gold/10 transition-colors"
            >
              Tirer une autre paire
            </button>
          </div>
        )}

        {wordMode === "manual" && (
          <div className="space-y-2">
            <input
              type="text"
              value={manualCivilian}
              onChange={(e) => {
                setManualCivilian(e.target.value);
                setError(null);
              }}
              placeholder="Mot des civils"
              className="w-full h-11 px-3 rounded-lg bg-input border border-border focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 text-foreground placeholder:text-white-subtle"
            />
            <input
              type="text"
              value={manualUndercover}
              onChange={(e) => {
                setManualUndercover(e.target.value);
                setError(null);
              }}
              placeholder="Mot des undercovers"
              className="w-full h-11 px-3 rounded-lg bg-input border border-border focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 text-foreground placeholder:text-white-subtle"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-12 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors font-medium"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={submit}
          className="flex-1 h-12 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-colors evo-glow"
        >
          Lancer
        </button>
      </div>
    </div>
  );
}
