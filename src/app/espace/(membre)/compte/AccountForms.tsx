"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PasswordForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget, f = new FormData(form);
    if (f.get("next") !== f.get("confirm")) { setMsg({ ok: false, text: "Les deux nouveaux mots de passe ne correspondent pas." }); return; }
    setBusy(true); setMsg(null);
    const res = await fetch("/api/espace/password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: f.get("current"), next: f.get("next") }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok) { form.reset(); setMsg({ ok: true, text: "Mot de passe modifié." }); }
    else setMsg({ ok: false, text: data?.error || "La modification a échoué." });
  }

  return (
    <form className="form" onSubmit={onSubmit} style={{ maxWidth: 420 }}>
      <div className="field"><label htmlFor="current">Mot de passe actuel</label><input id="current" name="current" type="password" autoComplete="current-password" required /></div>
      <div className="field"><label htmlFor="next">Nouveau mot de passe (8 caractères minimum)</label><input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required /></div>
      <div className="field"><label htmlFor="confirm">Confirme le nouveau mot de passe</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required /></div>
      {msg && <p className={msg.ok ? "ok-msg" : "err"} role="status">{msg.text}</p>}
      <div><button className="btn btn-gold" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button></div>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button className="btn btn-ghost" onClick={async () => { await fetch("/api/espace/logout", { method: "POST" }); router.replace("/espace/connexion"); router.refresh(); }}>
      Me déconnecter
    </button>
  );
}
