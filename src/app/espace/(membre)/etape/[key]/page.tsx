import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getClientAccount } from "@/lib/client-auth";
import { getJourney } from "@/lib/journey";
import { CheckItem, DeliverableCard, BookingItem } from "./Items";

const Lock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);

export default async function StepPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const account = (await getClientAccount())!;
  const host = (await headers()).get("host") || "";
  const steps = await getJourney(account.id);
  const step = steps.find((s) => s.key === key);
  if (!step) notFound();

  if (!step.unlocked) {
    return (
      <>
        <Link href="/espace" className="back">← Mon espace</Link>
        <div className="locked-box"><Lock /><div><h2>Étape {step.order + 1} · {step.title}</h2><p style={{ margin: "6px 0 0" }}>{step.subtitle || "Cette étape se débloque quand la précédente est terminée."}</p></div></div>
      </>
    );
  }

  const deliverables = step.blocks.flatMap((b) => b.items).filter((i) => i.type === "deliverable");
  const submitted = deliverables.filter((d) => d.deliverable!.status !== "a_faire").length;

  return (
    <>
      <div>
        <Link href="/espace" className="back">← Mon espace</Link>
        <div className="eyebrow" style={{ marginTop: 18 }}><em>Étape {step.order + 1}</em><span>·</span><span>{step.completed ? "terminée" : `${step.progress} % complété`}</span></div>
        <h1>{step.title}</h1>
        {step.subtitle && <p className="lede">{step.subtitle}</p>}
        <div className="bar" style={{ marginTop: 18 }} role="progressbar" aria-valuenow={step.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de l'étape"><i style={{ width: `${step.progress}%` }} /></div>
      </div>

      {step.blocks.map((b, bi) => (
        <section key={b.id} className="block" aria-labelledby={`b-${b.key}`}>
          <div className="block-head">
            <div className="eyebrow"><em>Bloc {bi + 1}</em>{b.items.some((i) => i.type === "deliverable") && <><span>·</span><span>{submitted}/{deliverables.length} déposées</span></>}</div>
            <h2 id={`b-${b.key}`}>{b.title}</h2>
            {b.description && <p className="muted" style={{ margin: 0 }}>{b.description}</p>}
          </div>
          <div className="items">
            {b.items.map((i) => {
              const url = typeof i.config.url === "string" ? i.config.url : "";
              switch (i.type) {
                case "link":
                  return url
                    ? <div key={i.id}><a className="btn btn-ghost" href={url} target="_blank" rel="noopener noreferrer">{i.label} ↗</a></div>
                    : <div key={i.id} style={{ display: "grid", gap: 6, justifyItems: "start" }}><span className="btn btn-ghost" aria-disabled="true">{i.label}</span><span className="muted small">Lien bientôt disponible</span></div>;
                case "checkbox":
                  return <CheckItem key={i.id} id={i.id} label={i.label} doneAt={i.doneAt} />;
                case "deliverable":
                  return <DeliverableCard key={i.id} item={i} accountId={account.id} index={deliverables.findIndex((d) => d.id === i.id) + 1} />;
                case "booking":
                  return i.locked
                    ? <div key={i.id} className="locked-box"><Lock /><div><strong>{i.label}</strong><p style={{ margin: "4px 0 0" }}>{String(i.config.lockedMessage || "Cet élément se débloque plus tard.")}</p><p className="small muted" style={{ margin: "6px 0 0" }}>{submitted}/{deliverables.length} fiches déposées</p></div></div>
                    : <BookingItem key={i.id} id={i.id} label={i.label} url={String(i.config.calendlyUrl || "")} host={host} doneAt={i.doneAt} />;
                case "validation":
                  return (
                    <div key={i.id} style={{ display: "grid", gap: 8 }}>
                      <p className="small muted" style={{ margin: 0 }}>{i.label} · cochées par Baptiste après ton call</p>
                      <div className="checks">
                        {i.checks!.map((c) => <div key={c.label} className={`vcheck${c.done ? " on" : ""}`}><span aria-hidden="true">{c.done ? "✓" : "○"}</span>{c.label}</div>)}
                      </div>
                    </div>
                  );
              }
            })}
          </div>
        </section>
      ))}
    </>
  );
}
