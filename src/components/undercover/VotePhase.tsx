"use client";

import { useMemo, useState } from "react";
import type { Player } from "@/lib/undercover/types";
import { ConfirmDialog } from "./ConfirmDialog";

type VotePhaseProps = {
  players: Player[];
  voterPool: string[];
  voterIndex: number;
  candidatesFilter: string[] | null;
  isTiebreaker: boolean;
  onCastVote: (voterId: string, targetId: string) => void;
};

export function VotePhase({
  players,
  voterPool,
  voterIndex,
  candidatesFilter,
  isTiebreaker,
  onCastVote,
}: VotePhaseProps) {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const playerById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );
  const currentVoterId = voterPool[voterIndex];
  const currentVoter = playerById.get(currentVoterId);

  const candidates = useMemo(() => {
    const alivePlayers = players.filter((p) => p.alive);
    const filterSet = candidatesFilter ? new Set(candidatesFilter) : null;
    return alivePlayers.filter((p) => {
      if (filterSet && !filterSet.has(p.id)) return false;
      return true;
    });
  }, [players, candidatesFilter]);

  if (!currentVoter) return null;

  if (!revealed) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[60vh] px-4">
        <div className="text-xs uppercase tracking-widest text-white-muted mb-3">
          {isTiebreaker ? "Revote — Égalité" : "Vote"} · {voterIndex + 1}/
          {voterPool.length}
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
        <p className="text-3xl font-bold text-gold mb-8">{currentVoter.name}</p>
        <button
          type="button"
          onClick={() => {
            setRevealed(true);
            setSelected(null);
          }}
          className="w-full max-w-xs h-14 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-colors evo-glow"
        >
          Voter en secret
        </button>
      </div>
    );
  }

  const confirm = () => {
    if (!selected) return;
    setConfirming(false);
    onCastVote(currentVoterId, selected);
    setRevealed(false);
    setSelected(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-xs uppercase tracking-widest text-white-muted mb-1">
          {isTiebreaker ? "Revote — Égalité" : "Vote"} · {voterIndex + 1}/
          {voterPool.length}
        </div>
        <h2 className="text-xl font-bold">
          {currentVoter.name}, qui veux-tu éliminer ?
        </h2>
      </div>

      <ul className="grid grid-cols-2 gap-2">
        {candidates.map((c) => {
          const isSelf = c.id === currentVoterId;
          const isSelected = selected === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => !isSelf && setSelected(c.id)}
                disabled={isSelf}
                className={`w-full h-20 rounded-xl border-2 transition-all flex items-center justify-center px-3 text-center font-medium ${
                  isSelected
                    ? "border-gold bg-gold/15 text-gold"
                    : isSelf
                      ? "border-border bg-secondary/30 text-white-subtle cursor-not-allowed"
                      : "border-border bg-secondary text-foreground hover:border-gold/60"
                }`}
              >
                <span className="line-clamp-2 break-words">
                  {c.name}
                  {isSelf && (
                    <span className="block text-[10px] mt-0.5 uppercase">
                      Toi
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        disabled={!selected}
        onClick={() => setConfirming(true)}
        className="w-full h-12 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Valider mon vote
      </button>

      <ConfirmDialog
        open={confirming}
        title={`Voter contre ${selected ? playerById.get(selected)?.name : ""} ?`}
        description="Ton vote sera enregistré et l'appareil passera au joueur suivant."
        confirmLabel="Voter"
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
