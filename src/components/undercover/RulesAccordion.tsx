"use client";

import { useState } from "react";

export function RulesAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="evo-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold uppercase tracking-wider text-gold">
          Les règles
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-4 text-gold transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 space-y-4 text-sm text-white-muted leading-relaxed border-t border-border">
          <section>
            <h3 className="text-foreground font-semibold mb-1">Les rôles</h3>
            <ul className="space-y-1 list-disc pl-5">
              <li>
                <span className="text-foreground">Civils</span> — reçoivent le
                même mot.
              </li>
              <li>
                <span className="text-foreground">Undercover(s)</span> —
                reçoivent un mot proche mais différent.
              </li>
              <li>
                <span className="text-foreground">Mr. White</span> — ne reçoit
                aucun mot et doit bluffer.
              </li>
            </ul>
          </section>
          <section>
            <h3 className="text-foreground font-semibold mb-1">Déroulement</h3>
            <ol className="space-y-1 list-decimal pl-5">
              <li>
                Chacun consulte son mot en secret en passant l&apos;appareil.
              </li>
              <li>
                À tour de rôle, chacun donne un mot ou une phrase décrivant son
                mot (sans le dire).
              </li>
              <li>Tous votent pour éliminer un joueur suspect.</li>
              <li>
                Si Mr. White est éliminé, il a une dernière chance de deviner
                le mot des civils.
              </li>
            </ol>
          </section>
          <section>
            <h3 className="text-foreground font-semibold mb-1">Victoire</h3>
            <ul className="space-y-1 list-disc pl-5">
              <li>
                <span className="text-foreground">Civils</span> : tous les
                infiltrés éliminés.
              </li>
              <li>
                <span className="text-foreground">Undercovers</span> : à
                égalité numérique avec les civils.
              </li>
              <li>
                <span className="text-foreground">Mr. White</span> : survit en
                final 2 OU devine le mot après élimination.
              </li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
