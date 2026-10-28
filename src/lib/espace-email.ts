import { ADMIN_EMAIL, baseTemplate, goldButton, sendMail } from "@/lib/email";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

// Accès envoyés au client à la création de son espace
export async function sendSpaceCreated(to: string, firstName: string | null, password: string, baseUrl: string) {
  await sendMail({
    to,
    subject: "Ton espace EVO est prêt",
    html: baseTemplate(`
      <h1 style="margin:0 0 12px;font-size:22px;color:#0A0A0A;">Bienvenue${firstName ? " " + esc(firstName) : ""} 👋</h1>
      <p style="color:#3f3f46;line-height:1.6;">Merci pour ton questionnaire. Ton espace EVO est prêt : tu y suis ta progression et tu y déposes tes livrables.</p>
      <div style="background:#f4f4f5;border-radius:12px;padding:16px 20px;margin:20px 0;font-size:15px;color:#0A0A0A;">
        <p style="margin:0 0 6px;"><strong>Identifiant :</strong> ${esc(to)}</p>
        <p style="margin:0;"><strong>Mot de passe :</strong> <span style="font-family:monospace;">${esc(password)}</span></p>
      </div>
      ${goldButton("Entrer dans mon espace", `${baseUrl}/espace`)}
      <p style="color:#71717a;font-size:13px;">Tu peux changer ce mot de passe à tout moment dans « Mon compte ».</p>`),
  });
}

// Alerte équipe : une fiche vient d'être déposée
export async function sendDeliverableSubmitted(client: string, email: string, fiche: string, version: number) {
  await sendMail({
    to: ADMIN_EMAIL,
    subject: `Fiche déposée : ${fiche} — ${client}`,
    html: baseTemplate(`
      <h1 style="margin:0 0 12px;font-size:20px;color:#0A0A0A;">Nouvelle fiche à relire</h1>
      <p style="color:#3f3f46;line-height:1.6;"><strong>${esc(client)}</strong> (${esc(email)}) vient de déposer <strong>${esc(fiche)}</strong>${version > 1 ? ` (version ${version})` : ""}.</p>
      ${goldButton("Ouvrir l'espace coach", process.env.COACH_URL || "https://evo-coach-nu.vercel.app")}`),
  });
}

// Au client : sa fiche est validée ou à corriger (utilisé côté coach)
export async function sendDeliverableReviewed(to: string, firstName: string | null, fiche: string, status: "validee" | "a_corriger", comment: string | null, baseUrl: string) {
  const ok = status === "validee";
  await sendMail({
    to,
    subject: ok ? `Ta fiche « ${fiche} » est validée ✅` : `Ta fiche « ${fiche} » est à corriger`,
    html: baseTemplate(`
      <h1 style="margin:0 0 12px;font-size:20px;color:#0A0A0A;">${ok ? "Fiche validée" : "Quelques ajustements"}${firstName ? ", " + esc(firstName) : ""}</h1>
      <p style="color:#3f3f46;line-height:1.6;">${ok ? `Ta fiche <strong>${esc(fiche)}</strong> est validée. Bravo !` : `Ta fiche <strong>${esc(fiche)}</strong> a besoin de quelques corrections.`}</p>
      ${comment ? `<div style="border-left:3px solid #C9A84C;padding:8px 14px;margin:16px 0;color:#3f3f46;white-space:pre-wrap;">${esc(comment)}</div>` : ""}
      ${goldButton("Ouvrir mon espace", `${baseUrl}/espace`)}`),
  });
}
