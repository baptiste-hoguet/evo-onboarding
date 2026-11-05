"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { DiagnosticResult, InstagramSummary } from "@/lib/diagnostic/types";
import {
  ACTIVITIES,
  CLIENTS_WITH_RESULT,
  CONSENT_LABELS,
  MAX_NUMBER,
  NUMERIC_KEYS,
  REVENUE_RANGES,
  isValidEmail,
  isValidInstagram,
  isValidPhone,
  normalizeInstagram,
  rangeOfAmount,
  type DiagnosticPayload,
  type NumericKey,
} from "@/lib/diagnostic/form";
import { DiagnosticFooter, DiagnosticTop } from "./Chrome";
import { ResultView } from "./ResultView";

type TextKey = "firstName" | "email" | "instagram" | "phone" | "goalExact";
type ChoiceKey = "activity" | "revenueRange" | "goalRange" | "clientsWithResult" | "founderSaturated";
type FormState = Record<TextKey | ChoiceKey | NumericKey, string> & { consentCgu: boolean; consentRecontact: boolean };
type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  firstName: "", email: "", instagram: "", phone: "", goalExact: "",
  activity: "", revenueRange: "", goalRange: "", clientsWithResult: "", founderSaturated: "",
  ...(Object.fromEntries(NUMERIC_KEYS.map((k) => [k, ""])) as Record<NumericKey, string>),
  consentCgu: false, consentRecontact: false,
};

const STEPS = [
  { title: "Toi", sub: "Pour situer ton activité et ton objectif." },
  { title: "Ton offre", sub: "Ce que tu vends, et ce que ça donne chez tes clients." },
  { title: "Tes 7 derniers jours", sub: "Contenu et messages. Compte les 7 derniers jours réels, pas une semaine idéale." },
  { title: "Tes 7 derniers jours", sub: "Calls et ventes, sur la même période." },
  { title: "Dernière étape", sub: "Deux cases à lire, et ton diagnostic s'affiche." },
];
const TOTAL = STEPS.length;

const APPROX = "Approximatif, c'est ok.";

type NumField = { key: NumericKey; label: string; hint: string; suffix?: string };
const STEP_NUMBERS: Record<number, NumField[]> = {
  2: [
    { key: "offerPrice", label: "Prix de ton offre principale", hint: `Le prix affiché aujourd'hui. ${APPROX}`, suffix: "€" },
    { key: "salesAtCurrentPrice", label: "Ventes à ce prix depuis le lancement", hint: `Combien de clients ont payé ce prix-là. ${APPROX}` },
  ],
  3: [
    { key: "reels", label: "Reels publiés", hint: APPROX },
    { key: "stories", label: "Stories publiées", hint: APPROX },
    { key: "dmsSent", label: "DM envoyés", hint: `Nouveaux messages et relances. ${APPROX}` },
    { key: "newConversations", label: "Nouvelles conversations", hint: `Échanges qui ont démarré cette semaine. ${APPROX}` },
    { key: "replies", label: "Réponses obtenues", hint: `Messages auxquels on t'a répondu. ${APPROX}` },
  ],
  4: [
    { key: "callsBooked", label: "Calls bookés", hint: APPROX },
    { key: "callsHeld", label: "Calls tenus", hint: `Le prospect s'est présenté. ${APPROX}` },
    { key: "offTargetCalls", label: "Dont hors cible", hint: `Parmi les calls tenus, ceux qui n'étaient pas ta cible. ${APPROX}` },
    { key: "sales", label: "Ventes", hint: APPROX },
    { key: "cashCollected", label: "Cash encaissé", hint: `L'argent réellement reçu, pas signé. ${APPROX}`, suffix: "€" },
  ],
};

const RANGE_OPTIONS = REVENUE_RANGES.map((r) => ({ value: r.value, label: r.label }));
const YES_NO = [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }];

