/**
 * Snapshots Instagram en base : création, lecture pour le formulaire, rattachement au lead,
 * nettoyage et suppression à la demande de Meta. Aucun jeton n'est jamais stocké.
 */
import { randomBytes } from "node:crypto";
import type { InstagramSnapshot } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InstagramSummary } from "@/lib/diagnostic/types";
import { SNAPSHOT_ID_RE, SNAPSHOT_TTL_MS, UNLINKED_RETENTION_MS } from "./config";
import type { ReadResult } from "./api";

export function toSummary(s: InstagramSnapshot): InstagramSummary {
  return {
    username: s.username,
    accountType: s.accountType,
    followers: s.followers,
    reels7d: s.reels7d,
    feed7d: s.feed7d,
    storiesLive: s.storiesLive,
    reelViewsTotal: s.reelViewsTotal,
    reelViewsAvg: s.reelViewsAvg,
    topReelViews: s.topReelViews,
    topReelPermalink: s.topReelPermalink,
    fetchedAt: s.fetchedAt.toISOString(),
  };
}

export async function createSnapshot(r: ReadResult): Promise<string> {
  const s = r.summary;
  const row = await prisma.instagramSnapshot.create({
    data: {
      igUserId: r.igUserId,
      igScopedId: r.igScopedId,
      username: s.username,
      accountType: s.accountType,
      followers: s.followers,
      reels7d: s.reels7d,
      feed7d: s.feed7d,
      storiesLive: s.storiesLive,
      reelViewsTotal: s.reelViewsTotal,
      reelViewsAvg: s.reelViewsAvg,
      topReelViews: s.topReelViews,
      topReelPermalink: s.topReelPermalink,
      fetchedAt: new Date(s.fetchedAt),
    },
    select: { id: true },
  });
  return row.id;
}

/** Snapshot encore utilisable par le formulaire (créé il y a moins de 2 h, pas encore rattaché). */
export async function findFreshSnapshot(id: string): Promise<InstagramSnapshot | null> {
  if (!SNAPSHOT_ID_RE.test(id)) return null;
  return prisma.instagramSnapshot.findFirst({
    where: { id, leadId: null, createdAt: { gt: new Date(Date.now() - SNAPSHOT_TTL_MS) } },
  });
}

/** Nettoyage paresseux : snapshots jamais rattachés à un diagnostic, au-delà de 24 h. */
export async function purgeUnlinkedSnapshots(): Promise<void> {
  await prisma.instagramSnapshot.deleteMany({
    where: { leadId: null, createdAt: { lt: new Date(Date.now() - UNLINKED_RETENTION_MS) } },
  });
}

/**
 * Supprime toutes les données Instagram d'un compte (désautorisation ou demande de suppression) :
 * snapshots, et bloc `instagram` des diagnostics rattachés. Renvoie le nombre de snapshots supprimés.
 */
export async function deleteInstagramDataForUser(userId: string): Promise<number> {
  const where = { OR: [{ igUserId: userId }, { igScopedId: userId }] };
  const rows = await prisma.instagramSnapshot.findMany({ where, select: { leadId: true } });
  const leadIds = [...new Set(rows.map((r) => r.leadId).filter((v): v is string => !!v))];
  for (const leadId of leadIds) {
    const lead = await prisma.diagnosticLead.findUnique({ where: { id: leadId }, select: { input: true } });
    if (!lead) continue;
    try {
      const input = JSON.parse(lead.input) as Record<string, unknown>;
      if (input && typeof input === "object" && "instagram" in input) {
        delete input.instagram;
        await prisma.diagnosticLead.update({ where: { id: leadId }, data: { input: JSON.stringify(input) } });
      }
    } catch {
      // input illisible : rien à retirer.
    }
  }
  const { count } = await prisma.instagramSnapshot.deleteMany({ where });
  return count;
}

/** Trace de la demande de suppression (aucune donnée personnelle : un code et un compteur). */
export async function recordDeletion(snapshotsDeleted: number): Promise<string> {
  const code = randomBytes(12).toString("hex");
  await prisma.instagramDeletion.create({ data: { id: code, snapshotsDeleted } });
  return code;
}

export async function findDeletion(code: string) {
  if (!/^[a-f0-9]{24}$/.test(code)) return null;
  return prisma.instagramDeletion.findUnique({ where: { id: code } });
}
