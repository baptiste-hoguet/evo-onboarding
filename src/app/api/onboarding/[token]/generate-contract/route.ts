import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import fs from "fs";
import path from "path";

function numberToWords(n: number): string {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

  if (n === 0) return "zéro";
  if (n < 20) return units[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (t === 7) return "soixante-" + units[10 + u];
    if (t === 9) return "quatre-vingt-" + (u === 0 ? "" : units[u]);
    return tens[t] + (u === 1 && t !== 8 ? "-et-" : u ? "-" : "") + units[u];
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return (h === 1 ? "cent" : units[h] + " cent") + (rest ? " " + numberToWords(rest) : (h > 1 ? "s" : ""));
  }
  if (n < 1000000) {
    const k = Math.floor(n / 1000);
    const rest = n % 1000;
    return (k === 1 ? "mille" : numberToWords(k) + " mille") + (rest ? " " + numberToWords(rest) : "");
  }
  return n.toString();
}

function getPaymentDetails(offer: string | null, schedule: string | null) {
  const total = offer === "AGORA" ? 15000 : offer === "ATLAS" ? 50000 : 0;
  const parts = schedule === "2x" ? 2 : schedule === "3x" ? 3 : 1;
  const monthly = parts > 0 ? Math.round(total / parts) : total;
  const deposit = monthly;
  const balance = total - deposit;

  return { total, parts, monthly, deposit, balance };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const client = await prisma.client.findUnique({ where: { token } });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const templatePath = path.join(process.cwd(), "public/documents/templates/Contrat_AGORA_Template.docx");
  if (!fs.existsSync(templatePath)) {
    return NextResponse.json({ error: "Template introuvable" }, { status: 404 });
  }

  const templateBuffer = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(templateBuffer);

  const docFile = zip.file("word/document.xml");
  if (!docFile) return NextResponse.json({ error: "Document XML introuvable" }, { status: 500 });

  let xml = await docFile.async("string");

  const { total, parts, monthly, deposit, balance } = getPaymentDetails(client.offer, client.paymentSchedule);
  const today = new Date();
  const clientName = [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;

  // Calcul première échéance (1 mois après signature)
  const firstPayment = new Date(today);
  firstPayment.setMonth(firstPayment.getMonth() + 1);

  const replacements: Record<string, string> = {
    "[RAISON SOCIALE / NOM PRÉNOM DU CLIENT]": client.company || clientName,
    "[FORME JURIDIQUE]": "Entrepreneur individuel",
    "[MONTANT CAPITAL]": "0",
    "[VILLE RCS]": "Paris",
    "[N° SIREN/SIRET]": client.siret || "_______________",
    "[ADRESSE COMPLÈTE DU CLIENT]": client.address || "_______________",
    "[CIVILITÉ NOM PRÉNOM]": clientName,
    "[NOM PRÉNOM DU SIGNATAIRE CLIENT]": clientName,
    "[FONCTION]": "Gérant",
    "[DURÉE EN MOIS — ex. : cinq (5)]": "cinq (5)",
    "[MONTANT EN CHIFFRES]": `${total.toLocaleString("fr-FR")}`,
    "[MONTANT EN LETTRES]": numberToWords(total),
    "[MONTANT ACOMPTE]": `${deposit.toLocaleString("fr-FR")}`,
    "[MONTANT SOLDE]": `${balance.toLocaleString("fr-FR")}`,
    "[NOMBRE]": parts > 1 ? `${parts - 1}` : "1",
    "[MONTANT MENSUALITÉ]": `${monthly.toLocaleString("fr-FR")}`,
    "[JOUR DU MOIS]": "1",
    "[DATE PREMIÈRE ÉCHÉANCE]": formatDate(firstPayment),
    "[MULTIPLE — ex. : deux (2) fois]": parts === 2 ? "deux (2) fois" : parts === 3 ? "trois (3) fois" : "une (1) fois",
    "[MONTANT — ex. : douze (12) mois]": "six (6) mois",
    "[MONTANT FORFAITAIRE]": `${total.toLocaleString("fr-FR")} euros TTC`,
    "[LIEU DE SIGNATURE]": "Montigny-le-Bretonneux",
    "[DATE DE SIGNATURE]": formatDate(today),
    "[ADRESSE EMAIL CONTACT RGPD]": "contact@evo-incubateur.fr",
  };

  for (const [key, value] of Object.entries(replacements)) {
    // Escape XML special chars in the replacement value
    const safeValue = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    xml = xml.replaceAll(key, safeValue);
  }

  zip.file("word/document.xml", xml);
  const outputBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const filename = `Contrat_${clientName.replace(/\s+/g, "_")}_${client.offer || "EVO"}.docx`;

  return new NextResponse(outputBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
