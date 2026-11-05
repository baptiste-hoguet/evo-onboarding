import type { Metadata } from "next";
import Link from "next/link";
import { findDeletion } from "@/lib/instagram/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suppression des données Instagram · EVO Incubator",
  robots: { index: false, follow: false },
};

const fmt = (d: Date) =>
  d.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

// Page de suivi d'une demande de suppression reçue de Meta (lien renvoyé à Meta avec le code de confirmation).
export default async function SuppressionPage({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const { code: raw } = await searchParams;
  const code = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const request = code ? await findDeletion(code).catch(() => null) : null;

  return (
    <main className="wrap">
      <div>
        <div className="eyebrow"><em>EVO</em><span>·</span><span>Données personnelles</span></div>
        <h1>Suppression des données <i>Instagram</i>.</h1>
      </div>

      <section>
        {request ? (
          <>
            <h2>Demande traitée</h2>
            <p className="lede">
              Code de confirmation : <b>{request.id}</b>. Reçue le {fmt(request.createdAt)}.
            </p>
            <p className="lede">
              Les chiffres Instagram liés à ce compte ont été supprimés de nos bases, y compris dans les diagnostics enregistrés.
              Nous ne conservions aucun accès au compte : aucun jeton n&apos;est stocké.
            </p>
          </>
        ) : (
          <>
            <h2>Code inconnu</h2>
            <p className="lede">
              Nous ne retrouvons pas ce code de confirmation. Vérifiez le lien reçu, ou écrivez-nous à hogbat08@gmail.com.
            </p>
          </>
        )}
      </section>

      <p className="lede">
        <Link href="/confidentialite">Politique de confidentialité</Link>
      </p>
    </main>
  );
}