function toNumber(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function validateStep(step: number, f: FormState): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!f.firstName.trim()) e.firstName = "Ton prénom, pour personnaliser le diagnostic.";
    if (!isValidEmail(f.email.trim().toLowerCase())) e.email = "Vérifie ton email.";
    if (f.instagram.trim() && !isValidInstagram(normalizeInstagram(f.instagram))) e.instagram = "Lettres, chiffres, points et _ uniquement.";
    if (!f.activity) e.activity = "Choisis ton activité.";
    if (!f.revenueRange) e.revenueRange = "Choisis une tranche.";
    if (!f.goalRange) e.goalRange = "Choisis une tranche.";
    if (f.goalExact) {
      const n = toNumber(f.goalExact);
      if (n === null || n > MAX_NUMBER) e.goalExact = "Maximum 100 000 €.";
    }
  }
  if (step === 2 && !f.clientsWithResult) e.clientsWithResult = "Choisis une réponse.";
  if (step === 4 && !f.founderSaturated) e.founderSaturated = "Oui ou non ?";
  for (const field of STEP_NUMBERS[step] ?? []) {
    const n = toNumber(f[field.key]);
    if (n === null) e[field.key] = "Mets un chiffre, même approximatif (0 si aucun).";
    else if (n > MAX_NUMBER) e[field.key] = "Maximum 100 000.";
  }
  if (step === 4 && !e.offTargetCalls && !e.callsHeld && Number(f.offTargetCalls) > Number(f.callsHeld)) {
    e.offTargetCalls = "Pas plus que tes calls tenus.";
  }
  if (step === 5) {
    if (f.phone.trim() && !isValidPhone(f.phone.trim())) e.phone = "Vérifie ton numéro.";
    if (!f.consentCgu) e.consentCgu = "Cette case est nécessaire pour afficher ton diagnostic.";
  }
  return e;
}

type Done = { id: string; result: DiagnosticResult; firstName: string; email: string; instagram: InstagramSummary | null };

// Connexion Instagram : le formulaire est mis de côté le temps de l'aller-retour sur Instagram (onglet courant uniquement).
const DRAFT_KEY = "evo-diag-draft";
type Draft = { form: Partial<FormState>; step: number; startedAt: number; search: string };
type IgSnapshot = { id: string; data: InstagramSummary };

const IG_NOTICES: Record<string, string> = {
  denied: "Connexion Instagram annulée. Pas de souci : remplis tes chiffres à la main.",
  failed: "On n'a pas pu lire tes chiffres Instagram. Remplis-les à la main, ça prend 30 secondes.",
};

/** Retire les paramètres du retour Instagram, garde le reste (UTM). */
function cleanSearch(search: string): string {
  const p = new URLSearchParams(search);
  p.delete("ig");
  p.delete("ig_error");
  const s = p.toString();
  return s ? `?${s}` : "";
}

function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    sessionStorage.removeItem(DRAFT_KEY);
    const d = raw ? (JSON.parse(raw) as Partial<Draft>) : null;
    if (!d || typeof d !== "object" || !d.form || typeof d.form !== "object") return null;
    const form: Partial<FormState> = {};
    for (const [k, v] of Object.entries(d.form)) {
      if (k in EMPTY && typeof v === typeof EMPTY[k as keyof FormState]) (form as Record<string, unknown>)[k] = v;
    }
    const step = typeof d.step === "number" && d.step >= 1 && d.step <= TOTAL ? Math.floor(d.step) : 3;
    const startedAt = typeof d.startedAt === "number" && d.startedAt > 0 && d.startedAt <= Date.now() ? d.startedAt : Date.now();
    return { form, step, startedAt, search: typeof d.search === "string" ? d.search : "" };
  } catch {
    return null;
  }
}

async function fetchSnapshot(id: string): Promise<IgSnapshot | null> {
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return null;
  const res = await fetch(`/api/instagram/snapshot/${encodeURIComponent(id)}`, { cache: "no-store" }).catch(() => null);
  const data = await res?.json().catch(() => null);
  return res?.ok && data?.instagram ? { id: String(data.id), data: data.instagram as InstagramSummary } : null;
}

const nf = (n: number) => n.toLocaleString("fr-FR");

