/**
 * Alerte admin à chaque nouveau Diagnostic express.
 * Destinataire : DIAGNOSTIC_ALERT_EMAIL, sinon ADMIN_EMAIL. DIAGNOSTIC_ALERT=off coupe l'alerte.
 */
import { ADMIN_EMAIL, baseTemplate, goldButton, sendMail } from "@/lib/email";
import { activityLabel, constraintLabel, rangeLabel } from "@/lib/diagnostic-admin";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();

export interface DiagnosticAlert {
  id: string;
  firstName: string;
  email: string;
  instagram: string | null;
  activity: string;
  revenueRange: string;
  goalRange: string;
  constraint: string;
  title: string;
  score: number;
  consentRecontact: boolean;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  instagramConnected: boolean;
}

function row(label: string, valueHtml: string) {
  return `<tr>
    <td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;vertical-align:top;width:38%;color:#71717a;font-size:13px;">${label}</td>
    <td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;vertical-align:top;color:#0A0A0A;font-size:14px;font-weight:500;">${valueHtml}</td>
  </tr>`;
}

/** Sujet et HTML de l'alerte (sans envoi) : toutes les valeurs saisies par l'utilisateur sont échappées. */
export function diagnosticAlertEmail(d: DiagnosticAlert, base: string): { subject: string; html: string } {
  const constraint = constraintLabel(d.constraint);
  const utm = [d.utmSource, d.utmMedium, d.utmCampaign].filter((v): v is string => !!v);
  const yesNo = (v: boolean) => (v ? "Oui" : "Non");

  const rows = [
    row("Prénom", esc(d.firstName)),
    row("Email", `<a href="mailto:${esc(d.email)}" style="color:#0A0A0A;">${esc(d.email)}</a>`),
    row(
      "Instagram",
      d.instagram
        ? `<a href="https://www.instagram.com/${encodeURIComponent(d.instagram)}/" style="color:#0A0A0A;">@${esc(d.instagram)}</a>`
        : `<span style="color:#A1A1AA;">Non renseigné</span>`,
    ),
    row("Activité", esc(activityLabel(d.activity))),
    row("CA actuel → objectif", `${esc(rangeLabel(d.revenueRange))} <span style="color:#C9A84C;">→</span> ${esc(rangeLabel(d.goalRange))}`),
    row("Contrainte n°1", `<strong style="color:#C9A84C;">${esc(constraint)}</strong>${d.title ? `<br><span style="color:#3F3F46;font-weight:400;">${esc(d.title)}</span>` : ""}`),
    row("Score", esc(String(d.score))),
    row("Accepte d'être recontacté", yesNo(d.consentRecontact)),
    row("Source", utm.length ? esc(utm.join(" · ")) : `<span style="color:#A1A1AA;">Directe (aucune UTM)</span>`),
    row("Instagram connecté", yesNo(d.instagramConnected)),
  ].join("");

  return {
    subject: `Nouveau diagnostic : ${oneLine(d.firstName)} · ${constraint}`,
    html: baseTemplate(`
      <h2 style="color:#C9A84C;margin-top:0;font-size:20px;">Nouveau Diagnostic express</h2>
      <p style="color:#3F3F46;line-height:1.6;"><strong style="color:#0A0A0A;">${esc(d.firstName)}</strong> vient de terminer son diagnostic.</p>
      <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden;margin:16px 0;">
        ${rows}
      </table>
      ${goldButton("Voir la fiche", `${base}/admin/diagnostics/${encodeURIComponent(d.id)}`)}
    `),
  };
}

/** Envoie l'alerte, sauf si DIAGNOSTIC_ALERT=off. Lève en cas d'échec : à appeler hors du chemin de la réponse. */
export async function sendDiagnosticAlert(d: DiagnosticAlert, base: string): Promise<void> {
  if (process.env.DIAGNOSTIC_ALERT?.trim().toLowerCase() === "off") return;
  const to = process.env.DIAGNOSTIC_ALERT_EMAIL?.trim() || ADMIN_EMAIL;
  const { subject, html } = diagnosticAlertEmail(d, base);
  await sendMail({ to, subject, html });
}
