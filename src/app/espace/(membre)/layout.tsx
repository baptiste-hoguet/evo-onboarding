import Link from "next/link";
import { redirect } from "next/navigation";
import { getClientAccount } from "@/lib/client-auth";

export const dynamic = "force-dynamic";

export default async function MembreLayout({ children }: { children: React.ReactNode }) {
  const account = await getClientAccount();
  if (!account) redirect("/espace/connexion");

  return (
    <>
      <header className="top">
        <div className="top-in">
          <Link href="/espace" className="brand"><b>EVO</b><span>Mon espace</span></Link>
          <nav className="top-nav" aria-label="Navigation">
            <Link href="/espace">Accueil</Link>
            <Link href="/espace/compte">Mon compte</Link>
          </nav>
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
