// Crée les tables InstagramSnapshot et InstagramDeletion si elles n'existent pas (lancé au build Vercel,
// après ensure-diagnostic-table.mjs). Idempotent et strictement additif. Aucune colonne de jeton.
import { PrismaClient } from "@prisma/client";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "InstagramSnapshot" (
    "id" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "igScopedId" TEXT,
    "username" TEXT NOT NULL,
    "accountType" TEXT,
    "followers" INTEGER,
    "reels7d" INTEGER NOT NULL,
    "feed7d" INTEGER NOT NULL,
    "storiesLive" INTEGER,
    "reelViewsTotal" INTEGER,
    "reelViewsAvg" INTEGER,
    "topReelViews" INTEGER,
    "topReelPermalink" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT,
    CONSTRAINT "InstagramSnapshot_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "InstagramSnapshot_igUserId_idx" ON "InstagramSnapshot"("igUserId")`,
  `CREATE INDEX IF NOT EXISTS "InstagramSnapshot_igScopedId_idx" ON "InstagramSnapshot"("igScopedId")`,
  `CREATE INDEX IF NOT EXISTS "InstagramSnapshot_leadId_idx" ON "InstagramSnapshot"("leadId")`,
  `CREATE INDEX IF NOT EXISTS "InstagramSnapshot_createdAt_idx" ON "InstagramSnapshot"("createdAt")`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InstagramSnapshot_leadId_fkey') THEN
      ALTER TABLE "InstagramSnapshot" ADD CONSTRAINT "InstagramSnapshot_leadId_fkey"
        FOREIGN KEY ("leadId") REFERENCES "DiagnosticLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "InstagramDeletion" (
    "id" TEXT NOT NULL,
    "snapshotsDeleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstagramDeletion_pkey" PRIMARY KEY ("id")
  )`,
];

if (!process.env.DATABASE_URL) {
  console.log("[ensure-instagram-tables] DATABASE_URL absente, étape ignorée.");
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  for (const sql of STATEMENTS) await prisma.$executeRawUnsafe(sql);
  console.log("[ensure-instagram-tables] Tables InstagramSnapshot et InstagramDeletion prêtes.");
} catch (e) {
  // Ne bloque pas le déploiement du reste du site.
  console.warn("[ensure-instagram-tables] Échec :", e instanceof Error ? e.message : e);
} finally {
  await prisma.$disconnect();
}
