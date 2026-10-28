import Link from "next/link";
import { getClientAccount } from "@/lib/client-auth";
import { getJourney, type StepState } from "@/lib/journey";

// Prochaines actions concrètes de l'étape en cours
function nextActions(step: StepState) {
  const out: { label: string; hint: string }[] = [];
  for (const b of step.blocks) for (const i of b.items) {
    if (i.locked) continue;
    if (i.type === "checkbox" && !i.done) out.push({ label: i.label, hint: b.title });
    if (i.type === "deliverable" && ["a_faire", "a_corriger"].includes(i.deliverable!.status))
      out.push({ label: `${i.deliverable!.status === "a_corriger" ? "Corriger" : "Déposer"} « ${i.label} »`, hint: "Fiche" });
    if (i.type === "booking" && !i.done) out.push({ label: i.label, hint: b.title });
  }
  return out.slice(0, 3);
}

export default async function EspaceHome() {
  const account = (await getClientAccount())!;
  const steps = await getJourney(account.id);
  const current = steps.find((s) => s.unlocked && !s.completed) ?? steps[steps.length - 1];
  const actions = current ? nextActions(current) : [];

  return (
    <>
      <div>
        <div className="eyebrow"><em>Ton espace EVO</em>{account.brand && <><span>·</span><span>{account.brand}</span></>}</div>
        <h1>Bonjour{account.firstName ? <> <i>{account.firstName}</i></> : null}.</h1>
        <p className="lede">Ici, tu suis ton accompagnement étape par étape et tu déposes tes livrables. Tout est enregistré automatiquement.</p>
      </div>

      {current && (
        <section className="hero-card" aria-labelledby="cur">
          <div className="eyebrow"><em>Étape {current.order + 1}</em><span>·</span><span>en cours</span></div>
          <div className="hero-row">
            <h2 id="cur">{current.title}</h2>
            <span className="pct">{current.progress} %</span>
          </div>
          <div className="bar" role="progressbar" aria-valuenow={current.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de l'étape"><i style={{ width: `${current.progress}%` }} /></div>
          {current.subtitle && <p className="muted" style={{ margin: 0 }}>{current.subtitle}</p>}
          <div><Link href={`/espace/etape/${current.key}`} className="btn btn-gold">Continuer l&apos;étape {current.order + 1} →</Link></div>
        </section>
      )}

      {actions.length > 0 && current && (
        <section aria-labelledby="next">
          <h2 id="next" style={{ marginBottom: 12 }}>Tes prochaines actions</h2>
          <ul className="todo">
            {actions.map((a) => (
              <li key={a.label}><Link href={`/espace/etape/${current.key}`}><span>{a.label}</span><span className="muted small">{a.hint}</span></Link></li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="parcours">
        <h2 id="parcours" style={{ marginBottom: 12 }}>Ton parcours</h2>
        <div className="steps">
          {steps.map((s) => {
            const cls = s.completed ? "done" : s.unlocked ? "current" : "locked";
            const inner = (
              <>
                <span className="step-num" aria-hidden="true">{s.completed ? "✓" : s.order + 1}</span>
                <div>
                  <h3>Étape {s.order + 1} · {s.title}</h3>
                  <p className="muted small" style={{ margin: 0 }}>{s.completed ? "Terminée" : s.unlocked ? `En cours · ${s.progress} %` : s.subtitle || "Verrouillée"}</p>
                </div>
                {s.completed ? <span className="pill ok"><span className="dot" />Terminée</span>
                  : s.unlocked ? <span className="muted">→</span>
                  : <span className="pill">Verrouillée</span>}
              </>
            );
            return s.unlocked
              ? <Link key={s.id} href={`/espace/etape/${s.key}`} className={`step-row ${cls}`}>{inner}</Link>
              : <div key={s.id} className={`step-row ${cls}`}>{inner}</div>;
          })}
        </div>
      </section>
    </>
  );
}
