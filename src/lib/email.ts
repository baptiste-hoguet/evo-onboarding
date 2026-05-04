import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

const FROM_EMAIL = `EVO INCUBATOR <${process.env.GMAIL_USER || "baptiste@evo-incubateur.fr"}>`;
const ADMIN_EMAIL = process.env.GMAIL_USER || "baptiste@evo-incubateur.fr";

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:28px;font-weight:800;color:#C9A84C;letter-spacing:2px;">EVO</span>
      <span style="font-size:13px;font-weight:700;color:#0A0A0A;display:block;margin-top:2px;letter-spacing:3px;">INCUBATOR</span>
    </div>
    <div style="background-color:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:36px;">
      ${content}
    </div>
    <div style="text-align:center;margin-top:20px;color:#71717a;font-size:12px;">
      <p style="margin:0;">EVO INCUBATOR — Plateforme d'onboarding</p>
    </div>
  </div>
</body>
</html>`;
}

function goldButton(text: string, url: string) {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background-color:#C9A84C;color:#000000;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;">${text}</a>
  </div>`;
}

async function sendMail(options: { to: string; subject: string; html: string }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export async function sendWelcomeEmail(
  clientEmail: string,
  portalUrl: string
) {
  await sendMail({
    to: clientEmail,
    subject: "Ton espace EVO est prêt 🚀",
    html: baseTemplate(`
      <h2 style="color:#C9A84C;margin-top:0;font-size:22px;font-weight:700;">Bienvenue chez EVO INCUBATOR !</h2>
      <p style="color:#3F3F46;line-height:1.7;font-size:15px;">Ton espace d'onboarding personnel est prêt. Clique sur le bouton ci-dessous pour commencer ton parcours.</p>
      ${goldButton("Accéder à mon espace", portalUrl)}
      <p style="color:#A1A1AA;font-size:12px;margin-bottom:0;text-align:center;">Ce lien est personnel et unique. Ne le partage pas.</p>
    `),
  });
}

export async function sendPaymentPendingToAdmin(
  clientName: string,
  clientEmail: string,
  offer: string,
  clientId: string
) {
  const adminUrl = `${process.env.NEXTAUTH_URL}/admin/clients/${clientId}`;
  await sendMail({
    to: ADMIN_EMAIL,
    subject: `💰 Virement à confirmer — ${clientName}`,
    html: baseTemplate(`
      <h2 style="color:#C9A84C;margin-top:0;font-size:20px;">Nouveau virement à confirmer</h2>
      <p style="color:#3F3F46;line-height:1.6;"><strong style="color:#0A0A0A;">${clientName}</strong> (${clientEmail}) a indiqué avoir effectué son virement pour l'offre <strong style="color:#C9A84C;">${offer}</strong>.</p>
      ${goldButton("Voir la fiche client", adminUrl)}
    `),
  });
}

export async function sendPaymentConfirmedEmail(
  clientEmail: string,
  portalUrl: string
) {
  await sendMail({
    to: clientEmail,
    subject: "Virement reçu ✅ — ton contrat t'attend",
    html: baseTemplate(`
      <h2 style="color:#10B981;margin-top:0;font-size:20px;">Virement confirmé !</h2>
      <p style="color:#3F3F46;line-height:1.6;">Ton virement a bien été reçu et validé par l'équipe EVO. Tu peux maintenant passer à l'étape suivante : la signature de ton contrat.</p>
      ${goldButton("Continuer mon onboarding", portalUrl)}
    `),
  });
}

export async function sendContractSignedEmail(
  clientEmail: string,
  clientName: string,
  portalUrl: string
) {
  await Promise.all([
    sendMail({
      to: clientEmail,
      subject: "Contrat signé ✅ — prochaine étape",
      html: baseTemplate(`
        <h2 style="color:#10B981;margin-top:0;font-size:20px;">Contrat signé !</h2>
        <p style="color:#3F3F46;line-height:1.6;">Ton contrat a bien été signé. Tu peux maintenant réserver ton call de démarrage.</p>
        ${goldButton("Réserver mon call", portalUrl)}
      `),
    }),
    sendMail({
      to: ADMIN_EMAIL,
      subject: `Contrat signé ✅ — ${clientName}`,
      html: baseTemplate(`
        <h2 style="color:#10B981;margin-top:0;font-size:20px;">Contrat signé</h2>
        <p style="color:#3F3F46;line-height:1.6;"><strong style="color:#0A0A0A;">${clientName}</strong> a signé son contrat.</p>
      `),
    }),
  ]);
}

export async function sendCallBookedEmail(
  clientName: string,
  clientId: string
) {
  const adminUrl = `${process.env.NEXTAUTH_URL}/admin/clients/${clientId}`;
  await sendMail({
    to: ADMIN_EMAIL,
    subject: `📅 Call booké — ${clientName}`,
    html: baseTemplate(`
      <h2 style="color:#C9A84C;margin-top:0;font-size:20px;">Call de démarrage réservé</h2>
      <p style="color:#3F3F46;line-height:1.6;"><strong style="color:#0A0A0A;">${clientName}</strong> a réservé son call de démarrage.</p>
      ${goldButton("Voir la fiche client", adminUrl)}
    `),
  });
}

export async function sendOnboardingCompleteEmail(
  clientEmail: string,
  clientName: string
) {
  await Promise.all([
    sendMail({
      to: clientEmail,
      subject: `🎉 Onboarding terminé — Bienvenue dans EVO !`,
      html: baseTemplate(`
        <h2 style="color:#C9A84C;margin-top:0;font-size:20px;">Bienvenue dans la communauté EVO !</h2>
        <p style="color:#3F3F46;line-height:1.6;">Ton onboarding est terminé. Tu fais maintenant partie de la famille EVO INCUBATOR. On a hâte de collaborer avec toi !</p>
        <p style="color:#3F3F46;line-height:1.6;">Rejoins le canal Slack pour commencer à échanger avec la communauté.</p>
        ${goldButton("Rejoindre le Slack EVO", "https://join.slack.com/t/evo-incubator/shared_invite/zt-3tp5dgmxv-GC88JtMwto5br0n8tX87pg")}
      `),
    }),
    sendMail({
      to: ADMIN_EMAIL,
      subject: `🎉 Onboarding terminé — ${clientName}`,
      html: baseTemplate(`
        <h2 style="color:#10B981;margin-top:0;font-size:20px;">Onboarding complété</h2>
        <p style="color:#3F3F46;line-height:1.6;"><strong style="color:#0A0A0A;">${clientName}</strong> a terminé son onboarding avec succès.</p>
      `),
    }),
  ]);
}

const QUESTIONNAIRE_SECTIONS = [
  { emoji: "🎯", title: "Vision & Offre", count: 5 },
  { emoji: "💰", title: "Produit & Pricing", count: 5 },
  { emoji: "📈", title: "Acquisition", count: 5 },
  { emoji: "🔄", title: "Funnel & Conversion", count: 5 },
  { emoji: "🎨", title: "Contenu & Branding", count: 5 },
  { emoji: "🚀", title: "Delivery & Expérience Client", count: 5 },
  { emoji: "👥", title: "Équipe & Organisation", count: 5 },
  { emoji: "⚡", title: "Problèmes & Priorités", count: 4 },
];

const ALL_QUESTIONS = [
  "Quelle est ton offre principale (en une phrase) ?",
  "Quel problème précis résous-tu ?",
  "Quelle transformation permets-tu au client ?",
  "Quelle est ta cible principale (avatar client) ?",
  "Quel est ton positionnement sur le marché ?",
  "Quels sont tes produits et offres actuels ?",
  "Quel est le prix de chaque offre ?",
  "Proposes-tu du paiement en plusieurs fois ?",
  "Quel est ton panier moyen actuel ?",
  "Quelle offre génère le plus de chiffre d'affaires ?",
  "Quels sont tes principaux canaux d'acquisition ? (Instagram, Ads, bouche-à-oreille, etc.)",
  "Combien de leads génères-tu par semaine ?",
  "Quel est ton coût d'acquisition client estimé ?",
  "As-tu déjà fait de la publicité ? Si oui, quels résultats ?",
  "Quel est ton principal levier d'acquisition aujourd'hui ?",
  "Décris ton funnel actuel (de leads jusqu'à clients).",
  "Quel est ton taux de conversion leads → calls ?",
  "Quel est ton taux de closing ?",
  "Utilises-tu un setter, un closer, ou les deux ?",
  "Combien de calls fais-tu par semaine ?",
  "Sur quelle(s) plateforme(s) es-tu actif ?",
  "Combien de contenus publies-tu par semaine ?",
  "Quel type de contenu fonctionne le mieux ?",
  "As-tu une stratégie de contenu claire ?",
  "Quel est ton principal objectif avec le contenu ?",
  "Comment délivres-tu ton service ? (Coaching, formation, done for you, etc.)",
  "Combien de clients peux-tu activer en même temps ?",
  "Quelle est la durée moyenne d'un de tes accompagnements ?",
  "As-tu un process interne documenté ?",
  "Quel est ton problème principal en delivery aujourd'hui ?",
  "Combien de personnes sont dans ton équipe ?",
  "Qui fait quoi dans ton équipe ?",
  "As-tu des freelances ou des prestataires ?",
  "Quel est ton rôle principal aujourd'hui ?",
  "Quel est ton plus gros blocage organisationnel ?",
  "Quel est ton plus gros problème aujourd'hui ?",
  "Que veux-tu débloquer en priorité ?",
  "Qu'as-tu déjà testé sans succès ?",
  "Quel est le principal frein à ta croissance ?",
];

export async function sendQuestionnaireToAdmin(
  clientName: string,
  clientEmail: string,
  offer: string | null,
  answers: Record<string, string>
) {
  let sectionHtml = "";
  let questionIndex = 0;

  for (const section of QUESTIONNAIRE_SECTIONS) {
    const rows = [];
    for (let i = 0; i < section.count; i++) {
      const key = `q${questionIndex}`;
      const question = ALL_QUESTIONS[questionIndex] || "";
      const answer = answers[key] || "<em style='color:#A1A1AA'>Sans réponse</em>";
      rows.push(`
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;vertical-align:top;width:45%;">
            <span style="color:#3F3F46;font-size:13px;">${question}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
            <span style="color:#0A0A0A;font-size:13px;font-weight:500;">${answer}</span>
          </td>
        </tr>
      `);
      questionIndex++;
    }

    sectionHtml += `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#C9A84C;text-transform:uppercase;letter-spacing:1px;">
          ${section.emoji} ${section.title}
        </h3>
        <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden;">
          ${rows.join("")}
        </table>
      </div>
    `;
  }

  await sendMail({
    to: ADMIN_EMAIL,
    subject: `📋 Questionnaire complété — ${clientName} (${offer || "?"})`,
    html: baseTemplate(`
      <h2 style="color:#C9A84C;margin-top:0;font-size:20px;">Questionnaire complété</h2>
      <p style="color:#3F3F46;line-height:1.6;">
        <strong style="color:#0A0A0A;">${clientName}</strong> (${clientEmail}) — Offre <strong style="color:#C9A84C;">${offer || "?"}</strong>
      </p>
      <hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0;" />
      ${sectionHtml}
    `),
  });
}

export async function sendReminderEmail(
  clientEmail: string,
  portalUrl: string
) {
  await sendMail({
    to: clientEmail,
    subject: "N'oublie pas de finaliser ton onboarding EVO 🔔",
    html: baseTemplate(`
      <h2 style="color:#C9A84C;margin-top:0;font-size:20px;">Ton onboarding t'attend !</h2>
      <p style="color:#3F3F46;line-height:1.6;">On a remarqué que tu n'as pas encore terminé ton parcours d'onboarding. Reprends là où tu en étais !</p>
      ${goldButton("Reprendre mon onboarding", portalUrl)}
      <p style="color:#A1A1AA;font-size:12px;margin-bottom:0;">Si tu as des questions, n'hésite pas à nous contacter.</p>
    `),
  });
}
