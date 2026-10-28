// Modèle de parcours « Accompagnement EVO » — idempotent : relancer met à jour titres et libellés,
// mais NE remplace PAS la config d'un élément déjà existant (les liens réglés côté coach sont conservés).
// Lancer : npx tsx prisma/seed-journey.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Item = { key: string; type: string; label: string; config?: Record<string, unknown> };
type Block = { key: string; title: string; description?: string; items: Item[] };
type Step = { key: string; title: string; subtitle?: string; blocks: Block[] };

const STEPS: Step[] = [
  {
    key: "etape-1",
    title: "Poser les fondations",
    subtitle: "Ton offre, ton marché, ton avatar et ton prix, validés avec Baptiste.",
    blocks: [
      {
        key: "module-1",
        title: "Module 1",
        description: "Commence par visionner le module 1 : il t'explique comment remplir tes fiches.",
        items: [
          { key: "module-1-lien", type: "link", label: "Ouvrir le module 1 dans Skool", config: { url: "" } },
          { key: "module-1-vu", type: "checkbox", label: "J'ai visionné le module 1" },
        ],
      },
      {
        key: "fiches",
        title: "Tes 5 fiches",
        description: "Elles sont toutes accessibles dès maintenant. Suis l'ordre conseillé : chaque fiche nourrit la suivante.",
        items: [
          { key: "fiche-avatar", type: "deliverable", label: "Avatar et verbatim", config: { category: "ICP", purpose: "Les mots exacts de tes prospects. Ils nourrissent le copywriting des ads et les scripts de contenu.", templateUrl: "", maxMB: 10 } },
          { key: "fiche-angle", type: "deliverable", label: "Grille angle différenciant", config: { category: "Positionnement", purpose: "Donne les angles des créatives de tes follow ads.", templateUrl: "", maxMB: 10 } },
          { key: "fiche-phrase-offre", type: "deliverable", label: "Phrase d'offre", config: { category: "Offre", purpose: "La formulation réutilisée partout : bio, ads, calls.", templateUrl: "", maxMB: 10 } },
          { key: "fiche-mecanisme", type: "deliverable", label: "Worksheet mécanisme et nom", config: { category: "Offre", purpose: "Le mécanisme propriétaire qui justifie le high ticket.", templateUrl: "", maxMB: 10 } },
          { key: "fiche-tarifs", type: "deliverable", label: "Grille tarifaire comptant / échelonné", config: { category: "Prix", purpose: "Ton prix final et tes facilités de paiement, prêts pour tes premiers calls.", templateUrl: "", maxMB: 10 } },
        ],
      },
      {
        key: "outils",
        title: "Outils",
        items: [
          { key: "insider-lien", type: "link", label: "Créer mon compte Insider", config: { url: "" } },
          { key: "insider-cree", type: "checkbox", label: "Compte créé" },
        ],
      },
      {
        key: "call-validation",
        title: "Call de validation avec Baptiste",
        description: "On relit tes fiches ensemble et on valide ton offre, ton marché, ton avatar et ton prix.",
        items: [
          { key: "call-reservation", type: "booking", label: "Réserver mon call de validation", config: { calendlyUrl: "", lockedMessage: "Dépose tes 5 fiches pour débloquer la réservation de ton call. Baptiste a besoin de les lire avant de te voir." } },
          { key: "call-validations", type: "validation", label: "Validations de Baptiste", config: { checks: ["Offre", "Marché", "Avatar", "Prix"] } },
        ],
      },
    ],
  },
  {
    key: "etape-2",
    title: "Étape 2",
    subtitle: "Se débloque après la validation de l'étape 1.",
    blocks: [],
  },
];

async function main() {
  const template = await prisma.journeyTemplate.upsert({
    where: { key: "evo-accompagnement" },
    update: { name: "Accompagnement EVO" },
    create: { key: "evo-accompagnement", name: "Accompagnement EVO" },
  });

  for (const [si, s] of STEPS.entries()) {
    const step = await prisma.journeyStep.upsert({
      where: { templateId_key: { templateId: template.id, key: s.key } },
      update: { order: si, title: s.title, subtitle: s.subtitle ?? null },
      create: { templateId: template.id, key: s.key, order: si, title: s.title, subtitle: s.subtitle ?? null },
    });
    for (const [bi, b] of s.blocks.entries()) {
      const block = await prisma.stepBlock.upsert({
        where: { stepId_key: { stepId: step.id, key: b.key } },
        update: { order: bi, title: b.title, description: b.description ?? null },
        create: { stepId: step.id, key: b.key, order: bi, title: b.title, description: b.description ?? null },
      });
      for (const [ii, it] of b.items.entries()) {
        await prisma.blockItem.upsert({
          where: { blockId_key: { blockId: block.id, key: it.key } },
          update: { order: ii, type: it.type, label: it.label },
          create: { blockId: block.id, key: it.key, order: ii, type: it.type, label: it.label, config: JSON.stringify(it.config ?? {}) },
        });
      }
    }
  }
  const n = await prisma.blockItem.count({ where: { block: { step: { templateId: template.id } } } });
  console.log(`Parcours « ${template.name} » prêt : ${STEPS.length} étapes, ${n} éléments.`);
}

main().finally(() => prisma.$disconnect());
