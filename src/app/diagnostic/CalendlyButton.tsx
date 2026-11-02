"use client";

/** Lien Calendly : signale le clic au serveur sans bloquer la navigation. */
export function CalendlyButton({ href, leadId, className, children }: { href: string; leadId: string; className: string; children: React.ReactNode }) {
  function track() {
    const url = `/api/diagnostic/${encodeURIComponent(leadId)}/calendly`;
    try {
      if (navigator.sendBeacon?.(url)) return;
    } catch {}
    fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  }

  return (
    <a href={href} className={className} onClick={track} rel="noopener">
      {children}
    </a>
  );
}
