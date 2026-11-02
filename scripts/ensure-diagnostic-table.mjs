// Crée la table DiagnosticLead si elle n'existe pas (lancé au build Vercel).
// Idempotent et strictement additif : ne touche à aucune autre table.
// Le projet ne passe pas par prisma migrate, d'où ce script ciblé.
import { PrismaClient } from "@prisma/client";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "DiagnosticLead" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "instagram" TEXT,
    "activity" TEXT NOT NULL,
    "revenueRange" TEXT NOT NULL,
    "goalRange" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "constraintKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "consentCgu" BOOLEAN NOT NULL DEFAULT false,
    "consentRecontact" BOOLEAN NOT NULL DEFAULT false,
    "consentLabels" TEXT,
    "consentAt" TIMESTAMP(3),
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "calendlyClickAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiagnosticLead_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "DiagnosticLead_email_idx" ON "DiagnosticLead"("email")`,
  `CREATE INDEX IF NOT EXISTS "DiagnosticLead_constraintKey_idx" ON "DiagnosticLead"("constraintKey")`,
  `CREATE INDEX IF NOT EXISTS "DiagnosticLead_createdAt_idx" ON "DiagnosticLead"("createdAt")`,
];

if (!process.env.DATABASE_URL) {
  console.log("[ensure-diagnostic-table] DATABASE_URL absente, étape ignorée.");
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  console.log("[ensure-diagnostic-table] Table DiagnosticLead prête.");
} catch (e) {
  // Ne bloque pas le déploiement du reste du site.
  console.warn("[ensure-diagnostic-table] Échec :", e instanceof Error ? e.message : e);
} finally {
  await prisma.$disconnect();
}
