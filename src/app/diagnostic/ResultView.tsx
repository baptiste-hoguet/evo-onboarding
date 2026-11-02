import Link from "next/link";
import type { DiagnosticResult, Pillar, StageReading, StageStatus } from "@/lib/diagnostic/types";
import { calendlyHref } from "@/lib/diagnostic/form";
import { CalendlyButton } from "./CalendlyButton";

const PILLARS: Record<Pillar, string> = {
  valeur: "Valeur",
  acquisition: "Acquisition",
  conversion: "Conversion",
  delivrer: "Délivrer",
  equipe: "Équipe",
};

const STATUS: Record<StageStatus, string> = {
  ok: "OK",
  alerte: "Alerte",
  insuffisant: "Pas assez de données",
};

const nf = (n: number, digits = 0) => n.toLocaleString("fr-FR", { maximumFractionDigits: digits });

export function formatValue(v: number | null, unit: StageReading["unit"]): string {
  if (v === null || !Number.isFinite(v)) return "—";
  if (unit === "pct") return `${nf(v * 100)} %`;
  if (unit === "eur") return `${nf(v, v < 100 ? 2 : 0)} €`;
  return nf(v, 1);
}

// Le titre du moteur peut déjà commencer par « Ta contrainte n°1 : » : on l'affiche en surtitre.
function cleanTitle(title: string) {
  const t = title.replace(/^\s*ta contrainte n°\s*1\s*:\s*/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function isLink(s: string) {
  return /^(https?:\/\/|\/)/.test(s);
}

export function ResultView({ result, leadId, firstName, email }: { result: DiagnosticResult; leadId: string; firstName: string; email: string }) {
  const key = result.stages.find((s) => s.key === result.constraint);
  const href = calendlyHref(firstName, email, result.constraint);

  return (
    <div className="dg-step fade">
      <div>
        <div className="eyebrow"><em>EVO</em><span>·</span><span>Ton diagnostic express</span></div>
        <h1>{firstName}, voici ta <i>contrainte n°1</i>.</h1>
        <p className="lede">Une seule chose à débloquer en premier. Le reste attendra.</p>
      </div>

      {result.lowConfidence && (
        <p className="notice">
          <b>Peu de données sur 7 jours.</b> Lis ce diagnostic comme une piste, pas comme un verdict. Refais-le dans deux semaines avec plus de volume.
        </p>
      )}

      <section className="res-card" aria-labelledby="res-title">
        <p className="kicker">Ta contrainte n°1 · {PILLARS[result.pillar] ?? result.pillar}</p>
        <h2 id="res-title">{cleanTitle(result.title)}</h2>
        <p className="msg">{result.message}</p>

        {key && key.value !== null && (
          <div className="key-num">
            <div>
              <small>Toi</small>
              <b className={key.status === "alerte" ? "bad-v" : key.status === "ok" ? "ok-v" : undefined}>{formatValue(key.value, key.unit)}</b>
            </div>
            <div>
              <small>Seuil EVO</small>
              <b>{formatValue(key.threshold, key.unit)}</b>
            </div>
            <div className="label">{key.label}</div>
          </div>
        )}

        <dl className="res-list">
          <div className="action">
            <dt>Ton action pour demain</dt>
            <dd>{result.action}</dd>
          </div>
          {result.lesson && (
            <div>
              <dt>La leçon à suivre</dt>
              <dd>{isLink(result.lesson) ? <a href={result.lesson} className="card-links"><u>{result.lesson}</u></a> : result.lesson}</dd>
            </div>
          )}
          {result.exitCriterion && (
            <div>
              <dt>Tu passes à la suite quand</dt>
              <dd>{result.exitCriterion}</dd>
            </div>
          )}
        </dl>
      </section>

      {result.showCallOffer && (
        <section className="cta-card">
          <h3>Tu veux un deuxième regard sur tes chiffres&nbsp;?</h3>
          <p className="muted" style={{ margin: 0 }}>
            Réserve un appel découverte avec EVO. On relit ton diagnostic ensemble et on choisit quoi attaquer en premier.
          </p>
          <CalendlyButton href={href} leadId={leadId} className="btn btn-gold">Réserver mon appel découverte</CalendlyButton>
        </section>
      )}

      {(result.dmPrice !== null || result.weeklyCallsNeeded !== null) && (
        <div className="stat-row">
          {result.dmPrice !== null && (
            <div className="stat">
              <small>Prix d&apos;un DM</small>
              <b>{formatValue(result.dmPrice, "eur")}</b>
              <span>Cash encaissé ÷ DM envoyés sur tes 7 derniers jours.</span>
            </div>
          )}
          {result.weeklyCallsNeeded !== null && (
            <div className="stat">
              <small>Calls à booker par semaine</small>
              <b>{nf(result.weeklyCallsNeeded, 1)}</b>
              <span>Pour viser ton objectif, à ton taux de closing actuel.</span>
            </div>
          )}
        </div>
      )}

      {result.stages.length > 0 && (
        <section className="block" aria-labelledby="funnel-title">
          <div className="block-head">
            <h2 id="funnel-title">Ton funnel, étape par étape</h2>
            <p className="muted small" style={{ margin: 0 }}>Tes chiffres des 7 derniers jours face aux seuils EVO.</p>
          </div>
          <ul className="funnel">
            {result.stages.map((s, i) => (
              <li key={`${s.key}-${i}`} className={s.key === result.constraint ? "is-key" : undefined}>
                <div className="f-label">
                  <small>{PILLARS[s.pillar] ?? s.pillar}</small>
                  {s.label}
                </div>
                <div className="f-val">
                  {formatValue(s.value, s.unit)}
                  {s.threshold !== null && <small>seuil {formatValue(s.threshold, s.unit)}</small>}
                </div>
                <div className="f-status">
                  <span className={`pill st-${s.status}`}><span className="dot" />{STATUS[s.status] ?? s.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="cta-row">
        {!result.showCallOffer && (
          <CalendlyButton href={href} leadId={leadId} className="btn btn-ghost">Réserver un appel découverte</CalendlyButton>
        )}
        <Link href="/diagnostic" className="linkbtn">Refaire le diagnostic</Link>
      </div>
      <p className="muted small" style={{ margin: 0 }}>Garde l&apos;adresse de cette page : elle te permet de retrouver ton diagnostic.</p>
    </div>
  );
}
