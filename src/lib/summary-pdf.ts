import { jsPDF } from "jspdf";
import { SUMMARY_BLOCKS, type PdfInput } from "@/lib/summary-shared";

// Helvetica standard (WinAnsi) : on normalise les caractères hors jeu
function t(s: unknown) {
  return String(s ?? "")
    .replace(/[  ]/g, " ").replace(/→/g, "->").replace(/≈/g, "~").replace(/×/g, "x")
    .replace(/[‘’]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/•/g, "-")
    .replace(/[^\x00-\xFF€]/g, "")
    // le € de Helvetica est mal mesuré par jsPDF : on lui laisse de l'air
    .replace(/€ (?=\S)/g, "€  ").replace(/€(?=[^\s])/g, "€ ");
}

export function summaryFilename(name: string) {
  const slug = name.normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "client";
  return `Synthese-onboarding-${slug}.pdf`;
}

export function buildSummaryPdf(d: PdfInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const sm = d.summary, M = 18, W = 210 - 2 * M, BOTTOM = 280;
  const NAVY: [number, number, number] = [11, 20, 48], GOLD: [number, number, number] = [184, 148, 58];
  const INK: [number, number, number] = [28, 32, 46], MUTED: [number, number, number] = [112, 120, 140], LINE: [number, number, number] = [222, 226, 235];
  let y = 0;
  const ensure = (h: number) => { if (y + h > BOTTOM) { doc.addPage(); y = 20; } };
  const para = (txt: string, size: number, color: [number, number, number], lh: number) => {
    doc.setFontSize(size); doc.setTextColor(...color);
    (doc.splitTextToSize(t(txt), W) as string[]).forEach((line) => { ensure(lh); doc.text(line, M, y); y += lh; });
  };
  const heading = (title: string) => {
    ensure(14); y += 3;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...NAVY);
    doc.text(t(title).toUpperCase(), M, y, { charSpace: 0.4 });
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.6); doc.line(M, y + 1.8, M + 12, y + 1.8);
    y += 7; doc.setFont("helvetica", "normal");
  };
  const bullets = (arr: string[], numbered = false) => arr.forEach((b, i) => {
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(t(b), W - 6) as string[];
    ensure(lines.length * 4.4 + 1);
    doc.setTextColor(...GOLD); doc.text(numbered ? `${i + 1}.` : "-", M + 0.5, y);
    doc.setTextColor(...INK); lines.forEach((l) => { doc.text(l, M + 6, y); y += 4.4; });
    y += 1;
  });

  // En-tête
  doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 40, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
  doc.text("EVO", M, 14, { charSpace: 2.2 });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(201, 168, 76);
  doc.text(t("SYNTHÈSE D'ONBOARDING"), M + 17, 14, { charSpace: 0.8 });
  doc.setFontSize(19); doc.setTextColor(255, 255, 255);
  doc.text(t(d.name), M, 28);
  doc.setFontSize(9); doc.setTextColor(170, 180, 205);
  if (d.brand) doc.text(t(d.brand), M, 34);
  const dt = new Date(d.submittedAt || Date.now()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  doc.text(t("Questionnaire envoyé le " + dt), 192, 28, { align: "right" });
  if (d.route) { doc.setTextColor(201, 168, 76); doc.text(t("Parcours : " + d.route), 192, 34, { align: "right" }); }
  y = 50;

  para(sm.resume, 10.5, INK, 5.2);
  y += 4;

  // Chiffres clés
  if (d.figures.length) {
    const cw = (W - 3 * 3) / 4, ch = 14, rows = Math.ceil(d.figures.length / 4);
    ensure(rows * (ch + 3) + 5);
    d.figures.forEach(([label, value], i) => {
      const cx = M + (i % 4) * (cw + 3), cy = y + Math.floor(i / 4) * (ch + 3);
      doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.roundedRect(cx, cy, cw, ch, 1.5, 1.5, "S");
      doc.setFontSize(6.5); doc.setTextColor(...MUTED); doc.text(t(label).toUpperCase(), cx + 3, cy + 5, { charSpace: 0.2 });
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(...INK);
      doc.text((doc.splitTextToSize(t(value), cw - 6) as string[])[0] || "-", cx + 3, cy + 10.8);
      doc.setFont("helvetica", "normal");
    });
    y += rows * (ch + 3) + 6;
  }

  for (const [k, label] of SUMMARY_BLOCKS) {
    const arr = sm[k] as string[];
    if (arr.length) { heading(label); bullets(arr); }
  }
  if (sm.priorites.length) { heading("Priorités du premier mois"); bullets(sm.priorites, true); }
  if (sm.questions.length) { heading("À creuser au premier call"); bullets(sm.questions); }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, 285, 210 - M, 285);
    doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    doc.text(t("Confidentiel · usage interne EVO · synthèse générée par IA à partir des réponses du client, à vérifier"), M, 290);
    doc.text(`${i} / ${pages}`, 210 - M, 290, { align: "right" });
  }
  return doc;
}
