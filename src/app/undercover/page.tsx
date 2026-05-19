import Link from "next/link";
import { RulesAccordion } from "@/components/undercover/RulesAccordion";

export default function UndercoverHome() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col px-5 pt-16 pb-8 max-w-md mx-auto w-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-gold mb-3">
              Jeu de société
            </div>
            <h1 className="text-6xl font-bold tracking-tight mb-3">
              UNDER
              <span className="text-gold">COVER</span>
            </h1>
            <p className="text-sm text-white-muted max-w-xs mx-auto leading-relaxed">
              Démasque les infiltrés. Décris ton mot sans le dire. Vote, élimine,
              survis.
            </p>
          </div>

          <Link
            href="/undercover/game"
            className="w-full max-w-xs h-14 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-colors evo-glow flex items-center justify-center gap-2"
          >
            Nouvelle partie
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
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="mt-10">
          <RulesAccordion />
        </div>

        <p className="text-center text-[10px] text-white-subtle mt-8 uppercase tracking-widest">
          3 à 20 joueurs · Local · Passe l&apos;appareil
        </p>
      </div>
    </main>
  );
}
