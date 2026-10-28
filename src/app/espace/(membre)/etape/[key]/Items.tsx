"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import type { ItemState } from "@/lib/journey";

const STATUS: Record<string, string> = { a_faire: "À faire", deposee: "Déposée", en_revue: "En revue", validee: "Validée", a_corriger: "À corriger" };
// Heure de Paris fixe : même rendu côté serveur (UTC) et navigateur
const when = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }) + " à " + new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const mb = (n: number) => n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " Ko" : (n / 1048576).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " Mo";

async function setDone(id: string, done: boolean) {
  const res = await fetch(`/api/espace/items/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done }) });
  if (!res.ok) throw new Error();
  return (await res.json()).doneAt as string | null;
}

// Case déclarative, enregistrée et horodatée dès le clic
export function CheckItem({ id, label, doneAt }: { id: string; label: string; doneAt: string | null }) {
  const router = useRouter();
  const [at, setAt] = useState(doneAt);
  const [err, setErr] = useState(false);
  async function toggle() {
    const prev = at, next = !at;
    setAt(next ? new Date().toISOString() : null); setErr(false);
    try { setAt(await setDone(id, next)); router.refresh(); } catch { setAt(prev); setErr(true); }
  }
  return (
    <div>
      <button type="button" className="check" role="checkbox" aria-checked={!!at} onClick={toggle}>
        <span className="box" aria-hidden="true">{at ? "✓" : ""}</span>
        <span className="txt"><span>{label}</span>{at && <small>Coché le {when(at)}</small>}</span>
      </button>
      {err && <p className="err" role="alert">Pas enregistré : vérifie ta connexion et réessaie.</p>}
    </div>
  );
}

// Carte d'une fiche : modèle, dépôt PDF, statut, commentaire du coach, historique des versions
export function DeliverableCard({ item, accountId, index }: { item: ItemState; accountId: string; index: number }) {
  const router = useRouter();
  const d = item.deliverable!;
  const maxMB = Number(item.config.maxMB) || 10;
  const [busy, setBusy] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canUpload = !item.locked && d.status !== "validee";

  async function send(file: File | undefined) {
    if (!file) return;
    setErr(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setErr("Seuls les fichiers PDF sont acceptés."); return; }
    if (file.size > maxMB * 1048576) { setErr(`Ce fichier dépasse ${maxMB} Mo. Compresse-le puis réessaie.`); return; }
    setBusy(0);
    try {
      const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "-").slice(-80) || "fiche.pdf";
      const blob = await upload(`livrables/${accountId}/${item.id}/${safe}`, file, {
        access: "private",
        handleUploadUrl: "/api/espace/upload",
        clientPayload: item.id,
        contentType: "application/pdf",
        multipart: file.size > 4 * 1048576,
        onUploadProgress: ({ percentage }) => setBusy(Math.round(percentage)),
      });
      const res = await fetch(`/api/espace/deliverables/${item.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname: blob.pathname, fileName: file.name }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error && e.message ? e.message : "L'envoi a échoué. Vérifie ta connexion et réessaie.");
    } finally {
      setBusy(null);
    }
  }

  const templateUrl = typeof item.config.templateUrl === "string" ? item.config.templateUrl : "";
  return (
    <article className={`card s-${d.status}`} aria-labelledby={`f-${item.id}`}>
      <div className="card-head">
        <span className="card-num" aria-label={`Fiche ${index}`}>{index}</span>
        <div>
          <span className="chip">{String(item.config.category || "")}</span>
          <h3 id={`f-${item.id}`}>{item.label}</h3>
        </div>
        <span className={`pill s-${d.status}`}><span className="dot" />{STATUS[d.status]}</span>
      </div>
      {typeof item.config.purpose === "string" && <p className="purpose"><strong>À quoi ça sert :</strong> {item.config.purpose}</p>}
      {d.status === "a_corriger" && d.comment && <div className="comment"><b>Commentaire de ton coach</b>{d.comment}</div>}
      {d.status === "validee" && d.comment && <div className="comment" style={{ borderColor: "var(--ok)", background: "var(--ok-soft)" }}><b style={{ color: "var(--ok)" }}>Mot de ton coach</b>{d.comment}</div>}
      <div className="card-links">
        {templateUrl ? <a href={templateUrl} target="_blank" rel="noopener noreferrer">Ouvrir le modèle dans Skool ↗</a> : <span className="muted">Modèle bientôt disponible</span>}
      </div>
      {canUpload && (
        <label className={`drop${over ? " over" : ""}${busy !== null ? " busy" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); send(e.dataTransfer.files[0]); }}>
          <input type="file" accept="application/pdf,.pdf" aria-label={`Déposer le PDF de ${item.label}`} disabled={busy !== null}
            onChange={(e) => { send(e.target.files?.[0]); e.target.value = ""; }} />
          {busy !== null
            ? <span>Envoi en cours… {busy} %</span>
            : <><span>{d.versions.length ? "Déposer une nouvelle version" : "Glisse ton PDF ici"} ou <u>choisis un fichier</u></span><small>PDF uniquement · {maxMB} Mo max</small></>}
        </label>
      )}
      {err && <p className="err" role="alert">{err}</p>}
      {d.versions.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          <span className="chip">Historique des versions</span>
          <ul className="versions">
            {d.versions.map((v) => (
              <li key={v.id}><a href={`/api/espace/files/${v.id}`} target="_blank" rel="noopener noreferrer">v{v.number} · {v.fileName}</a><span>{mb(v.size)} · {when(v.uploadedAt)}</span></li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

// Réservation du call via Calendly intégré ; l'événement « réservé » est enregistré automatiquement
export function BookingItem({ id, label, url, host, doneAt }: { id: string; label: string; url: string; host: string; doneAt: string | null }) {
  const router = useRouter();
  const [at, setAt] = useState(doneAt);

  let src: string | null = null;
  try {
    const u = new URL(url);
    u.searchParams.set("embed_domain", host);
    u.searchParams.set("embed_type", "Inline");
    u.searchParams.set("hide_gdpr_banner", "1");
    src = u.toString();
  } catch {}

  useEffect(() => {
    if (!url) return;
    const onMsg = async (e: MessageEvent) => {
      let fromCalendly = false;
      try { fromCalendly = /(^|\.)calendly\.com$/.test(new URL(e.origin).hostname); } catch {}
      if (fromCalendly && e.data?.event === "calendly.event_scheduled") {
        try { setAt(await setDone(id, true)); router.refresh(); } catch {}
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [url, id, router]);

  if (at) return <div className="locked-box" style={{ borderStyle: "solid", borderColor: "rgba(127,200,169,.35)", color: "var(--ok)" }}><span aria-hidden="true">✓</span><div><strong>Call réservé</strong><p style={{ margin: "4px 0 0", color: "var(--fg-2)" }}>Tu as reçu la confirmation par email (réservé le {when(at)}). À bientôt !</p></div></div>;
  if (!src) return <div className="locked-box"><div><strong>{label}</strong><p style={{ margin: "4px 0 0" }}>Le calendrier de réservation arrive très bientôt.</p></div></div>;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <strong>{label}</strong>
      {<iframe className="calendly" src={src} title="Réserver mon call de validation" loading="lazy" />}
    </div>
  );
}