// Bêta testeurs (avant validation de l'app par Meta) : ?beta=instagram, mémorisé pour l'onglet.
const BETA_KEY = "evo-diag-ig-beta";
const noopSubscribe = () => () => {};
function readBeta(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("beta") === "instagram") return true;
    return sessionStorage.getItem(BETA_KEY) === "1";
  } catch {
    return false;
  }
}

export function DiagnosticForm({ instagramEnabled = false, instagramPublic = false }: { instagramEnabled?: boolean; instagramPublic?: boolean }) {
  const igBeta = useSyncExternalStore(noopSubscribe, readBeta, () => false);
  const showInstagram = instagramEnabled && (instagramPublic || igBeta);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [tried, setTried] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [ig, setIg] = useState<IgSnapshot | null>(null);
  const [igNotice, setIgNotice] = useState("");
  const [igBusy, setIgBusy] = useState(false);
  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!igBeta) return;
    try {
      sessionStorage.setItem(BETA_KEY, "1");
    } catch {
      // stockage indisponible : le paramètre d'URL reste conservé par le retour Instagram.
    }
  }, [igBeta]);

  // Retour de la connexion Instagram (?ig=<snapshot> ou ?ig_error=…) : on restaure le formulaire puis on pré-remplit.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const igId = params.get("ig");
    const igError = params.get("ig_error");
    if (!igId && !igError) return;
    const draft = readDraft();
    window.history.replaceState(null, "", `/diagnostic${cleanSearch(draft?.search ?? window.location.search)}`);
    if (draft) startedAt.current = draft.startedAt;
    void (igId ? fetchSnapshot(igId) : Promise.resolve(null)).then((snap) => {
      if (draft) {
        setForm((f) => ({ ...f, ...draft.form }));
        setStep(draft.step);
      }
      if (snap) {
        setIg(snap);
        setForm((f) => ({ ...f, reels: String(Math.min(snap.data.reels7d, MAX_NUMBER)) }));
      } else {
        setIgNotice(IG_NOTICES[igError === "denied" ? "denied" : "failed"]);
      }
    });
  }, []);

  // Retour arrière depuis Instagram (page restaurée du cache) : le bouton redevient cliquable.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIgBusy(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  function connectInstagram() {
    setIgBusy(true);
    try {
      const draft: Draft = { form, step, startedAt: startedAt.current, search: window.location.search };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // stockage indisponible : on repartira de l'étape 0, les chiffres Instagram resteront pré-remplis.
    }
    window.location.assign(igBeta ? "/api/instagram/start?beta=instagram" : "/api/instagram/start");
  }

  useEffect(() => {
    if (step === 0) return;
    window.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [step, done]);

  const errors = step >= 1 && step <= TOTAL ? validateStep(step, form) : {};
  const shown: Errors = tried[step] ? errors : {};

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setGoalExact(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 7);
    setForm((f) => ({ ...f, goalExact: digits, goalRange: digits && Number(digits) > 0 ? rangeOfAmount(Number(digits)) : f.goalRange }));
  }

  function next() {
    if (Object.keys(errors).length) {
      setTried((t) => ({ ...t, [step]: true }));
      const first = Object.keys(errors)[0];
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    if (step < TOTAL) setStep(step + 1);
    else void submit();
  }

  async function submit() {
    setBusy(true);
    setSubmitError("");
    const utm = new URLSearchParams(window.location.search);
    const goalExact = toNumber(form.goalExact);
    const payload: DiagnosticPayload = {
      firstName: form.firstName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      instagram: form.instagram.trim() ? normalizeInstagram(form.instagram) : undefined,
      activity: form.activity as DiagnosticPayload["activity"],
      revenueRange: form.revenueRange as DiagnosticPayload["revenueRange"],
      goalRange: form.goalRange as DiagnosticPayload["goalRange"],
      goalExact: goalExact && goalExact > 0 ? goalExact : null,
      clientsWithResult: form.clientsWithResult as DiagnosticPayload["clientsWithResult"],
      founderSaturated: form.founderSaturated === "oui",
      consentCgu: form.consentCgu,
      consentRecontact: form.consentRecontact,
      utmSource: utm.get("utm_source") ?? undefined,
      utmMedium: utm.get("utm_medium") ?? undefined,
      utmCampaign: utm.get("utm_campaign") ?? undefined,
      website: honeypot.current?.value ?? "",
      elapsedMs: Date.now() - startedAt.current,
      numbers: Object.fromEntries(NUMERIC_KEYS.map((k) => [k, Number(form[k])])) as Record<NumericKey, number>,
      instagramSnapshotId: ig?.id,
    };
    const res = await fetch("/api/diagnostic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (res?.ok && data?.id && data?.result) {
      setDone({ id: data.id, result: data.result, firstName: payload.firstName, email: payload.email, instagram: ig?.data ?? null });
      window.history.replaceState(null, "", `/diagnostic/${data.id}`);
      setBusy(false);
      return;
    }
    setSubmitError(data?.error || "Envoi impossible pour le moment. Vérifie ta connexion et réessaie.");
    setBusy(false);
  }

  if (done) {
    return (
      <>
        <DiagnosticTop />
        <main className="dg">
          <ResultView result={done.result} leadId={done.id} firstName={done.firstName} email={done.email} instagram={done.instagram} />
          <DiagnosticFooter />
        </main>
      </>
    );
  }

  if (step === 0) {
    return (
      <>
        <DiagnosticTop />
        <main className="dg">
          <div className="fade">
            <div className="eyebrow"><em>EVO</em><span>·</span><span>Diagnostic express</span></div>
            <h1>Trouve ta <i>contrainte n°1</i>.</h1>
            <p className="lede">
              Tes chiffres des 7 derniers jours, lus avec les seuils EVO. Tu repars avec le point qui bloque en premier, et l&apos;action à mener demain.
            </p>
            <ul className="dg-facts">
              <li>3 minutes</li>
              <li>Gratuit</li>
              <li>Résultat immédiat</li>
            </ul>
          </div>
          <div className="dg-nav start">
            <button type="button" className="btn btn-gold" onClick={() => setStep(1)}>Commencer</button>
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            Des chiffres approximatifs suffisent. Ce qui compte, c&apos;est l&apos;ordre de grandeur.
          </p>
          <DiagnosticFooter />
        </main>
      </>
    );
  }

  const meta = STEPS[step - 1];
  const textField = (key: TextKey, label: string, opts: { type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string; optional?: boolean; hint?: string; prefix?: string; placeholder?: string } = {}) => (
    <div className={`dg-q${shown[key] ? " bad" : ""}`}>
      <label htmlFor={`f-${key}`}>{label}{opts.optional && <span className="opt">facultatif</span>}</label>
      <div className={opts.prefix ? "dg-affix pre" : undefined}>
        {opts.prefix && <span aria-hidden="true">{opts.prefix}</span>}
        <input
          id={`f-${key}`}
          className="dg-in"
          type={opts.type ?? "text"}
          inputMode={opts.inputMode}
          autoComplete={opts.autoComplete}
          autoCapitalize={opts.type === "email" || key === "instagram" ? "none" : undefined}
          spellCheck={false}
          placeholder={opts.placeholder}
          value={form[key]}
          onChange={(e) => set(key, key === "instagram" ? e.target.value.replace(/^\s*@+/, "") : e.target.value)}
          aria-invalid={!!shown[key]}
          aria-describedby={opts.hint || shown[key] ? `h-${key}` : undefined}
        />
      </div>
      {(shown[key] || opts.hint) && <p id={`h-${key}`} className={shown[key] ? "err" : "hint"}>{shown[key] || opts.hint}</p>}
    </div>
  );

  const igHint = (key: NumericKey): string | null => {
    if (!ig) return null;
    if (key === "reels") return `${ig.data.reels7d} reel${ig.data.reels7d > 1 ? "s" : ""} sur Instagram ces 7 derniers jours. Tu peux corriger.`;
    if (key === "stories" && ig.data.storiesLive !== null) {
      return `Instagram : ${ig.data.storiesLive} stor${ig.data.storiesLive > 1 ? "ies" : "y"} en ligne en ce moment. Les stories expirées ne sont pas lisibles : compte tes 7 jours à la main.`;
    }
    return null;
  };

  const numberField = ({ key, label, hint, suffix }: NumField) => (
    <div key={key} className={`dg-q${shown[key] ? " bad" : ""}`}>
      <label htmlFor={`f-${key}`}>
        {label}
        {key === "reels" && ig && <span className="ig-badge">Rempli depuis @{ig.data.username}</span>}
      </label>
      <div className={suffix ? "dg-affix" : undefined}>
        <input
          id={`f-${key}`}
          className="dg-in"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="next"
          value={form[key]}
          onChange={(e) => set(key, e.target.value.replace(/\D/g, "").slice(0, 7))}
          aria-invalid={!!shown[key]}
          aria-describedby={`h-${key}`}
        />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </div>
      <p id={`h-${key}`} className={shown[key] ? "err" : "hint"}>{shown[key] || igHint(key) || hint}</p>
    </div>
  );

  const igCard = () => {
    if (ig) {
      const d = ig.data;
      return (
        <div className="ig-done" role="status">
          <span className="ig-badge">Rempli depuis @{d.username}</span>
          <p>
            {d.reels7d} reel{d.reels7d > 1 ? "s" : ""} et {d.feed7d} publication{d.feed7d > 1 ? "s" : ""} sur 7 jours
            {d.followers !== null ? `, ${nf(d.followers)} abonnés` : ""}. Tout reste modifiable.
          </p>
          <p className="small muted">Lecture unique via l&apos;API officielle Meta. On ne garde aucun accès à ton compte.</p>
        </div>
      );
    }
    if (!showInstagram) return null;
    return (
      <section className="ig-card" aria-labelledby="ig-title">
        <p className="ig-tag">Facultatif · 20 secondes</p>
        <h3 id="ig-title">Remplir automatiquement avec Instagram</h3>
        <p>On lit tes reels des 7 derniers jours et leurs vues, une seule fois, pour pré-remplir cette étape.</p>
        <ul className="ig-points">
          <li>100 % API officielle Meta : tu te connectes chez Meta (Instagram ou Facebook), jamais ici.</li>
          <li>On lit tes chiffres une fois. On ne garde aucun accès à ton compte.</li>
          <li>Compte pro requis (créateur ou entreprise).</li>
        </ul>
        <button type="button" className="btn ig-btn" onClick={connectInstagram} disabled={igBusy}>
          {igBusy ? "Redirection vers Instagram…" : "Connecter mon Instagram"}
        </button>
      </section>
    );
  };

  const choiceField = (key: ChoiceKey, label: string, options: { value: string; label: string }[], opts: { hint?: string; one?: boolean } = {}) => (
    <fieldset className={`dg-q${shown[key] ? " bad" : ""}`}>
      <legend id={`l-${key}`}>{label}</legend>
      {opts.hint && <p className="hint">{opts.hint}</p>}
      <div className={`choices${opts.one ? " one" : ""}`} role="radiogroup" aria-labelledby={`l-${key}`}>
        {options.map((o, i) => (
          <button
            key={o.value}
            id={i === 0 ? `f-${key}` : undefined}
            type="button"
            role="radio"
            aria-checked={form[key] === o.value}
            className="choice"
            onClick={() => set(key, o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {shown[key] && <p className="err" role="alert">{shown[key]}</p>}
    </fieldset>
  );

  return (
    <>
      <DiagnosticTop count={`Étape ${step} sur ${TOTAL}`} progress={(step / TOTAL) * 100} />
      <main className="dg">
        <form
          className="dg-step fade"
          key={step}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <div>
            <div className="eyebrow"><em>{step}/{TOTAL}</em><span>·</span><span>{step === 3 ? "Contenu et messages" : step === 4 ? "Calls et ventes" : "Diagnostic express"}</span></div>
            <h2 ref={heading} tabIndex={-1}>{meta.title}</h2>
            <p className="sub">{meta.sub}</p>
          </div>

          {step === 1 && (
            <div className="dg-grid">
              <div className="dg-grid two">
                {textField("firstName", "Prénom", { autoComplete: "given-name" })}
                {textField("email", "Email", { type: "email", inputMode: "email", autoComplete: "email" })}
              </div>
              {textField("instagram", "Ton compte Instagram", { optional: true, prefix: "@", autoComplete: "off", placeholder: "toncompte" })}
              {choiceField("activity", "Ton activité", ACTIVITIES)}
              {choiceField("revenueRange", "Ton CA mensuel actuel", RANGE_OPTIONS, { hint: `En moyenne sur les 3 derniers mois. ${APPROX}` })}
              {choiceField("goalRange", "Ton objectif de CA mensuel dans 6 mois", RANGE_OPTIONS)}
              <div className={`dg-q${shown.goalExact ? " bad" : ""}`}>
                <label htmlFor="f-goalExact">Montant exact de ton objectif<span className="opt">facultatif</span></label>
                <div className="dg-affix">
                  <input
                    id="f-goalExact"
                    className="dg-in"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={form.goalExact}
                    onChange={(e) => setGoalExact(e.target.value)}
                    aria-invalid={!!shown.goalExact}
                    aria-describedby="h-goalExact"
                    style={{ paddingRight: 90 }}
                  />
                  <span aria-hidden="true">€ / mois</span>
                </div>
                <p id="h-goalExact" className={shown.goalExact ? "err" : "hint"}>{shown.goalExact || `Sinon on prend le milieu de la tranche. ${APPROX}`}</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="dg-grid">
              {STEP_NUMBERS[2].map(numberField)}
              {choiceField("clientsWithResult", "Tes clients ont-ils obtenu le résultat promis ?", CLIENTS_WITH_RESULT, { one: true })}
            </div>
          )}

          {step === 3 && igCard()}
          {step === 3 && igNotice && <p className="notice" role="status">{igNotice}</p>}

          {(step === 3 || step === 4) && (
            <div className="dg-grid two">
              {STEP_NUMBERS[step].map(numberField)}
            </div>
          )}
          {step === 4 && choiceField("founderSaturated", "Tu fais encore tout toi-même ?", YES_NO, { hint: "Contenu, messages, calls, suivi des clients." })}

          {step === 5 && (
            <div className="dg-grid">
              {textField("phone", "Téléphone", { type: "tel", inputMode: "tel", autoComplete: "tel", optional: true, hint: "Seulement si tu préfères qu'on puisse t'appeler." })}
              <div className="dg-q">
                <label className={`consent${shown.consentCgu ? " bad" : ""}`}>
                  <input
                    id="f-consentCgu"
                    type="checkbox"
                    checked={form.consentCgu}
                    onChange={(e) => set("consentCgu", e.target.checked)}
                    aria-invalid={!!shown.consentCgu}
                    aria-describedby={shown.consentCgu ? "h-consentCgu" : undefined}
                  />
                  <span>
                    J&apos;accepte les <Link href="/mentions-legales" target="_blank">conditions d&apos;utilisation</Link> et la{" "}
                    <Link href="/confidentialite" target="_blank">politique de confidentialité</Link>
                    <small>Obligatoire. Tes réponses servent à calculer ton diagnostic.</small>
                  </span>
                </label>
                {shown.consentCgu && <p id="h-consentCgu" className="err" role="alert">{shown.consentCgu}</p>}
              </div>
              <label className="consent">
                <input type="checkbox" checked={form.consentRecontact} onChange={(e) => set("consentRecontact", e.target.checked)} />
                <span>
                  {CONSENT_LABELS.recontact}
                  <small>Facultatif. Tu peux te désinscrire à tout moment.</small>
                </span>
              </label>
              <div className="hp" aria-hidden="true">
                <label htmlFor="f-website">Site web</label>
                <input id="f-website" ref={honeypot} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
              </div>
            </div>
          )}

          {submitError && <p className="form-err" role="alert">{submitError}</p>}

          <div className="dg-nav">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={busy}>Retour</button>
            <button type="submit" className="btn btn-gold" disabled={busy}>
              {step < TOTAL ? "Continuer" : busy ? "Calcul en cours…" : "Voir ma contrainte n°1"}
            </button>
          </div>
        </form>
        <DiagnosticFooter />
      </main>
    </>
  );
}
