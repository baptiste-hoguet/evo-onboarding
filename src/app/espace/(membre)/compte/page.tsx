import { getClientAccount } from "@/lib/client-auth";
import { PasswordForm, LogoutButton } from "./AccountForms";

export default async function Compte() {
  const account = (await getClientAccount())!;
  return (
    <>
      <div>
        <div className="eyebrow"><em>Mon compte</em></div>
        <h1>{[account.firstName, account.lastName].filter(Boolean).join(" ") || "Mon compte"}</h1>
        <p className="lede">Identifiant : {account.email}</p>
      </div>
      <section className="block" aria-labelledby="pw">
        <div className="block-head"><h2 id="pw">Changer mon mot de passe</h2><p className="muted" style={{ margin: 0 }}>Tes autres appareils seront déconnectés.</p></div>
        <PasswordForm />
      </section>
      <section className="block"><div><LogoutButton /></div></section>
    </>
  );
}
