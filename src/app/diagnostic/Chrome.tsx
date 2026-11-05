import Link from "next/link";

/** Barre du haut : marque + compteur d'étape optionnel + barre de progression optionnelle. */
export function DiagnosticTop({ count, progress }: { count?: string; progress?: number }) {
  return (
    <header className="top dg-top">
      <div className="top-in">
        <Link href="/diagnostic" className="brand" aria-label="EVO, Diagnostic express">
          <b>EVO</b>
          <span>Diagnostic express</span>
        </Link>
        {count && <span className="step-count">{count}</span>}
      </div>
      {progress !== undefined && (
        <div className="dg-prog" role="progressbar" aria-label="Progression" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <i style={{ width: `${progress}%` }} />
        </div>
      )}
    </header>
  );
}

export function DiagnosticFooter() {
  return (
    <footer className="dg-foot">
      <span>EVO Incubator</span>
      <span aria-hidden="true">·</span>
      <span>Hoguet Capital</span>
      <span aria-hidden="true">·</span>
      <Link href="/mentions-legales">Mentions légales</Link>
      <span aria-hidden="true">·</span>
      <Link href="/confidentialite">Confidentialité</Link>
      <span aria-hidden="true">·</span>
      <Link href="/cgu">CGU</Link>
    </footer>
  );
}
