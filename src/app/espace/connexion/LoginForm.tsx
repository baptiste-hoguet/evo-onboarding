"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError("");
    const res = await fetch("/api/espace/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: f.get("email"), password: f.get("password") }),
    }).catch(() => null);
    if (res?.ok) { router.replace("/espace"); router.refresh(); return; }
    const data = await res?.json().catch(() => ({}));
    setError(data?.error || "Connexion impossible. Vérifie ta connexion internet.");
    setBusy(false);
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn btn-gold" disabled={busy}>{busy ? "Connexion…" : "Entrer dans mon espace"}</button>
      <p className="muted small">Mot de passe perdu ? Écris à ton coach EVO, il te renverra un accès.</p>
    </form>
  );
}
