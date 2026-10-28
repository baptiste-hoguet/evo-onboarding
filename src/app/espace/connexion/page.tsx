import Link from "next/link";
import { redirect } from "next/navigation";
import { getClientAccount } from "@/lib/client-auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function Connexion() {
  if (await getClientAccount()) redirect("/espace");
  return (
    <main className="center">
      <div className="narrow">
        <div>
          <div className="eyebrow"><em>EVO</em><span>·</span><span>Mon espace</span></div>
          <h1>Content de te <i>revoir</i>.</h1>
          <p className="lede">Connecte-toi avec l&apos;email de ton questionnaire et le mot de passe reçu par email.</p>
        </div>
        <LoginForm />
        <p className="muted small">
          EVO Incubator · Hoguet Capital · <Link href="/mentions-legales">Mentions légales</Link>
        </p>
      </div>
    </main>
  );
}
